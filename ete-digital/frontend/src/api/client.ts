/**
 * API Client
 * Axios instance with authentication and error handling.
 *
 * Tokens are read from the in-memory store (authStore) rather than
 * localStorage to prevent XSS attacks from stealing JWT tokens.
 *
 * IMPORTANT — circular dependency note:
 *   client.ts → authStore.ts → api/auth.ts → client.ts
 *
 *   `getAccessToken`, `getRefreshToken`, and `setAccessToken` are safe to
 *   import statically because they are simple closures over module-level
 *   variables with no transitive imports that loop back to client.ts.
 *
 *   `useAuthStore` MUST remain a dynamic import inside the response
 *   interceptor. A static import would trigger the full circular chain at
 *   module evaluation time and cause `api` to be undefined when `auth.ts`
 *   first accesses it — breaking login entirely.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
    getAccessToken,
    getRefreshToken,
    setTokens,
} from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token from store
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Normalise FastAPI / Pydantic error responses so `error.response.data.detail`
 * is always a string. Without this, rendering `detail` directly in JSX crashes
 * React when detail is an array of ValidationError objects (422 responses).
 */
function normaliseErrorDetail(error: AxiosError): AxiosError {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (!data) return error;

    if (Array.isArray(data.detail)) {
        // Pydantic v2 validation errors → flatten to one readable message
        data.detail = (data.detail as Array<{ loc?: unknown; msg: string }>)
            .map((e) => {
                const field = Array.isArray(e.loc) ? e.loc.join('.') : String(e.loc ?? '');
                return field ? `${field}: ${e.msg}` : e.msg;
            })
            .join('; ');
    } else if (data.detail && typeof data.detail === 'object') {
        data.detail = JSON.stringify(data.detail);
    }
    return error;
}

/**
 * Refresh-token mutex.
 *
 * Problem: On a hard page refresh, multiple components mount and fire
 * authenticated requests concurrently. All of them receive a 401 (access
 * token expired) and each tries to call /api/auth/refresh independently.
 * The first one succeeds and the backend rotates (revokes + creates) the
 * refresh token. Every subsequent call uses the now-revoked token → another
 * 401 → the interceptor calls logout() → the user is kicked out.
 *
 * Solution: Only one refresh is ever in-flight at a time. Any additional
 * 401 responses that arrive while a refresh is in progress are queued as
 * pending promises. Once the refresh resolves (success or failure), every
 * queued request is either retried with the new token or rejected.
 */
let isRefreshing = false;
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
let failedQueue: QueueEntry[] = [];

function processQueue(error: unknown, token: string | null): void {
    failedQueue.forEach((entry) => {
        if (error) {
            entry.reject(error);
        } else {
            entry.resolve(token as string);
        }
    });
    failedQueue = [];
}

// Response interceptor - Handle token refresh + error normalisation
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        // Always normalise error detail FIRST so UI never crashes on raw objects
        normaliseErrorDetail(error);

        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {

            // If a refresh is already in flight, queue this request and wait
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return api(originalRequest);
                }).catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                    refresh_token: refreshToken,
                });

                const { access_token, refresh_token } = response.data as {
                    access_token: string;
                    refresh_token: string;
                };

                // Update in-memory token so ALL subsequent requests use the new token.
                // setTokens is safe to call statically — no circular dep.
                setTokens(access_token, refresh_token);

                // Resolve all queued requests with the new token
                processQueue(null, access_token);

                // Retry original request with new token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed — reject all queued requests first
                processQueue(refreshError, null);

                // Refresh failed — dynamic import to avoid the circular dep chain:
                // useAuthStore → authStore.ts → api/auth.ts → client.ts (this file)
                const { useAuthStore } = await import('../stores/authStore');
                await useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;

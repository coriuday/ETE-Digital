/**
 * API Client
 * Axios instance with authentication and error handling
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
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
    const data = error.response?.data as any;
    if (!data) return error;

    if (Array.isArray(data.detail)) {
        // Pydantic v2 validation errors → flatten to one readable message
        data.detail = (data.detail as any[])
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

// Response interceptor - Handle token refresh + error normalisation
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        // Always normalise error detail FIRST so UI never crashes on raw objects
        normaliseErrorDetail(error);

        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                    refresh_token: refreshToken,
                });

                const { access_token, refresh_token: newRefreshToken } = response.data;

                // Update tokens
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', newRefreshToken);

                // Retry original request
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

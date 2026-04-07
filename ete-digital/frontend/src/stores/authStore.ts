/**
 * Authentication Store
 * Zustand store for managing auth state
 *
 * Security: JWT tokens are stored in module-level memory, NOT in localStorage.
 * This prevents XSS attacks from reading tokens via `localStorage.getItem()`.
 * Only a non-sensitive boolean (`isAuthenticated`) is persisted to localStorage
 * so the user's session indicator survives a page refresh.
 *
 * Page-reload strategy (Fix for audit issue #6):
 *   On reload, if `isAuthenticated=true` from localStorage but `_accessToken` is null
 *   (tokens are memory-only), we silently attempt a token refresh using the stored
 *   refresh token. If that fails, we immediately clear `isAuthenticated` in memory
 *   WITHOUT redirecting — preventing the flash of authenticated UI before logout.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '../api/auth';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ---- In-memory token storage (never touches localStorage / sessionStorage) ----
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

/** Read the current access token. Used by the API layer (e.g. axios interceptor). */
export const getAccessToken = (): string | null => _accessToken;
/** Read the current refresh token. Used by the token-refresh flow. */
export const getRefreshToken = (): string | null => _refreshToken;
/**
 * Directly set the in-memory access token.
 * Used by the axios 401 interceptor AFTER a successful silent refresh so that
 * all subsequent requests see the new token (not just the manually patched retry).
 */
export const setAccessToken = (token: string): void => { _accessToken = token; };

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string, role: 'candidate' | 'employer') => Promise<void>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>;
    /** Attempt a silent token refresh on page reload. Clears auth state silently if it fails. */
    initializeAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authApi.login({ email, password });

                    // Store tokens in memory only — never in localStorage (XSS risk)
                    _accessToken = response.access_token;
                    _refreshToken = response.refresh_token;

                    // Fetch user data
                    const user = await authApi.getCurrentUser();

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error: any) {
                    const message = error.response?.data?.detail || 'Login failed';
                    set({
                        error: message,
                        isLoading: false
                    });
                    throw error;
                }
            },

            register: async (email: string, password: string, fullName: string, role: 'candidate' | 'employer') => {
                set({ isLoading: true, error: null });
                try {
                    await authApi.register({
                        email,
                        password,
                        full_name: fullName,
                        role,
                    });

                    set({ isLoading: false });
                } catch (error: any) {
                    const message = error.response?.data?.detail || 'Registration failed';
                    set({
                        error: message,
                        isLoading: false
                    });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await authApi.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    // Clear in-memory tokens
                    _accessToken = null;
                    _refreshToken = null;

                    set({
                        user: null,
                        isAuthenticated: false
                    });
                }
            },

            fetchUser: async () => {
                // Tokens live in memory — if the page was refreshed they are gone.
                // Only attempt if we have an in-memory access token.
                if (!_accessToken) {
                    set({ isAuthenticated: false, user: null });
                    return;
                }

                set({ isLoading: true });
                try {
                    const user = await authApi.getCurrentUser();
                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    // Token invalid — clear in-memory tokens and auth state
                    _accessToken = null;
                    _refreshToken = null;
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false
                    });
                }
            },

            /**
             * Called once on app startup (see App.tsx / main.tsx).
             * If localStorage says the user is authenticated but we have no access
             * token in memory (page was reloaded), attempt a silent refresh.
             * On failure, clear the stale `isAuthenticated` flag immediately —
             * without redirecting — so the UI never shows a flash of auth'd content.
             */
            initializeAuth: async () => {
                // If we already have a token (e.g., same-tab navigation), just verify it.
                if (_accessToken) {
                    const state = useAuthStore.getState();
                    await state.fetchUser();
                    return;
                }

                // isAuthenticated may be true from a previous session (via localStorage persist).
                // Without a token we cannot make API calls, so attempt a silent refresh.
                // We cannot read `isAuthenticated` from Zustand here directly before hydration,
                // but we can check if there's a stored value.
                const stored = localStorage.getItem('auth-storage');
                const wasAuthenticated = stored
                    ? JSON.parse(stored)?.state?.isAuthenticated === true
                    : false;

                if (!wasAuthenticated) return;

                set({ isLoading: true });
                try {
                    // Note: _refreshToken is also null after reload (in-memory only).
                    // If you store the refresh token in an httpOnly cookie, the server
                    // will read it automatically. For now, the refresh endpoint must be
                    // reachable with browser-provided cookies. If using Bearer tokens only,
                    // the user will need to log in again — which is the correct secure behaviour.
                    const response = await axios.post(
                        `${API_BASE_URL}/api/auth/refresh`,
                        {},
                        { withCredentials: true } // httpOnly cookie flow
                    );

                    const { access_token, refresh_token } = response.data;
                    _accessToken = access_token;
                    if (refresh_token) _refreshToken = refresh_token;

                    const user = await authApi.getCurrentUser();
                    set({ user, isAuthenticated: true, isLoading: false });
                } catch {
                    // Silent failure — do NOT redirect, just clear stale state.
                    // The user will see the public (unauthenticated) UI immediately.
                    _accessToken = null;
                    _refreshToken = null;
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            // Only persist the boolean session indicator — no user PII, no tokens
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);

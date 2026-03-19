/**
 * Authentication Store
 * Zustand store for managing auth state
 *
 * Security: JWT tokens are stored in module-level memory, NOT in localStorage.
 * This prevents XSS attacks from reading tokens via `localStorage.getItem()`.
 * Only a non-sensitive boolean (`isAuthenticated`) is persisted to localStorage
 * so the user's session indicator survives a page refresh.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '../api/auth';

// ---- In-memory token storage (never touches localStorage / sessionStorage) ----
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

/** Read the current access token. Used by the API layer (e.g. axios interceptor). */
export const getAccessToken = (): string | null => _accessToken;
/** Read the current refresh token. Used by the token-refresh flow. */
export const getRefreshToken = (): string | null => _refreshToken;

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

/**
 * Authentication Store
 * Zustand store for managing auth state.
 *
 * Tokens are stored in sessionStorage (not localStorage) so they are:
 *   - Preserved across page refreshes within the same tab (good UX)
 *   - Automatically cleared when the tab/browser is closed (security)
 *   - NOT accessible from other tabs (XSS isolation)
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi, User } from '../api/auth';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    /** Set to true when login returns requires_2fa: true */
    requiresTwoFactor: boolean;
    /** Short-lived partial token used to complete 2FA verification */
    partialToken: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string, role: 'candidate' | 'employer') => Promise<void>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>;
    initializeAuth: () => Promise<void>;
    clearError: () => void;
    setTokens: (accessToken: string, refreshToken?: string) => void;
    /** Complete 2FA login by verifying the TOTP code */
    completeTwoFactorLogin: (code: string) => Promise<void>;
    /** Called by OAuthCallbackPage — stores tokens then fetches user */
    setTokensFromOAuth: (accessToken: string, refreshToken: string, _role: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: false,
            error: null,
            accessToken: null,
            refreshToken: null,
            requiresTwoFactor: false,
            partialToken: null,

            setTokens: (accessToken: string, refreshToken?: string) => {
                const updates: Partial<AuthState> = { accessToken };
                if (refreshToken) updates.refreshToken = refreshToken;
                set(updates);
            },

            setTokensFromOAuth: async (accessToken: string, refreshToken: string, _role: string) => {
                set({ accessToken, refreshToken, isLoading: true });
                try {
                    const user = await authApi.getCurrentUser();
                    set({ user, isAuthenticated: true, isLoading: false, isInitialized: true });
                } catch {
                    // Fallback: build minimal user from role claim in token
                    set({ isAuthenticated: true, isLoading: false, isInitialized: true });
                }
            },

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null, requiresTwoFactor: false, partialToken: null });
                try {
                    const response = await authApi.login({ email, password });

                    // 2FA required — store partial token and surface the code input step
                    if (response.requires_2fa && response.partial_token) {
                        set({
                            requiresTwoFactor: true,
                            partialToken: response.partial_token,
                            isLoading: false,
                        });
                        return; // Do NOT throw — LoginPage will show the 2FA input
                    }

                    // Normal login — store full tokens and fetch user
                    set({
                        accessToken: response.access_token!,
                        refreshToken: response.refresh_token!,
                    });

                    const user = await authApi.getCurrentUser();
                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error: any) {
                    const message = error.response?.data?.detail || 'Login failed';
                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            completeTwoFactorLogin: async (code: string) => {
                const { partialToken } = get();
                if (!partialToken) {
                    throw new Error('No partial token available. Please log in again.');
                }
                set({ isLoading: true, error: null });
                try {
                    const response = await authApi.completeTwoFactor(partialToken, code);
                    set({
                        accessToken: response.access_token,
                        refreshToken: response.refresh_token,
                        requiresTwoFactor: false,
                        partialToken: null,
                    });
                    const user = await authApi.getCurrentUser();
                    set({ user, isAuthenticated: true, isLoading: false });
                } catch (error: any) {
                    const message = error.response?.data?.detail || 'Invalid code. Please try again.';
                    set({ error: message, isLoading: false });
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
                    set({
                        user: null,
                        isAuthenticated: false,
                        accessToken: null,
                        refreshToken: null
                    });
                }
            },

            fetchUser: async () => {
                const state = get();
                if (!state.accessToken) {
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
                    // If fetchUser fails (and refresh token interceptor fails to renew it), log out.
                    set({
                        user: null,
                        isAuthenticated: false,
                        accessToken: null,
                        refreshToken: null,
                        isLoading: false
                    });
                }
            },

            initializeAuth: async () => {
                const state = get();
                if (state.accessToken) {
                    try {
                        await state.fetchUser();
                        set({ isInitialized: true });
                    } catch (error) {
                        set({ isInitialized: true });
                    }
                } else {
                    set({ user: null, isAuthenticated: false, isInitialized: true });
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                user: state.user,
            }),
        }
    )
);

/** Helper functions for axios interceptors to avoid circular dependencies during initialization */
export const getAccessToken = (): string | null => useAuthStore.getState().accessToken;
export const getRefreshToken = (): string | null => useAuthStore.getState().refreshToken;
export const setTokens = (accessToken: string, refreshToken?: string): void => useAuthStore.getState().setTokens(accessToken, refreshToken);

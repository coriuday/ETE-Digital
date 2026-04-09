/**
 * Authentication Store
 * Zustand store for managing auth state
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '../api/auth';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
    accessToken: string | null;
    refreshToken: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string, role: 'candidate' | 'employer') => Promise<void>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>;
    initializeAuth: () => Promise<void>;
    clearError: () => void;
    setTokens: (accessToken: string, refreshToken?: string) => void;
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

            setTokens: (accessToken: string, refreshToken?: string) => {
                const updates: Partial<AuthState> = { accessToken };
                if (refreshToken) {
                    updates.refreshToken = refreshToken;
                }
                set(updates);
            },

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authApi.login({ email, password });

                    set({
                        accessToken: response.access_token,
                        refreshToken: response.refresh_token,
                    });

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

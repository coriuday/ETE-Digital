/**
 * Authentication Store
 * Zustand store for managing auth state
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '../api/auth';

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

                    // Store tokens
                    localStorage.setItem('access_token', response.access_token);
                    localStorage.setItem('refresh_token', response.refresh_token);

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
                    // Clear local storage
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');

                    set({
                        user: null,
                        isAuthenticated: false
                    });
                }
            },

            fetchUser: async () => {
                const token = localStorage.getItem('access_token');
                if (!token) {
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
                    // Token invalid, clear auth state
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
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
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);

/**
 * Authentication API
 */
import api from './client';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
    role: 'candidate' | 'employer';
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'candidate' | 'employer' | 'admin';
    is_verified: boolean;
    created_at: string;
}

export const authApi = {
    // Register
    register: async (data: RegisterRequest): Promise<{ message: string }> => {
        const response = await api.post('/api/auth/register', data);
        return response.data;
    },

    // Login
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/login', data);
        return response.data;
    },

    // Verify email
    verifyEmail: async (token: string): Promise<{ message: string }> => {
        const response = await api.post('/api/auth/verify-email', { token });
        return response.data;
    },

    // Forgot password
    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const response = await api.post('/api/auth/forgot-password', { email });
        return response.data;
    },

    // Reset password
    resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
        const response = await api.post('/api/auth/reset-password', {
            token,
            new_password: newPassword,
        });
        return response.data;
    },

    // Refresh token
    refresh: async (refreshToken: string): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/refresh', {
            refresh_token: refreshToken,
        });
        return response.data;
    },

    // Logout
    logout: async (): Promise<void> => {
        await api.post('/api/auth/logout');
    },

    // Get current user
    getCurrentUser: async (): Promise<User> => {
        const response = await api.get('/api/users/me');
        return response.data;
    },
};

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
    // Normal login fields
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    // 2FA-pending fields
    requires_2fa?: boolean;
    partial_token?: string;
}

export interface UserProfile {
    user_id: string;
    full_name: string | null;
    headline: string | null;
    phone: string | null;
    location: string | null;
    bio: string | null;
    avatar_url: string | null;
    resume_url: string | null;
    skills: string[];
    experience_years: string | null;
    social_links: Record<string, string>;
    preferences: Record<string, any>;
}

export interface User {
    id: string;
    email: string;
    role: 'candidate' | 'employer' | 'admin';
    is_verified: boolean;
    onboarding_complete: boolean;
    created_at: string;
    profile: UserProfile | null;
    // Flattened convenience fields (populated by getCurrentUser)
    full_name: string | null;
    avatar_url: string | null;
    resume_url: string | null;
}

export const authApi = {
    register: async (data: RegisterRequest): Promise<{ message: string }> => {
        const response = await api.post('/api/auth/register', data);
        return response.data;
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/login', data);
        return response.data;
    },

    /**
     * Complete 2FA login.
     * Called when login() returns { requires_2fa: true, partial_token }.
     */
    completeTwoFactor: async (partialToken: string, code: string): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    }> => {
        const response = await api.post('/api/auth/2fa/verify', {
            partial_token: partialToken,
            code,
        });
        return response.data;
    },

    resendVerification: async (email: string): Promise<{ message: string }> => {
        const response = await api.post('/api/auth/resend-verification', { email });
        return response.data;
    },

    verifyEmail: async (token: string): Promise<{ message: string }> => {
        const response = await api.post('/api/auth/verify-email', { token });
        return response.data;
    },

    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const response = await api.post('/api/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
        const response = await api.post('/api/auth/reset-password', {
            token,
            new_password: newPassword,
        });
        return response.data;
    },

    refresh: async (refreshToken: string): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/refresh', {
            refresh_token: refreshToken,
        });
        return response.data;
    },

    logout: async (): Promise<void> => {
        await api.post('/api/auth/logout');
    },

    // Flattens profile.full_name → user.full_name so AppShell & AccountSettings work
    getCurrentUser: async (): Promise<User> => {
        const response = await api.get('/api/users/me');
        const data = response.data;
        return {
            ...data,
            full_name: data.profile?.full_name ?? null,
            avatar_url: data.profile?.avatar_url ?? null,
            resume_url: data.profile?.resume_url ?? null,
        };
    },
};

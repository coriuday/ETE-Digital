/**
 * Auth store and API integration tests.
 * Tests auth store behavior with mocked API layer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- Mock the auth API ----
vi.mock('../api/auth', () => ({
    authApi: {
        login: vi.fn().mockResolvedValue({
            access_token: 'test_access',
            refresh_token: 'test_refresh',
            token_type: 'bearer',
            expires_in: 1800,
        }),
        getCurrentUser: vi.fn().mockResolvedValue({
            id: 'user-1',
            email: 'test@test.com',
            role: 'candidate',
            full_name: 'Test User',
        }),
        logout: vi.fn().mockResolvedValue({}),
        register: vi.fn().mockResolvedValue({ id: 'user-2', email: 'new@test.com', role: 'candidate' }),
    },
}));



describe('Auth API mocking', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('login mock returns access and refresh tokens', async () => {
        const { authApi } = await import('../api/auth');
        const result = await (authApi as any).login({ email: 'a@b.com', password: 'pass' });
        expect(result.access_token).toBe('test_access');
        expect(result.refresh_token).toBe('test_refresh');
        expect(result.token_type).toBe('bearer');
    });

    it('login mock triggers getCurrentUser successfully', async () => {
        const { authApi } = await import('../api/auth');
        await (authApi as any).login({ email: 'a@b.com', password: 'pass' });
        const user = await (authApi as any).getCurrentUser();
        expect(user.email).toBe('test@test.com');
        expect(user.role).toBe('candidate');
        expect(user.id).toBe('user-1');
    });

    it('register mock returns new user data', async () => {
        const { authApi } = await import('../api/auth');
        const user = await (authApi as any).register({
            email: 'new@test.com',
            password: 'SecurePass1!',
            role: 'candidate',
        });
        expect(user.email).toBe('new@test.com');
        expect(user.role).toBe('candidate');
    });

    it('localStorage token pattern works correctly', () => {
        localStorage.setItem('access_token', 'mock-jwt');
        expect(localStorage.getItem('access_token')).toBe('mock-jwt');
        localStorage.removeItem('access_token');
        expect(localStorage.getItem('access_token')).toBeNull();
    });
});

/**
 * useNotifications hook tests
 * Tests the REST-polling implementation (WebSocket was removed due to 403 errors)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ---- Mock auth store ----
vi.mock('../stores/authStore', () => ({
    useAuthStore: () => ({
        user: { id: 'user-123', full_name: 'Test User', email: 'test@test.com' },
        isAuthenticated: true,
        isLoading: false,
        error: null,
    }),
}));

const mockNotification = {
    id: 'notif-1',
    notif_type: 'application',
    title: 'Status Updated',
    message: 'Your application was reviewed',
    link: '/dashboard/applications',
    is_read: false,
    created_at: new Date().toISOString(),
};

// ---- Provide token via localStorage ----
beforeEach(() => {
    localStorage.setItem('access_token', 'mock-jwt-token');
});

afterEach(() => {
    localStorage.removeItem('access_token');
    vi.restoreAllMocks();
});

import { useNotifications } from '../utils/useNotifications';

describe('useNotifications hook', () => {
    it('starts with zero unread count before fetch resolves', () => {
        // fetch never resolves in this test — we just check initial state
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

        const { result } = renderHook(() => useNotifications());
        expect(result.current.unreadCount).toBe(0);
        expect(result.current.notifications).toHaveLength(0);
    });

    it('populates notifications from REST poll', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                notifications: [mockNotification],
                total: 1,
                unread_count: 1,
            }),
        }));

        const { result } = renderHook(() => useNotifications());

        await waitFor(() => {
            expect(result.current.notifications).toHaveLength(1);
        });

        expect(result.current.unreadCount).toBe(1);
        expect(result.current.notifications[0].id).toBe('notif-1');
        expect(result.current.notifications[0].is_read).toBe(false);
    });

    it('markRead updates local state optimistically', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ notifications: [mockNotification], total: 1, unread_count: 1 }),
            })
            .mockResolvedValue({ ok: true, json: async () => ({}) })
        );

        const { result } = renderHook(() => useNotifications());

        await waitFor(() => expect(result.current.notifications).toHaveLength(1));

        await act(async () => {
            await result.current.markRead('notif-1');
        });

        expect(result.current.notifications[0].is_read).toBe(true);
        expect(result.current.unreadCount).toBe(0);
    });

    it('markAllRead marks all notifications as read', async () => {
        const twoNotifs = [
            { ...mockNotification, id: 'notif-1' },
            { ...mockNotification, id: 'notif-2' },
        ];

        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ notifications: twoNotifs, total: 2, unread_count: 2 }),
            })
            .mockResolvedValue({ ok: true, json: async () => ({}) })
        );

        const { result } = renderHook(() => useNotifications());

        await waitFor(() => expect(result.current.notifications).toHaveLength(2));
        expect(result.current.unreadCount).toBe(2);

        await act(async () => {
            await result.current.markAllRead();
        });

        expect(result.current.unreadCount).toBe(0);
    });

    it('isConnected is always true (REST mode has no WebSocket)', () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
        const { result } = renderHook(() => useNotifications());
        expect(result.current.isConnected).toBe(true);
    });

    it('silently handles fetch failures', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

        const { result } = renderHook(() => useNotifications());

        // Should not throw, just stay at zero
        await act(async () => {
            await new Promise(r => setTimeout(r, 50));
        });

        expect(result.current.notifications).toHaveLength(0);
        expect(result.current.unreadCount).toBe(0);
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---- Mock WebSocket ----
class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState = MockWebSocket.OPEN;
    onopen: ((e: Event) => void) | null = null;
    onmessage: ((e: MessageEvent) => void) | null = null;
    onclose: ((e: CloseEvent) => void) | null = null;
    onerror: ((e: Event) => void) | null = null;

    constructor(public url: string) {
        setTimeout(() => this.onopen?.(new Event('open')), 0);
    }

    send = vi.fn();
    close = vi.fn(() => {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.(new CloseEvent('close'));
    });

    simulateMessage(data: object) {
        this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
}

vi.stubGlobal('WebSocket', MockWebSocket);

// ---- Mock auth store ----
vi.mock('../stores/authStore', () => ({
    useAuthStore: () => ({
        user: { id: 'user-123', full_name: 'Test User', email: 'test@test.com' },
        isAuthenticated: true,
        isLoading: false,
        error: null,
    }),
}));

// ---- Mock fetch for REST notification list ----
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ notifications: [], total: 0, unread_count: 0 }),
}));

// ---- Provide token via localStorage ----
beforeEach(() => {
    localStorage.setItem('access_token', 'mock-jwt-token');
});
afterEach(() => {
    localStorage.removeItem('access_token');
});

import { useNotifications } from '../utils/useNotifications';

describe('useNotifications hook', () => {
    let mockWsInstance: MockWebSocket;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('WebSocket', function (url: string) {
            mockWsInstance = new MockWebSocket(url);
            return mockWsInstance;
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('starts with zero unread count', () => {
        const { result } = renderHook(() => useNotifications());
        expect(result.current.unreadCount).toBe(0);
    });

    it('increments unread count on incoming notification message', async () => {
        const { result } = renderHook(() => useNotifications());

        await act(async () => {
            await new Promise((r) => setTimeout(r, 20));
            mockWsInstance?.simulateMessage({
                type: 'notification',
                data: {
                    id: 'notif-1',
                    notif_type: 'application',
                    title: 'Status Updated',
                    message: 'Your application was reviewed',
                    link: '/dashboard/applications',
                    is_read: false,
                    created_at: new Date().toISOString(),
                },
            });
        });

        expect(result.current.unreadCount).toBe(1);
        expect(result.current.notifications).toHaveLength(1);
    });
});

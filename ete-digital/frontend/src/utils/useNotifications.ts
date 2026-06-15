/**
 * useNotifications — Real-time WebSocket + REST notification hook
 *
 * 1. Fetches existing notifications from REST API on mount
 * 2. Opens WebSocket to /api/ws/{user_id} and authenticates with JWT
 * 3. Appends incoming real-time pushes and updates unread count
 * 4. Reconnects on disconnect with exponential backoff (max 30s)
 * 5. Falls back to 60s polling if WebSocket is unavailable (CSP/proxy issues)
 *
 * Token source: getAccessToken() (in-memory, same as axios client)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { getAccessToken } from '../stores/authStore';
import { useAuthStore } from '../stores/authStore';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000');
const API_REST = `${API_BASE}/api`;
const WS_BASE  = API_BASE.replace(/^http/, 'ws').replace(/\/$/, '');
const MAX_BACKOFF_MS = 30_000;

export interface NotificationItem {
    id: string;
    type?: string;
    notif_type?: string;   // legacy alias used by old code
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
    read_at?: string;
}

interface UseNotificationsReturn {
    notifications: NotificationItem[];
    unreadCount: number;
    isConnected: boolean;
    loading: boolean;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    dismiss: (id: string) => void;
}

function getToken(): string | null {
    return getAccessToken();
}

export function useNotifications(): UseNotificationsReturn {
    const { user, isAuthenticated } = useAuthStore();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount]       = useState(0);
    const [isConnected, setIsConnected]       = useState(false);
    const [loading, setLoading]               = useState(true);

    const wsRef      = useRef<WebSocket | null>(null);
    const backoffRef = useRef(1_000);
    const mountedRef = useRef(true);

    // ── Fetch initial list via REST ────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        const token = getToken();
        if (!token) { setLoading(false); return; }
        try {
            const res = await fetch(`${API_REST}/notifications/?page_size=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!mountedRef.current) return;
            if (res.ok) {
                const data = await res.json();
                const items = (data.notifications ?? []).map((n: NotificationItem) => ({
                    ...n,
                    notif_type: n.notif_type || n.type || 'system',
                }));
                setNotifications(items);
                setUnreadCount(data.unread_count ?? items.filter((n: NotificationItem) => !n.is_read).length);
            }
        } catch {
            // Silently ignore
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    // ── WebSocket connection ───────────────────────────────────────────────
    const connectWS = useCallback(() => {
        if (!isAuthenticated || !user?.id) return;
        const token = getToken();
        if (!token) return;

        try {
            const ws = new WebSocket(`${WS_BASE}/api/ws/${user.id}`);
            wsRef.current = ws;

            ws.onopen = () => {
                ws.send(JSON.stringify({ type: 'auth', token }));
            };

            ws.onmessage = (event) => {
                if (!mountedRef.current) return;
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'connected') {
                        setIsConnected(true);
                        backoffRef.current = 1_000; // Reset backoff on success
                    }
                    if (msg.type === 'notification' && msg.data) {
                        const notif: NotificationItem = { ...msg.data, notif_type: msg.data.type || 'system' };
                        setNotifications((prev) => [notif, ...prev]);
                        if (!notif.is_read) setUnreadCount((c) => c + 1);
                    }
                } catch {
                    // Malformed message
                }
            };

            ws.onclose = () => {
                if (!mountedRef.current) return;
                setIsConnected(false);
                wsRef.current = null;
                const delay = Math.min(backoffRef.current, MAX_BACKOFF_MS);
                backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
                setTimeout(() => {
                    if (mountedRef.current && isAuthenticated) connectWS();
                }, delay);
            };

            ws.onerror = () => { ws.close(); };
        } catch {
            // WebSocket not available (CSP, proxy) — fall back to polling
            setIsConnected(false);
        }
    }, [isAuthenticated, user?.id]);

    useEffect(() => {
        mountedRef.current = true;
        fetchNotifications();
        connectWS();

        // Fallback polling every 60s (covers the case WS is blocked)
        const poll = setInterval(fetchNotifications, 60_000);

        return () => {
            mountedRef.current = false;
            clearInterval(poll);
            wsRef.current?.close();
        };
    }, [fetchNotifications, connectWS]);

    // ── Actions ───────────────────────────────────────────────────────────
    const markRead = useCallback(async (id: string) => {
        const token = getToken();
        if (!token) return;
        try {
            await fetch(`${API_REST}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch { /* silent */ }
    }, []);

    const markAllRead = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            await fetch(`${API_REST}/notifications/read-all`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    }, []);

    const dismiss = useCallback((id: string) => {
        setNotifications((prev) => {
            const target = prev.find((n) => n.id === id);
            if (target && !target.is_read) setUnreadCount((c) => Math.max(0, c - 1));
            return prev.filter((n) => n.id !== id);
        });
        const token = getToken();
        if (token) {
            fetch(`${API_REST}/notifications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
        }
    }, []);

    return { notifications, unreadCount, isConnected, loading, markRead, markAllRead, dismiss };
}

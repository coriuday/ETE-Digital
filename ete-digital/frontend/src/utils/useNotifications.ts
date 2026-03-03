/**
 * useNotifications — Real-time notification hook
 *
 * Connects to the backend WebSocket endpoint for live push notifications.
 * Also loads initial notification list via REST API.
 * Automatically reconnects on disconnect with exponential backoff.
 *
 * Token is read from localStorage (set by authStore.login).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface NotificationItem {
    id: string;
    notif_type: string;
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

interface UseNotificationsReturn {
    notifications: NotificationItem[];
    unreadCount: number;
    isConnected: boolean;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
}

/** Read JWT access token from localStorage (set by authStore) */
function getToken(): string | null {
    return localStorage.getItem('access_token');
}

export function useNotifications(): UseNotificationsReturn {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectDelay = useRef(1000);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    // ---- REST: fetch initial list ----
    const fetchNotifications = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/notifications/?page_size=30`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(
                    data.notifications.map((n: NotificationItem & { type?: string }) => ({
                        ...n,
                        notif_type: n.notif_type || n.type || 'system',
                    }))
                );
            }
        } catch (_) {
            // Silently fail — WS will keep notifications up-to-date
        }
    }, []);

    // ---- WebSocket connection ----
    const connect = useCallback(() => {
        const token = getToken();
        if (!user?.id || !token) return;

        const url = `${WS_BASE}/api/ws/${user.id}?token=${token}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            reconnectDelay.current = 1000;
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                if (msg.type === 'notification' && msg.data) {
                    const notif: NotificationItem = msg.data;
                    setNotifications((prev) => {
                        if (prev.find((n) => n.id === notif.id)) return prev;
                        return [notif, ...prev];
                    });
                }

                if (msg.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong' }));
                }
            } catch (_) {
                // Ignore malformed messages
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            wsRef.current = null;

            // Exponential backoff reconnect (max 30s)
            if (user?.id && getToken()) {
                reconnectTimer.current = setTimeout(() => {
                    reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
                    connect();
                }, reconnectDelay.current);
            }
        };

        ws.onerror = () => {
            ws.close();
        };
    }, [user?.id]);

    useEffect(() => {
        fetchNotifications();
        connect();

        return () => {
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            wsRef.current?.close();
        };
    }, [fetchNotifications, connect]);

    // ---- REST: mark single notification read ----
    const markRead = useCallback(async (id: string) => {
        const token = getToken();
        if (!token) return;
        try {
            await fetch(`${API_BASE}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        } catch (_) {
            // Silently ignore
        }
    }, []);

    // ---- REST: mark all read ----
    const markAllRead = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            await fetch(`${API_BASE}/notifications/read-all`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (_) {
            // Silently ignore
        }
    }, []);

    return { notifications, unreadCount, isConnected, markRead, markAllRead };
}

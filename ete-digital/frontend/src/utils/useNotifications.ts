/**
 * useNotifications — REST polling notification hook
 *
 * Fetches notifications via REST API every 60 seconds.
 * WebSocket removed — it caused constant 403 errors and resource drain.
 */
import { useState, useEffect, useCallback } from 'react';

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
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    // ---- REST: fetch notification list ----
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
            // Silently fail
        }
    }, []);

    // Poll every 60 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60_000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

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

    return { notifications, unreadCount, isConnected: true, markRead, markAllRead };
}

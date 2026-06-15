/**
 * NotificationDrawer — Slide-in panel for real-time notifications
 * Grouped by Today / Earlier, with mark-read and dismiss per item.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X, Wifi, WifiOff, Loader2, Inbox } from 'lucide-react';
import type { NotificationItem } from '../../utils/useNotifications';

const typeIcon: Record<string, string> = {
    application: '📋',
    tryout:      '🎯',
    payment:     '💳',
    message:     '💬',
    system:      '🔔',
};

function isToday(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
}

function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(dateStr).toLocaleDateString();
}

interface Props {
    open: boolean;
    onClose: () => void;
    notifications: NotificationItem[];
    unreadCount: number;
    isConnected: boolean;
    loading: boolean;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    dismiss: (id: string) => void;
}

export default function NotificationDrawer({
    open, onClose, notifications, unreadCount, isConnected, loading, markRead, markAllRead, dismiss,
}: Props) {
    const navigate = useNavigate();
    const drawerRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) onClose();
        };
        // Delay to avoid same-click close
        setTimeout(() => document.addEventListener('mousedown', handler), 50);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, onClose]);

    const handleNotifClick = async (n: NotificationItem) => {
        if (!n.is_read) await markRead(n.id);
        if (n.link) {
            onClose();
            navigate(n.link);
        }
    };

    const todayNotifs = notifications.filter((n) => isToday(n.created_at));
    const earlierNotifs = notifications.filter((n) => !isToday(n.created_at));

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200 ${
                    open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                role="dialog"
                aria-label="Notifications"
                className={`fixed top-0 right-0 h-full z-50 w-[380px] max-w-[100vw] bg-white shadow-2xl flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <Bell size={18} className="text-violet-600" />
                        <h2 className="font-semibold text-gray-900">Notifications</h2>
                        {unreadCount > 0 && (
                            <span className="bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* WS Status Dot */}
                        <span title={isConnected ? 'Real-time: connected' : 'Real-time: reconnecting...'}>
                            {isConnected
                                ? <Wifi size={14} className="text-emerald-500" />
                                : <WifiOff size={14} className="text-gray-400" />}
                        </span>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead}
                                className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                                <CheckCheck size={13} /> All read
                            </button>
                        )}
                        <button onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="animate-spin text-violet-500" size={24} />
                        </div>
                    )}

                    {!loading && notifications.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                            <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
                                <Inbox size={24} className="text-violet-400" />
                            </div>
                            <p className="font-semibold text-gray-700">You're all caught up!</p>
                            <p className="text-sm text-gray-400 mt-1">No notifications yet. We'll let you know when something happens.</p>
                        </div>
                    )}

                    {!loading && notifications.length > 0 && (
                        <div>
                            {todayNotifs.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-5 pt-4 pb-2">
                                        Today
                                    </p>
                                    {todayNotifs.map((n) => (
                                        <NotifItem key={n.id} n={n} onClick={() => handleNotifClick(n)} onDismiss={() => dismiss(n.id)} />
                                    ))}
                                </div>
                            )}
                            {earlierNotifs.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-5 pt-4 pb-2">
                                        Earlier
                                    </p>
                                    {earlierNotifs.map((n) => (
                                        <NotifItem key={n.id} n={n} onClick={() => handleNotifClick(n)} onDismiss={() => dismiss(n.id)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function NotifItem({ n, onClick, onDismiss }: {
    n: NotificationItem;
    onClick: () => void;
    onDismiss: () => void;
}) {
    return (
        <div
            className={`group relative flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-gray-50
                ${!n.is_read ? 'bg-violet-50/60' : ''}`}
            onClick={onClick}
        >
            {/* Unread dot */}
            {!n.is_read && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-violet-500 rounded-full flex-shrink-0" />
            )}

            {/* Type emoji */}
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                {typeIcon[n.notif_type ?? n.type ?? 'system'] ?? '🔔'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {n.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[11px] text-gray-400 mt-1">{relativeTime(n.created_at)}</p>
            </div>

            {/* Dismiss */}
            <button
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex-shrink-0"
                aria-label="Dismiss"
            >
                <X size={12} />
            </button>
        </div>
    );
}

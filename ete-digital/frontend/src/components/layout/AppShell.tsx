/**
 * AppShell — Shared sidebar + topbar layout
 * Used by Candidate, Employer, and Admin dashboards
 */
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useNotifications } from '../../utils/useNotifications';
import { useTheme } from '../../contexts/ThemeContext';
import {
    LayoutDashboard, Search, Briefcase, FileText, Trophy,
    Share2, BarChart2, Users, Settings, Bell, LogOut,
    ChevronLeft, ChevronRight, Menu, X, ShieldCheck,
    PlusCircle, ClipboardList, Star, UserCheck, CheckCheck,
    Sun, Moon, LayoutGrid,
} from 'lucide-react';

interface NavItem {
    label: string;
    icon: React.ReactNode;
    href: string;
}

const candidateNav: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
    { label: 'Browse Jobs', icon: <Search size={20} />, href: '/jobs' },
    { label: 'My Applications', icon: <FileText size={20} />, href: '/dashboard/applications' },
    { label: 'My Tryouts', icon: <Star size={20} />, href: '/dashboard/tryouts' },
    { label: 'Talent Vault', icon: <Trophy size={20} />, href: '/vault' },
    { label: 'Share Manager', icon: <Share2 size={20} />, href: '/vault/shares' },
    { label: 'Settings', icon: <Settings size={20} />, href: '/settings' },
];

const employerNav: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
    { label: 'My Jobs', icon: <Briefcase size={20} />, href: '/employer/jobs' },
    { label: 'Post a Job', icon: <PlusCircle size={20} />, href: '/employer/jobs/create' },
    { label: 'Applications', icon: <ClipboardList size={20} />, href: '/employer/applications' },
    { label: 'Grade Tryouts', icon: <UserCheck size={20} />, href: '/employer/tryouts/grade' },
    { label: 'Analytics', icon: <BarChart2 size={20} />, href: '/employer/analytics' },
    { label: 'Settings', icon: <Settings size={20} />, href: '/settings' },
];

const adminNav: NavItem[] = [
    { label: 'Overview', icon: <LayoutDashboard size={20} />, href: '/admin' },
    { label: 'Users', icon: <Users size={20} />, href: '/admin/users' },
    { label: 'Jobs', icon: <Briefcase size={20} />, href: '/admin/jobs' },
    { label: 'Settings', icon: <Settings size={20} />, href: '/settings' },
];

function getNav(role?: string): NavItem[] {
    if (role === 'employer') return employerNav;
    if (role === 'admin') return adminNav;
    return candidateNav;
}

function getRoleLabel(role?: string) {
    if (role === 'employer') return 'Employer';
    if (role === 'admin') return 'Admin';
    return 'Candidate';
}

function getRoleColor(role?: string) {
    if (role === 'employer') return 'from-violet-600 to-purple-700';
    if (role === 'admin') return 'from-red-600 to-rose-700';
    return 'from-blue-600 to-indigo-700';
}

interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

    const nav = getNav(user?.role);
    const roleLabel = getRoleLabel(user?.role);
    const roleColor = getRoleColor(user?.role);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (href: string) =>
        href === '/dashboard'
            ? location.pathname === href
            : location.pathname.startsWith(href);

    // Close notification panel on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const Sidebar = ({ mobile = false }) => (
        <div
            className={`flex flex-col h-full bg-gray-900 text-white transition-all duration-300
        ${mobile ? 'w-72' : collapsed ? 'w-20' : 'w-64'}`}
        >
            {/* Logo — Jobsrow */}
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10
        ${collapsed && !mobile ? 'justify-center' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    {user?.role === 'admin' ? <ShieldCheck size={18} /> : <LayoutGrid size={18} />}
                </div>
                {(!collapsed || mobile) && (
                    <div>
                        <div className="flex items-baseline gap-0">
                            <span className="text-sm font-extrabold text-white leading-tight">Jobs</span>
                            <span className="text-sm font-extrabold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">row</span>
                        </div>
                        <p className="text-xs text-gray-400">{roleLabel} Panel</p>
                    </div>
                )}
            </div>

            {/* User Info */}
            {(!collapsed || mobile) && (
                <div className="px-4 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'User'}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {nav.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setMobileOpen(false)}
                            title={collapsed && !mobile ? item.label : undefined}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${active
                                    ? 'bg-white/15 text-white'
                                    : 'text-gray-400 hover:bg-white/8 hover:text-white'}
                ${collapsed && !mobile ? 'justify-center' : ''}`}
                        >
                            <span className={`flex-shrink-0 ${active ? 'text-white' : ''}`}>{item.icon}</span>
                            {(!collapsed || mobile) && <span>{item.label}</span>}
                            {active && (!collapsed || mobile) && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-gray-400 hover:bg-red-500/15 hover:text-red-400 transition-all duration-150
            ${collapsed && !mobile ? 'justify-center' : ''}`}
                >
                    <LogOut size={20} className="flex-shrink-0" />
                    {(!collapsed || mobile) && <span>Logout</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex flex-col relative flex-shrink-0">
                <Sidebar />
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full
            flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
                >
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </div>

            {/* Mobile Sidebar */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
                    <div className="absolute left-0 top-0 bottom-0 flex">
                        <Sidebar mobile />
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className={`border-b px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0 transition-colors duration-200 ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <button
                        onClick={() => setMobileOpen(true)}
                        className={`lg:hidden p-2 rounded-lg transition-colors ${
                            isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex-1" />

                    {/* Dark/Light Mode Toggle */}
                    <button
                        id="dashboard-theme-toggle"
                        onClick={toggleTheme}
                        aria-label="Toggle dark/light mode"
                        className={`p-2 rounded-xl transition-all duration-200 ${
                            isDark
                                ? 'bg-gray-700 text-amber-400 hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>



                    {/* Notification Bell */}
                    <div className="relative" ref={notifRef}>
                        <button
                            id="notification-bell"
                            onClick={() => setNotifOpen((o) => !o)}
                            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                            aria-label="Notifications"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {notifOpen && (
                            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => markAllRead()}
                                            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                                        >
                                            <CheckCheck size={13} />
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                                    {notifications.length === 0 ? (
                                        <p className="text-center text-sm text-gray-400 py-8">No notifications yet</p>
                                    ) : (
                                        notifications.slice(0, 10).map((n) => (
                                            <div
                                                key={n.id}
                                                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                                                onClick={() => {
                                                    markRead(n.id);
                                                    if (n.link) navigate(n.link);
                                                    setNotifOpen(false);
                                                }}
                                            >
                                                <div className="flex items-start gap-2">
                                                    {!n.is_read && (
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                                    )}
                                                    <div className={!n.is_read ? '' : 'ml-3.5'}>
                                                        <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                                                        <p className="text-[10px] text-gray-400 mt-1">
                                                            {new Date(n.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="border-t border-gray-100 px-4 py-2 text-center">
                                    <Link
                                        to="/settings/notifications"
                                        onClick={() => setNotifOpen(false)}
                                        className="text-xs text-blue-500 hover:text-blue-700"
                                    >
                                        Notification Settings
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

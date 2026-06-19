/**
 * AppShell — Premium app shell for JobsRow.com
 * Used by Candidate, Employer, and Admin dashboards
 *
 * Design: Light-mode enterprise SaaS (Linear/Vercel-inspired)
 * Features:
 *  - Animated collapsible sidebar with Framer Motion
 *  - Animated mobile drawer with overlay
 *  - Profile avatar dropdown (top-right)
 *  - Animated notification panel
 *  - Breadcrumb in topbar
 *  - Full keyboard accessibility
 *  - Design system tokens throughout (no raw gray-* classes)
 */
import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useNotifications } from '../../utils/useNotifications';
import NotificationDrawer from '../ui/NotificationDrawer';
import {
    LayoutDashboard, Search, Briefcase, FileText, Trophy,
    Share2, BarChart2, Users, Settings, Bell, LogOut,
    ChevronLeft, ChevronRight, Menu, X,
    PlusCircle, ClipboardList, Star, UserCheck,
    ChevronDown, User, Globe, CreditCard, Upload, ShieldAlert,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface NavItem {
    label: string;
    icon: React.ReactNode;
    href: string;
    badge?: number;
}

/* ── Nav configs ─────────────────────────────────────────────────────────── */
const candidateNav: NavItem[] = [
    { label: 'Dashboard',      icon: <LayoutDashboard size={18} />, href: '/dashboard' },
    { label: 'Browse Jobs',    icon: <Search size={18} />,          href: '/jobs' },
    { label: 'Applications',   icon: <FileText size={18} />,        href: '/dashboard/applications' },
    { label: 'My Tryouts',     icon: <Star size={18} />,            href: '/dashboard/tryouts' },
    { label: 'Talent Vault',   icon: <Trophy size={18} />,          href: '/vault' },
    { label: 'Share Manager',  icon: <Share2 size={18} />,          href: '/vault/shares' },
];

const hrNav: NavItem[] = [
    { label: 'HR Dashboard',   icon: <LayoutDashboard size={18} />, href: '/hr/dashboard' },
    { label: 'My Jobs',        icon: <Briefcase size={18} />,       href: '/hr/jobs' },
    { label: 'Post a Job',     icon: <PlusCircle size={18} />,      href: '/hr/jobs/create' },
    { label: 'Bulk Post',      icon: <Upload size={18} />,          href: '/hr/bulk-post' },
    { label: 'Applications',   icon: <ClipboardList size={18} />,   href: '/hr/applications' },
    { label: 'Grade Tryouts',  icon: <UserCheck size={18} />,       href: '/hr/tryouts/grade' },
    { label: 'Analytics',      icon: <BarChart2 size={18} />,       href: '/hr/analytics' },
    { label: 'Team',           icon: <Users size={18} />,           href: '/hr/team' },
    { label: 'Billing',        icon: <CreditCard size={18} />,      href: '/hr/billing' },
    { label: 'Audit Logs',     icon: <ShieldAlert size={18} />,     href: '/hr/audit-logs' },
    { label: 'Domain Verify',  icon: <Globe size={18} />,           href: '/hr/domain-verify' },
];

const adminNav: NavItem[] = [
    { label: 'Overview',       icon: <LayoutDashboard size={18} />, href: '/admin' },
    { label: 'Users',          icon: <Users size={18} />,           href: '/admin/users' },
    { label: 'Jobs',           icon: <Briefcase size={18} />,       href: '/admin/jobs' },
];

function getNav(role?: string): NavItem[] {
    if (role === 'employer') return hrNav;
    if (role === 'admin')    return adminNav;
    return candidateNav;
}

function getRoleLabel(role?: string) {
    if (role === 'employer') return 'HR Panel';
    if (role === 'admin')    return 'Admin Panel';
    return 'Candidate Panel';
}

function getRoleHome(role?: string) {
    if (role === 'employer') return '/hr/dashboard';
    if (role === 'admin')    return '/admin';
    return '/dashboard';
}

/* ── Role accent colors (design system tokens) ───────────────────────────── */
function getRoleAccent(role?: string) {
    // employer → violet brand, admin → red, candidate → blue
    if (role === 'employer') return { bg: 'bg-primary-600', ring: 'ring-primary-200' };
    if (role === 'admin')    return { bg: 'bg-red-600',     ring: 'ring-red-200' };
    return { bg: 'bg-blue-600', ring: 'ring-blue-200' };
}

/* ── Sidebar widths ──────────────────────────────────────────────────────── */
const SIDEBAR_EXPANDED  = 240;
const SIDEBAR_COLLAPSED = 68;

/* ── NavItem component — memoized to prevent unnecessary re-renders ───────── */
const NavLink = memo(function NavLink({
    item,
    active,
    collapsed,
    onClick,
}: {
    item: NavItem;
    active: boolean;
    collapsed: boolean;
    onClick?: () => void;
}) {
    return (
        <Link
            to={item.href}
            onClick={onClick}
            title={collapsed ? item.label : undefined}
            aria-current={active ? 'page' : undefined}
            className={[
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                'transition-colors duration-150 group relative',
                active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary',
                collapsed ? 'justify-center' : '',
            ].join(' ')}
        >
            <span className={[
                'flex-shrink-0 transition-colors',
                active ? 'text-primary-600' : 'text-text-tertiary group-hover:text-text-primary',
            ].join(' ')}>
                {item.icon}
            </span>

            {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
            )}

            {/* Active indicator dot */}
            {active && !collapsed && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
            )}

            {/* Collapsed tooltip */}
            {collapsed && (
                <div className={[
                    'absolute left-full ml-2 px-2 py-1 bg-text-primary text-white',
                    'text-xs font-medium rounded-md opacity-0 pointer-events-none',
                    'group-hover:opacity-100 transition-opacity whitespace-nowrap z-50',
                    'shadow-lg',
                ].join(' ')}>
                    {item.label}
                </div>
            )}
        </Link>
    );
});

/* ── Main AppShell ───────────────────────────────────────────────────────── */
interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    const { user, logout }  = useAuthStore();
    const navigate          = useNavigate();
    const location          = useLocation();
    const [collapsed, setCollapsed]       = useState(false);
    const [mobileOpen, setMobileOpen]     = useState(false);
    const [notifOpen, setNotifOpen]       = useState(false);
    const [profileOpen, setProfileOpen]   = useState(false);
    const notifRef   = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const { notifications, unreadCount, isConnected, loading, markRead, markAllRead, dismiss } = useNotifications();

    const nav        = useMemo(() => getNav(user?.role),      [user?.role]);
    const roleLabel  = useMemo(() => getRoleLabel(user?.role), [user?.role]);
    const roleHome   = useMemo(() => getRoleHome(user?.role),  [user?.role]);
    const accent     = useMemo(() => getRoleAccent(user?.role),[user?.role]);
    const initials   = useMemo(() => {
        const name = user?.full_name ?? '';
        return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
    }, [user?.full_name]);

    /* Current page label for breadcrumb */
    const currentPage = useMemo(() => {
        const match = nav.find(item =>
            item.href === '/dashboard'
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href)
        );
        return match?.label ?? '';
    }, [nav, location.pathname]);

    const isActive = useCallback((href: string) =>
        href === '/dashboard' || href === '/admin' || href === '/hr/dashboard'
            ? location.pathname === href
            : location.pathname.startsWith(href),
        [location.pathname]
    );

    const handleLogout = useCallback(async () => {
        await logout();
        navigate('/login');
    }, [logout, navigate]);

    /* Close panels on outside click */
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /* ESC key to close mobile sidebar and dropdowns */
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setMobileOpen(false);
                setNotifOpen(false);
                setProfileOpen(false);
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    /* Close mobile sidebar on route change */
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    /* ── Sidebar content ─────────────────────────────────────────────────── */
    const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => {
        const isCollapsed = collapsed && !mobile;
        return (
            <div className={[
                'flex flex-col h-full bg-surface border-r border-border',
                'transition-none', // width transition handled by parent motion.div
            ].join(' ')}>
                {/* Logo */}
                <Link
                    to={roleHome}
                    className={[
                        'flex items-center gap-3 px-4 border-b border-border',
                        'hover:bg-background transition-colors duration-150 flex-shrink-0',
                        isCollapsed ? 'justify-center py-4 h-[60px]' : 'py-4 h-[60px]',
                    ].join(' ')}
                    aria-label="JobsRow.com Home"
                >
                    {/* Brand mark — always visible */}
                    <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white text-xs font-black">JR</span>
                    </div>

                    {!isCollapsed && (
                        <div className="min-w-0">
                            <div className="flex items-baseline gap-0 leading-none">
                                <span className="text-[15px] font-extrabold text-text-primary tracking-tight">JobsRow</span>
                                <span className="text-[15px] font-extrabold text-primary-600 tracking-tight">.com</span>
                            </div>
                            <p className="text-[10px] text-text-tertiary mt-0.5 font-medium tracking-wide uppercase">
                                {roleLabel}
                            </p>
                        </div>
                    )}
                </Link>

                {/* Navigation */}
                <nav
                    className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden"
                    aria-label="Main navigation"
                >
                    {nav.map((item) => (
                        <NavLink
                            key={item.href}
                            item={item}
                            active={isActive(item.href)}
                            collapsed={isCollapsed}
                            onClick={mobile ? () => setMobileOpen(false) : undefined}
                        />
                    ))}
                </nav>

                {/* Bottom section: Settings + Logout */}
                <div className="px-2 py-3 border-t border-border space-y-0.5 flex-shrink-0">
                    <NavLink
                        item={{ label: 'Settings', icon: <Settings size={18} />, href: '/settings' }}
                        active={isActive('/settings')}
                        collapsed={isCollapsed}
                        onClick={mobile ? () => setMobileOpen(false) : undefined}
                    />
                    <button
                        onClick={handleLogout}
                        className={[
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                            'text-text-secondary hover:bg-red-50 hover:text-red-600',
                            'transition-colors duration-150 group',
                            isCollapsed ? 'justify-center' : '',
                        ].join(' ')}
                        title={isCollapsed ? 'Sign out' : undefined}
                        aria-label="Sign out"
                    >
                        <LogOut size={18} className="flex-shrink-0 text-text-tertiary group-hover:text-red-500 transition-colors" />
                        {!isCollapsed && <span>Sign out</span>}
                    </button>
                </div>
            </div>
        );
    };

    /* ── Main layout ─────────────────────────────────────────────────────── */
    return (
        <div className="flex h-screen overflow-hidden bg-background">

            {/* ── Desktop Sidebar (animated width) ─────────────────────── */}
            <motion.div
                className="hidden lg:flex flex-col relative flex-shrink-0 z-20"
                animate={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <SidebarContent />

                {/* Collapse toggle button */}
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className={[
                        'absolute -right-3 top-[72px] w-6 h-6 rounded-full flex items-center justify-center z-10',
                        'bg-surface border border-border shadow-card text-text-tertiary',
                        'hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200',
                        'transition-colors duration-150',
                    ].join(' ')}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed
                        ? <ChevronRight size={12} strokeWidth={2.5} />
                        : <ChevronLeft  size={12} strokeWidth={2.5} />
                    }
                </button>
            </motion.div>

            {/* ── Mobile Sidebar (overlay drawer) ──────────────────────── */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-40 bg-text-primary/40 backdrop-blur-sm lg:hidden"
                            onClick={() => setMobileOpen(false)}
                            aria-hidden="true"
                        />

                        {/* Drawer */}
                        <motion.div
                            key="drawer"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed left-0 top-0 bottom-0 z-50 w-64 lg:hidden"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Navigation menu"
                        >
                            <SidebarContent mobile />

                            <button
                                onClick={() => setMobileOpen(false)}
                                className="absolute top-3 right-3 p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-background transition-colors"
                                aria-label="Close menu"
                            >
                                <X size={18} />
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main Content Area ─────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* ── Topbar ───────────────────────────────────────────── */}
                <header className="flex items-center gap-3 px-4 lg:px-6 h-[60px] border-b border-border bg-surface flex-shrink-0 z-10">

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-background transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Breadcrumb / Page Title */}
                    {currentPage && (
                        <div className="hidden sm:flex items-center gap-2 text-sm">
                            <span className="text-text-tertiary font-medium">
                                {roleLabel.replace(' Panel', '')}
                            </span>
                            <ChevronRight size={14} className="text-border" />
                            <span className="text-text-primary font-semibold">{currentPage}</span>
                        </div>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Notification Bell → opens slide-in drawer */}
                    <button
                        id="notification-bell"
                        onClick={() => setNotifOpen(o => !o)}
                        className={[
                            'relative p-2 rounded-lg transition-colors',
                            notifOpen
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-text-secondary hover:bg-background hover:text-text-primary',
                        ].join(' ')}
                        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                        aria-expanded={notifOpen}
                    >
                        <Bell size={19} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Profile Avatar Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setProfileOpen(o => !o)}
                            className={[
                                'flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg transition-colors',
                                profileOpen
                                    ? 'bg-primary-50'
                                    : 'hover:bg-background',
                            ].join(' ')}
                            aria-label="Profile menu"
                            aria-expanded={profileOpen}
                        >
                            <div className={[
                                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
                                accent.bg,
                            ].join(' ')}>
                                {initials}
                            </div>
                            <ChevronDown
                                size={14}
                                className={[
                                    'text-text-tertiary transition-transform duration-200',
                                    profileOpen ? 'rotate-180' : '',
                                ].join(' ')}
                            />
                        </button>

                        <AnimatePresence>
                            {profileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    className="absolute right-0 top-[calc(100%+8px)] w-56 bg-surface rounded-xl shadow-card-hover border border-border z-50 overflow-hidden"
                                    role="menu"
                                >
                                    {/* User info */}
                                    <div className="px-4 py-3 border-b border-border">
                                        <p className="text-sm font-semibold text-text-primary truncate">{user?.full_name || 'User'}</p>
                                        <p className="text-xs text-text-tertiary truncate mt-0.5">{user?.email}</p>
                                    </div>

                                    <div className="py-1">
                                        <Link
                                            to="/settings"
                                            onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
                                            role="menuitem"
                                        >
                                            <User size={15} className="text-text-tertiary" />
                                            Account Settings
                                        </Link>
                                        <button
                                            onClick={() => { setProfileOpen(false); handleLogout(); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                                            role="menuitem"
                                        >
                                            <LogOut size={15} className="text-text-tertiary" />
                                            Sign out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                {/* ── Page Content ─────────────────────────────────────── */}
                <main className="flex-1 overflow-y-auto" id="main-content">
                    {children}
                </main>
            </div>

            {/* ── Notification Drawer (slide-in from right) ─────────────── */}
            <NotificationDrawer
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
                notifications={notifications}
                unreadCount={unreadCount}
                isConnected={isConnected}
                loading={loading}
                markRead={markRead}
                markAllRead={markAllRead}
                dismiss={dismiss}
            />
        </div>
    );
}

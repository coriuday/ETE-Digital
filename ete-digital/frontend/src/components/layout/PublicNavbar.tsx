/**
 * PublicNavbar — Fixed top navbar for all public-facing pages
 *
 * Improvements:
 *  - AnimatePresence for mobile menu (smooth slide-down instead of abrupt mount)
 *  - ESC key to close mobile menu
 *  - ARIA attributes (aria-expanded, aria-label, role)
 *  - Brand name: JobsRow.com (canonical)
 *  - Consistent active link color uses design-system primary token
 *  - `aria-current="page"` on active nav links
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';

export default function PublicNavbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    const navLinks = [
        { label: 'Jobs',         href: '/jobs' },
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'About',        href: '/about' },
        { label: 'Help',         href: '/help' },
    ];

    const dashboardHref = user?.role === 'employer' ? '/hr/dashboard' : '/dashboard';

    const isActive = (href: string) => location.pathname === href;

    /* Close menu on route change + ESC */
    useEffect(() => { setMenuOpen(false); }, [location.pathname]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-card"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0" aria-label="JobsRow.com Home">
                        <span className="text-[28px] font-extrabold text-[#176BBE] tracking-tight">JobsRow.com</span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-7">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                to={link.href}
                                aria-current={isActive(link.href) ? 'page' : undefined}
                                className={[
                                    'text-sm font-medium transition-colors',
                                    isActive(link.href)
                                        ? 'text-primary-600'
                                        : 'text-text-secondary hover:text-text-primary',
                                ].join(' ')}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right: CTA Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {isAuthenticated ? (
                            <Link
                                to={dashboardHref}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary-600 transition-colors"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
                                >
                                    Get Started Free
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile: Menu Toggle */}
                    <button
                        className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
                        onClick={() => setMenuOpen(o => !o)}
                        aria-expanded={menuOpen}
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu — animated */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="md:hidden border-t border-border bg-white overflow-hidden"
                    >
                        <div className="px-4 py-4 space-y-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    aria-current={isActive(link.href) ? 'page' : undefined}
                                    className={[
                                        'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                        isActive(link.href)
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-text-secondary hover:text-text-primary hover:bg-background',
                                    ].join(' ')}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                        <div className="px-4 pb-4 flex flex-col gap-2 border-t border-border pt-3">
                            {isAuthenticated ? (
                                <Link
                                    to={dashboardHref}
                                    className="px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold text-center hover:bg-primary-700 transition-colors"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="px-4 py-2.5 border border-border text-text-primary rounded-lg text-sm font-medium text-center hover:bg-background transition-colors"
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold text-center hover:bg-primary-700 transition-colors"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

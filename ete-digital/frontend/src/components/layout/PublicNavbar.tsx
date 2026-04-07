/**
 * Public-facing Navigation Bar — Jobsrow
 * Includes Dark/Light mode toggle + responsive mobile menu
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

export default function PublicNavbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const navLinks = [
        { label: 'Jobs', href: '/jobs' },
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'About', href: '/about' },
    ];

    const isActive = (href: string) => location.pathname === href;

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b shadow-sm transition-colors duration-200
            ${isDark
                ? 'bg-gray-900/95 border-gray-700'
                : 'bg-white/95 border-gray-100'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo — Jobsrow */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/40 transition-shadow duration-300">
                            <LayoutGrid className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-baseline gap-0.5">
                            <span className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Jobs
                            </span>
                            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                                row
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={`text-sm font-medium transition-colors ${
                                    isActive(link.href)
                                        ? 'text-indigo-600'
                                        : isDark
                                            ? 'text-gray-300 hover:text-white'
                                            : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right: Theme Toggle + CTA Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Dark/Light Toggle */}
                        <button
                            id="theme-toggle-desktop"
                            onClick={toggleTheme}
                            aria-label="Toggle dark/light mode"
                            className={`p-2 rounded-xl transition-all duration-200 ${
                                isDark
                                    ? 'bg-gray-700 text-amber-400 hover:bg-gray-600'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {isDark
                                ? <Sun className="w-4 h-4" />
                                : <Moon className="w-4 h-4" />
                            }
                        </button>

                        {isAuthenticated ? (
                            <Link
                                to="/dashboard"
                                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-md hover:shadow-indigo-500/30"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                                        isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-indigo-600'
                                    }`}
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-md hover:shadow-indigo-500/30"
                                >
                                    Get Started Free
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile: Theme + Menu Toggle */}
                    <div className="md:hidden flex items-center gap-2">
                        <button
                            id="theme-toggle-mobile"
                            onClick={toggleTheme}
                            aria-label="Toggle dark/light mode"
                            className={`p-2 rounded-xl transition-all duration-200 ${
                                isDark
                                    ? 'bg-gray-700 text-amber-400'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button
                            className={`p-2 transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className={`md:hidden border-t px-4 py-4 space-y-3 ${
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            to={link.href}
                            className={`block text-sm font-medium py-1 transition-colors ${
                                isDark ? 'text-gray-300 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'
                            }`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="pt-3 border-t flex flex-col gap-2 border-gray-200 dark:border-gray-700">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold text-center">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className={`px-4 py-2 border rounded-xl text-sm font-medium text-center ${
                                    isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                                }`}>
                                    Log In
                                </Link>
                                <Link to="/register" className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold text-center">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

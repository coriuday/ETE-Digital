/**
 * Public-facing Navigation Bar — Jobsrow
 * Theme: Light mode only
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function PublicNavbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();

    const navLinks = [
        { label: 'Jobs', href: '/jobs' },
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'About', href: '/about' },
        { label: 'Help', href: '/help' },
    ];

    const isActive = (href: string) => location.pathname === href;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b shadow-sm bg-white/95 border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <span className="text-[28px] font-extrabold text-[#176BBE] tracking-tight">JobsRow.com</span>
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
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right: CTA Buttons */}
                    <div className="hidden md:flex items-center gap-3">
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
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
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

                    {/* Mobile: Menu Toggle */}
                    <div className="md:hidden flex items-center gap-2">
                        <button
                            className="p-2 transition-colors text-gray-600 hover:text-gray-900"
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
                <div className="md:hidden border-t border-gray-100 px-4 py-4 space-y-3 bg-white">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            to={link.href}
                            className="block text-sm font-medium py-1 transition-colors text-gray-700 hover:text-indigo-600"
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="pt-3 border-t flex flex-col gap-2 border-gray-200">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold text-center">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-center text-gray-700">
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

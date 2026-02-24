/**
 * Public-facing Navigation Bar
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Briefcase } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function PublicNavbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();

    const navLinks = [
        { label: 'Jobs', href: '/jobs' },
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'About', href: '/about' },
    ];

    const isActive = (href: string) => location.pathname === href;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-700 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                            ETE <span className="text-primary-600">Digital</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={`text-sm font-medium transition-colors ${
                                    isActive(link.href)
                                        ? 'text-primary-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {isAuthenticated ? (
                            <Link
                                to="/dashboard"
                                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-700 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-gray-700 text-sm font-medium hover:text-primary-600 transition-colors"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-700 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                                >
                                    Get Started Free
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            to={link.href}
                            className="block text-sm font-medium text-gray-700 hover:text-primary-600 py-1"
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold text-center">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium text-center">
                                    Log In
                                </Link>
                                <Link to="/register" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold text-center">
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

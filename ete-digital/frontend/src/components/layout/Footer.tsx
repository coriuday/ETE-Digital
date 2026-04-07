/**
 * Footer — Jobsrow
 * Multi-column layout inspired by Indeed & Freshersworld
 * Includes: Candidates Zone, Employers Zone, Company, Connect + Copyright bar
 */
import { Link } from 'react-router-dom';
import { LayoutGrid, Facebook, Youtube, Linkedin, Github, Twitter, Mail, Smartphone } from 'lucide-react';

const footerSections = {
    'Candidates Zone': [
        { label: 'Browse Jobs', href: '/jobs' },
        { label: 'Upload Resume', href: '/settings?tab=profile' },
        { label: 'My Applications', href: '/dashboard/applications' },
        { label: 'My Tryouts', href: '/dashboard/tryouts' },
        { label: 'Talent Vault', href: '/vault' },
        { label: 'Career Advice', href: '/about' },
        { label: 'Job Preferences', href: '/settings?tab=profile' },
    ],
    'Employers Zone': [
        { label: 'Post a Job for Free', href: '/register?role=employer' },
        { label: 'Browse Candidates', href: '/employer/applications' },
        { label: 'Grade Tryouts', href: '/employer/tryouts/grade' },
        { label: 'Analytics Dashboard', href: '/employer/analytics' },
        { label: 'Employer FAQ', href: '/faq' },
        { label: 'Contact Sales', href: '/contact' },
    ],
    'Company': [
        { label: 'About Jobsrow', href: '/about' },
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'ESG at Jobsrow', href: '/about' },
        { label: 'Safe Job Search', href: '/about' },
    ],
};

const socialLinks = [
    { icon: <Facebook className="w-4 h-4" />, href: 'https://facebook.com', label: 'Facebook', color: 'hover:text-blue-500' },
    { icon: <Youtube className="w-4 h-4" />, href: 'https://youtube.com', label: 'YouTube', color: 'hover:text-red-500' },
    { icon: <Linkedin className="w-4 h-4" />, href: 'https://linkedin.com', label: 'LinkedIn', color: 'hover:text-blue-400' },
    { icon: <Twitter className="w-4 h-4" />, href: 'https://twitter.com', label: 'Twitter/X', color: 'hover:text-sky-400' },
    { icon: <Github className="w-4 h-4" />, href: 'https://github.com', label: 'GitHub', color: 'hover:text-white' },
    { icon: <Mail className="w-4 h-4" />, href: 'mailto:hello@jobsrow.com', label: 'Email', color: 'hover:text-violet-400' },
];

const bottomLinks = [
    { label: 'Accessibility', href: '/about' },
    { label: 'Privacy Centre & Ad Choices', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Copyright', href: '/copyright' },
    { label: 'Guidelines for Safe Job Search', href: '/about' },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-950 text-gray-400">
            {/* Main Footer Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 mb-5 group w-fit">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg">
                                <LayoutGrid className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex items-baseline gap-0">
                                <span className="text-xl font-extrabold text-white tracking-tight">Jobs</span>
                                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">row</span>
                            </div>
                        </Link>

                        {/* Tagline + Description */}
                        <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">
                            The No.1 Outcome-Driven Job Platform
                        </p>
                        <p className="text-sm leading-relaxed mb-5 max-w-xs text-gray-400">
                            Jobsrow is India's premier hiring platform where candidates prove their skills through real tryouts and get paid. With 1.5 Cr+ resumes and top MNC opportunities, find your row in the workforce today.
                        </p>

                        {/* App Download */}
                        <div className="mb-6">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Get the App</p>
                            <div className="flex gap-2">
                                <a href="#" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors border border-gray-700">
                                    <Smartphone className="w-3.5 h-3.5" />
                                    Google Play
                                </a>
                                <a href="#" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors border border-gray-700">
                                    <Smartphone className="w-3.5 h-3.5" />
                                    App Store
                                </a>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Connect With Us</p>
                            <div className="flex items-center gap-3 flex-wrap">
                                {socialLinks.map(social => (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={social.label}
                                        className={`w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 transition-all duration-200 hover:border-gray-500 hover:scale-110 ${social.color}`}
                                    >
                                        {social.icon}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerSections).map(([section, links]) => (
                        <div key={section}>
                            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-5 pb-2 border-b border-gray-800">
                                {section}
                            </h4>
                            <ul className="space-y-2.5">
                                {links.map(link => (
                                    <li key={link.href + link.label}>
                                        <Link
                                            to={link.href}
                                            className="text-sm text-gray-400 hover:text-violet-400 transition-colors duration-150 hover:translate-x-0.5 inline-block"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-800" />

            {/* Copyright Bar — matches Indeed/Freshersworld bottom bar style */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    {/* Copyright text */}
                    <p className="text-xs text-gray-500 order-2 sm:order-1">
                        © {currentYear} Jobsrow. All rights reserved.
                    </p>

                    {/* Bottom Links */}
                    <div className="flex flex-wrap justify-center sm:justify-end items-center gap-x-4 gap-y-1 order-1 sm:order-2">
                        {bottomLinks.map((link, i) => (
                            <span key={link.href + link.label} className="flex items-center gap-4">
                                <Link
                                    to={link.href}
                                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors whitespace-nowrap"
                                >
                                    {link.label}
                                </Link>
                                {i < bottomLinks.length - 1 && (
                                    <span className="text-gray-700 text-xs hidden sm:inline">·</span>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

/**
 * Footer — Jobsrow
 * Multi-column layout inspired by Indeed & Freshersworld
 * Includes: Candidates Zone, Employers Zone, Company, Connect + Copyright bar
 */
import { Link } from 'react-router-dom';
import { Facebook, Youtube, Linkedin, Instagram } from 'lucide-react';

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
        { label: 'Employer FAQ', href: '/help/employers' },
        { label: 'Contact Sales', href: '/contact' },
    ],
    // 'Company': [
    //     { label: 'About JobsRow', href: '/about' },
    //     { label: 'How It Works', href: '/how-it-works' },
    //     { label: 'FAQ', href: '/faq' },
    //     { label: 'Contact Us', href: '/contact' },
    //     { label: 'ESG at JobsRow', href: '/about' },
    //     { label: 'Safe Job Search', href: '/about' },
    // ],
    // 'Help': [
    //     { label: 'Help Center', href: '/help' },
    //     { label: 'Help for Job Seekers', href: '/help/job-seekers' },
    //     { label: 'Help for Employers', href: '/help/employers' },
    //     { label: 'Privacy Policy', href: '/privacy-policy' },
    //     { label: 'Terms of Service', href: '/terms' },
    //     { label: 'Cookie Policy', href: '/cookies' },
    // ],
};

const PinterestIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.168 0 7.41 2.967 7.41 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.366 18.622.002 12.017.002z" />
    </svg>
);

const XIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const socialLinks = [
    { icon: <Facebook className="w-4 h-4" />, href: 'https://www.facebook.com/jobsrow', label: 'Facebook', color: 'hover:text-blue-600' },
    { icon: <Instagram className="w-4 h-4" />, href: 'https://www.instagram.com/jobs_row/', label: 'Instagram', color: 'hover:text-pink-600' },
    { icon: <Linkedin className="w-4 h-4" />, href: 'https://www.linkedin.com/company/jobsrow/', label: 'LinkedIn', color: 'hover:text-blue-700' },
    { icon: <XIcon className="w-4 h-4" />, href: 'https://x.com/jobsrow97372', label: 'X', color: 'hover:text-gray-900' },
    { icon: <Youtube className="w-4 h-4" />, href: 'https://www.youtube.com/@Jobsrow', label: 'YouTube', color: 'hover:text-red-600' },
    { icon: <PinterestIcon className="w-4 h-4" />, href: 'https://in.pinterest.com/jobs_row/', label: 'Pinterest', color: 'hover:text-red-600' },
];

const extraFooterLinks = [
    { label: 'About JobsRow', href: '/about' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Career Advice', href: '#' },
    { label: 'Browse Jobs', href: '/jobs' },
    { label: 'Browse Companies', href: '#' },
    { label: 'Salaries', href: '#' },
    { label: 'Events', href: '#' },
    { label: 'Work at JobsRow', href: '#' },
    { label: 'Countries', href: '#' },
    { label: 'Help', href: '/help' },
    { label: 'ESG at JobsRow', href: '/about' },
    { label: 'Guidelines for Safe Job Search', href: '/safe-job-search' },
];

const bottomLinks = [
    { label: 'Accessibility', href: '/about' },
    { label: 'Privacy Centre & Ad Choices', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-50 text-gray-600 border-t border-gray-200">
            {/* Main Footer Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-10">

                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 mb-5 group w-fit">
                            <span className="text-[28px] font-extrabold text-[#176BBE] tracking-tight">JobsRow.com</span>
                        </Link>

                        {/* Tagline + Description */}
                        <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-2">
                            The No.1 Outcome-Driven Job Platform
                        </p>
                        <p className="text-sm leading-relaxed mb-5 max-w-xs text-gray-500">
                            JobsRow is India's premier hiring platform where candidates prove their skills through real tryouts and get paid. With 1.5 Cr+ resumes and top MNC opportunities, find your row in the workforce today.
                        </p>

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
                                        className={`w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 transition-all duration-200 hover:border-gray-400 hover:scale-110 shadow-sm ${social.color}`}
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
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-5 pb-2 border-b border-gray-200">
                                {section}
                            </h4>
                            <ul className="space-y-2.5">
                                {links.map(link => (
                                    <li key={link.href + link.label}>
                                        <Link
                                            to={link.href}
                                            className="text-sm text-gray-600 hover:text-violet-600 transition-colors duration-150 hover:translate-x-0.5 inline-block"
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
            <div className="border-t border-gray-200" />

            {/* Bottom Footer Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Extra Footer Links (Company + Indeed Links) */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-6">
                    {extraFooterLinks.map(link => (
                        <Link
                            key={link.label}
                            to={link.href}
                            className="text-sm text-gray-600 hover:underline"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200">
                    {/* Copyright text */}
                    <p className="text-xs text-gray-500 order-2 sm:order-1">
                        © {currentYear} JobsRow.com  All rights reserved.
                    </p>

                    {/* Bottom Links */}
                    <div className="flex flex-wrap justify-center sm:justify-end items-center gap-x-4 gap-y-1 order-1 sm:order-2">
                        {bottomLinks.map((link, i) => (
                            <span key={link.href + link.label} className="flex items-center gap-4">
                                <Link
                                    to={link.href}
                                    className="text-xs text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap"
                                >
                                    {link.label}
                                </Link>
                                {i < bottomLinks.length - 1 && (
                                    <span className="text-gray-300 text-xs hidden sm:inline">·</span>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

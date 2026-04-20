/**
 * Help Center — Landing Page
 * Stitch-designed: "Structured Sanctuary" aesthetic
 * Light mode only | Primary #176BBE | Font: Inter
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserCheck, Briefcase, ChevronRight, HelpCircle, Mail, ArrowRight } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

const seekerTopics = [
    { label: 'How do I create an account?', href: '/help/job-seekers#create-account' },
    { label: 'How do I search and apply for jobs?', href: '/help/job-seekers#apply-jobs' },
    { label: 'What are Tryouts and how do I take one?', href: '/help/job-seekers#tryouts' },
    { label: 'How do I upload my resume?', href: '/help/job-seekers#resume' },
    { label: 'How do I track my applications?', href: '/help/job-seekers#track-applications' },
    { label: 'What is the Talent Vault?', href: '/help/job-seekers#talent-vault' },
];

const employerTopics = [
    { label: 'How do I post a job for free?', href: '/help/employers#post-job' },
    { label: 'How do I browse and filter candidates?', href: '/help/employers#browse-candidates' },
    { label: 'How do I set up a Tryout?', href: '/help/employers#setup-tryout' },
    { label: 'How do I grade Tryout submissions?', href: '/help/employers#grade-tryouts' },
    { label: 'How do I access Analytics?', href: '/help/employers#analytics' },
    { label: 'How do I contact a candidate?', href: '/help/employers#contact-candidate' },
];

const popularArticles = [
    { label: 'Getting started on JobsRow.com', href: '/help/job-seekers#create-account', tag: 'Job Seekers' },
    { label: 'Understanding the Tryout system', href: '/help/job-seekers#tryouts', tag: 'Job Seekers' },
    { label: 'Posting your first job listing', href: '/help/employers#post-job', tag: 'Employers' },
    { label: 'Reviewing candidate applications', href: '/help/employers#browse-candidates', tag: 'Employers' },
    { label: 'Managing your Talent Vault privacy', href: '/help/job-seekers#talent-vault', tag: 'Job Seekers' },
    { label: 'Grading Tryouts and releasing payment', href: '/help/employers#grade-tryouts', tag: 'Employers' },
];

export default function HelpCenterPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredArticles = popularArticles.filter(a =>
        searchQuery === '' || a.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#f8f9fa] font-sans">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-24 pb-14 bg-gradient-to-br from-[#005399] to-[#176BBE]">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 backdrop-blur-sm">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Help Center
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight leading-tight">
                        How can we help you today?
                    </h1>
                    <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                        Find answers, guides, and support for everything on JobsRow.com
                    </p>

                    {/* Search bar */}
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#005399]" />
                        <input
                            type="text"
                            placeholder="Search help articles..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-gray-800 placeholder-gray-400 text-sm font-medium focus:outline-none shadow-[0_8px_32px_-4px_rgba(25,28,29,0.10)]"
                        />
                    </div>
                </div>
            </section>

            {/* Search results */}
            {searchQuery && (
                <section className="max-w-4xl mx-auto px-4 pt-8">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                        Results for "{searchQuery}"
                    </h2>
                    {filteredArticles.length > 0 ? (
                        <div className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] overflow-hidden">
                            {filteredArticles.map((a, i) => (
                                <Link
                                    key={i}
                                    to={a.href}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-[#f3f4f5] transition-colors group border-b border-[#edeeef] last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${a.tag === 'Employers' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {a.tag}
                                        </span>
                                        <span className="text-sm text-gray-800 font-medium">{a.label}</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#176BBE] transition-colors" />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-8 text-center shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)]">
                            <p className="text-gray-500 text-sm">No articles found for "{searchQuery}". Try a different keyword or browse below.</p>
                        </div>
                    )}
                </section>
            )}

            {/* Main cards */}
            <section className="max-w-5xl mx-auto px-4 py-12">
                <div className="grid md:grid-cols-2 gap-6">

                    {/* Job Seekers card */}
                    <div className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.07)] overflow-hidden hover:shadow-[0_4px_24px_-4px_rgba(0,83,153,0.15)] transition-shadow">
                        <div className="bg-[#d4e3ff] px-6 py-7">
                            <div className="w-12 h-12 bg-[#005399] rounded-xl flex items-center justify-center mb-4">
                                <UserCheck className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-[#001c3a] mb-1.5">Help for Job Seekers</h2>
                            <p className="text-sm text-[#004785] leading-relaxed">
                                Find jobs, apply with your skills, take tryouts, manage your profile, and grow your career on JobsRow.com.
                            </p>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Popular Topics</p>
                            <ul className="space-y-3">
                                {seekerTopics.map((t, i) => (
                                    <li key={i}>
                                        <Link
                                            to={t.href}
                                            className="flex items-center justify-between text-sm text-gray-700 hover:text-[#176BBE] transition-colors group"
                                        >
                                            <span>{t.label}</span>
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#176BBE] transition-colors flex-shrink-0 ml-2" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/help/job-seekers"
                                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#176BBE] hover:gap-3 transition-all"
                            >
                                View all Job Seeker articles
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Employers card */}
                    <div className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.07)] overflow-hidden hover:shadow-[0_4px_24px_-4px_rgba(107,70,193,0.15)] transition-shadow">
                        <div className="bg-[#e9ddff] px-6 py-7">
                            <div className="w-12 h-12 bg-[#5e37b3] rounded-xl flex items-center justify-center mb-4">
                                <Briefcase className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-[#23005c] mb-1.5">Help for Employers</h2>
                            <p className="text-sm text-[#522aa7] leading-relaxed">
                                Post jobs, review applications, set up tryouts, grade candidates, and find the best talent for your team.
                            </p>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Popular Topics</p>
                            <ul className="space-y-3">
                                {employerTopics.map((t, i) => (
                                    <li key={i}>
                                        <Link
                                            to={t.href}
                                            className="flex items-center justify-between text-sm text-gray-700 hover:text-[#5e37b3] transition-colors group"
                                        >
                                            <span>{t.label}</span>
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#5e37b3] transition-colors flex-shrink-0 ml-2" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/help/employers"
                                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#5e37b3] hover:gap-3 transition-all"
                            >
                                View all Employer articles
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular articles */}
            {!searchQuery && (
                <section className="max-w-5xl mx-auto px-4 pb-12">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">Popular Articles</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {popularArticles.map((a, i) => (
                            <Link
                                key={i}
                                to={a.href}
                                className="bg-white rounded-xl px-5 py-4 hover:bg-[#f3f4f5] transition-colors group flex items-start justify-between shadow-[0_1px_8px_-2px_rgba(25,28,29,0.06)]"
                            >
                                <div>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${a.tag === 'Employers' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} mb-2 inline-block`}>
                                        {a.tag}
                                    </span>
                                    <p className="text-sm font-medium text-gray-800 leading-snug">{a.label}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#176BBE] transition-colors flex-shrink-0 ml-3 mt-1" />
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Still need help CTA */}
            <section className="max-w-5xl mx-auto px-4 pb-16">
                <div className="bg-gradient-to-br from-[#005399] to-[#176BBE] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Still need help?</h3>
                            <p className="text-blue-100 text-sm">Our support team is available 24/7. We reply within a few hours.</p>
                        </div>
                    </div>
                    <Link
                        to="/contact"
                        className="flex-shrink-0 px-6 py-3 bg-white text-[#176BBE] font-semibold text-sm rounded-xl hover:bg-blue-50 transition-colors"
                    >
                        Contact Support
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}

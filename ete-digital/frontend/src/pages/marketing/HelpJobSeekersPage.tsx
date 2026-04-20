/**
 * Help for Job Seekers Page
 * Stitch-designed: "Structured Sanctuary" aesthetic
 * Light mode only | Primary #176BBE | Font: Inter
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ChevronRight, ArrowLeft, UserCheck } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

const categories = [
    {
        id: 'getting-started',
        label: 'Getting Started',
        articles: [
            {
                id: 'create-account',
                q: 'How do I create an account?',
                a: 'Creating an account on JobsRow.com is free and only takes a minute. Click "Get Started Free" in the top-right corner, fill in your name, email, and password, and choose "Job Seeker" as your role. Verify your email address and you\'re all set to start browsing and applying for jobs.',
            },
            {
                id: 'apply-jobs',
                q: 'How do I search and apply for jobs?',
                a: 'Head to the "Browse Jobs" section from the main navigation or your dashboard. Use filters like location, job type, salary range, and skills to narrow results. Click any job listing to see the full description, requirements, and compensation. Hit the "Apply Now" button to submit your application. You\'ll need your profile complete before applying.',
            },
            {
                id: 'profile-setup',
                q: 'How do I set up my profile?',
                a: 'Go to Settings > Profile to complete your profile. Add your full name, professional summary, work experience, education, and skills. A complete profile is essential for employers to consider you for roles. You can also link your LinkedIn profile for faster setup.',
            },
        ],
    },
    {
        id: 'resume',
        label: 'Resume & Profile',
        articles: [
            {
                id: 'resume',
                q: 'How do I upload my resume?',
                a: 'Navigate to Settings > Profile and scroll down to the Resume section. Click "Upload Resume" and choose a PDF file (max 5MB). Your resume is stored securely and can be shared with employers when you apply. You can update your resume at any time.',
            },
            {
                id: 'talent-vault',
                q: 'What is the Talent Vault?',
                a: 'The Talent Vault is your personal, secure portfolio where you can store verified work samples, certifications, and project files. You control exactly who can see each item. Employers can request access, which you approve or deny. Think of it as your professional showcase—much richer than a traditional resume.',
            },
            {
                id: 'profile-visibility',
                q: 'Who can see my profile?',
                a: 'By default, your basic profile (name, skills, experience) is visible to registered employers. You control which Talent Vault items are shared and with whom. You can set individual sharing links with expiry dates. Visit Settings > Privacy to manage your visibility preferences.',
            },
        ],
    },
    {
        id: 'tryouts',
        label: 'Tryouts & Skills',
        articles: [
            {
                id: 'tryouts',
                q: 'What are Tryouts and how do I take one?',
                a: 'A Tryout is a short, real-world task set by the employer to assess your skills before a traditional interview. When you apply for a job that includes a tryout, you\'ll see the task details and compensation amount. Accept the tryout, complete the work within the given timeframe, and submit your result. The employer then reviews and grades your submission.',
            },
            {
                id: 'tryout-payment',
                q: 'How do I get paid for completing a Tryout?',
                a: 'Payment is held in secure escrow by JobsRow.com from the moment the employer creates the tryout. Once you submit your work, the employer has 5 business days to review it. If approved, payment is released to your registered bank account within 2–3 business days. If the employer doesn\'t review within 5 days, payment is automatically released to you.',
            },
            {
                id: 'tryout-rejected',
                q: 'What if my Tryout is rejected?',
                a: 'If your submission is rejected with valid reasoning provided by the employer, the payment is returned to them. You can view the rejection feedback in your Tryouts dashboard to improve for future opportunities. If you believe a rejection was unfair, you can raise a dispute through our support team.',
            },
        ],
    },
    {
        id: 'track-applications',
        label: 'My Applications',
        articles: [
            {
                id: 'track-applications',
                q: 'How do I track my applications?',
                a: 'Go to Dashboard > My Applications to see all your submitted applications. Each entry shows the job title, company, application date, and current status (Pending, Under Review, Interview, Offered, Rejected). Click any application to see the full timeline and any messages from the employer.',
            },
            {
                id: 'withdraw-application',
                q: 'Can I withdraw an application?',
                a: 'Yes. Visit Dashboard > My Applications, click the application you want to withdraw, and select "Withdraw Application." Note that once you withdraw, you cannot re-apply to the same job posting. Withdrawals are final.',
            },
        ],
    },
    {
        id: 'account',
        label: 'My Account',
        articles: [
            {
                id: 'change-password',
                q: 'How do I change my password?',
                a: 'Go to Settings > Account Security and click "Change Password." Enter your current password, then your new password twice to confirm. Your password must be at least 8 characters and include a mix of letters, numbers, and symbols. If you\'ve forgotten your password, use the "Forgot Password" link on the login page.',
            },
            {
                id: 'delete-account',
                q: 'How do I delete my account?',
                a: 'You can request account deletion from Settings > Account > Delete Account. We\'ll permanently delete all your personal data within 30 days, in compliance with privacy regulations. Note that completed tryout records may be retained for dispute resolution purposes for up to 90 days.',
            },
        ],
    },
];

function ArticleItem({ article }: { article: { id: string; q: string; a: string } }) {
    const [open, setOpen] = useState(false);
    return (
        <div id={article.id} className="border-b border-[#edeeef] last:border-0">
            <button
                className="w-full flex items-start justify-between py-5 text-left gap-4 group"
                onClick={() => setOpen(!open)}
            >
                <span className="font-medium text-[#191c1d] text-sm leading-relaxed pr-2">{article.q}</span>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f3f4f5] flex items-center justify-center group-hover:bg-[#d4e3ff] transition-colors mt-0.5">
                    {open
                        ? <ChevronUp className="w-3.5 h-3.5 text-[#176BBE]" />
                        : <ChevronDown className="w-3.5 h-3.5 text-[#414752]" />}
                </span>
            </button>
            {open && (
                <div className="pb-5 text-[#414752] text-sm leading-[1.7] pr-10">{article.a}</div>
            )}
        </div>
    );
}

export default function HelpJobSeekersPage() {
    const [activeCategory, setActiveCategory] = useState('getting-started');
    const current = categories.find(c => c.id === activeCategory) ?? categories[0];

    return (
        <div className="min-h-screen bg-[#f8f9fa] font-sans">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-24 pb-10 bg-gradient-to-br from-[#005399] to-[#176BBE]">
                <div className="max-w-5xl mx-auto px-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-blue-200 text-xs mb-5">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link to="/help" className="hover:text-white transition-colors">Help Center</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white font-medium">Job Seekers</span>
                    </div>
                    <Link to="/help" className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Help Center
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Help for Job Seekers</h1>
                            <p className="text-blue-100 text-sm mt-1">Guides to help you find jobs, take tryouts, and grow your career.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main content */}
            <div className="max-w-5xl mx-auto px-4 py-10">
                <div className="flex gap-8">

                    {/* Sidebar */}
                    <aside className="w-56 flex-shrink-0 hidden md:block">
                        <div className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] overflow-hidden sticky top-24">
                            <p className="px-4 pt-4 pb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">Categories</p>
                            <nav>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center justify-between group ${
                                            activeCategory === cat.id
                                                ? 'bg-[#d4e3ff] text-[#004785] font-semibold'
                                                : 'text-[#414752] hover:bg-[#f3f4f5] hover:text-[#191c1d]'
                                        }`}
                                    >
                                        <span>{cat.label}</span>
                                        <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${activeCategory === cat.id ? 'text-[#004785]' : 'text-gray-300 group-hover:text-gray-400'}`} />
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Article list */}
                    <main className="flex-1 min-w-0">
                        {/* Mobile category select */}
                        <div className="md:hidden mb-5">
                            <select
                                value={activeCategory}
                                onChange={e => setActiveCategory(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#176BBE]/20"
                            >
                                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </div>

                        <div className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] px-6">
                            <div className="py-5 border-b border-[#edeeef]">
                                <h2 className="text-lg font-bold text-[#191c1d]">{current.label}</h2>
                                <p className="text-sm text-[#414752] mt-0.5">{current.articles.length} articles</p>
                            </div>
                            <div>
                                {current.articles.map(a => (
                                    <ArticleItem key={a.id} article={a} />
                                ))}
                            </div>
                        </div>

                        {/* Contact card */}
                        <div className="mt-6 bg-[#d4e3ff] rounded-2xl px-6 py-5 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-[#001c3a]">Didn't find what you were looking for?</p>
                                <p className="text-xs text-[#004785] mt-0.5">Our support team replies within a few hours.</p>
                            </div>
                            <Link
                                to="/contact"
                                className="flex-shrink-0 px-4 py-2 bg-[#176BBE] text-white text-sm font-semibold rounded-xl hover:bg-[#005399] transition-colors"
                            >
                                Contact Us
                            </Link>
                        </div>
                    </main>
                </div>
            </div>

            <Footer />
        </div>
    );
}

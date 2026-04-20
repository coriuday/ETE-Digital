/**
 * Help for Employers Page
 * Stitch-designed: "Structured Sanctuary" aesthetic — Employer purple theme
 * Light mode only | Tertiary #5e37b3 | Font: Inter
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ChevronRight, ArrowLeft, Briefcase } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

const categories = [
    {
        id: 'getting-started',
        label: 'Getting Started',
        articles: [
            {
                id: 'post-job',
                q: 'How do I post a job for free?',
                a: 'After registering as an employer, go to your Employer Dashboard and click "Post a Job." Fill in the job title, description, requirements, location, job type, and salary range. You can post traditional job listings for free. Once submitted, your job goes live immediately and starts appearing in candidate search results.',
            },
            {
                id: 'employer-account',
                q: 'How do I set up my company profile?',
                a: 'Head to Settings > Company Profile to add your company name, logo, website, description, and industry. A complete company profile builds candidate trust and improves your job listing visibility. You can update your profile at any time.',
            },
            {
                id: 'employer-dashboard',
                q: 'What can I do in the Employer Dashboard?',
                a: 'The Employer Dashboard is your command center. From here, you can view and manage all your active job listings, see incoming applications, track tryout statuses, access analytics, and manage your account settings. Use the left sidebar to navigate between different sections.',
            },
        ],
    },
    {
        id: 'browse-candidates',
        label: 'Managing Applications',
        articles: [
            {
                id: 'browse-candidates',
                q: 'How do I browse and filter candidates?',
                a: 'Go to Applications in your Employer Dashboard. You\'ll see all applications for your active jobs. Use filters to sort by status (Applied, Under Review, Shortlisted, Rejected), skills, experience level, and location. Click any candidate\'s name to view their full profile, resume, and Talent Vault (if they\'ve shared it).',
            },
            {
                id: 'contact-candidate',
                q: 'How do I contact a candidate?',
                a: 'When viewing a candidate\'s application, click the "Message" button to send them a direct message through the platform. All communication is handled within JobsRow.com for privacy and compliance. Candidates are notified immediately and can respond from their dashboard.',
            },
            {
                id: 'shortlist-candidate',
                q: 'How do I shortlist or reject a candidate?',
                a: 'In the Applications view, each candidate card has a status dropdown. You can move them to "Under Review," "Shortlisted," "Interview Scheduled," "Offered," or "Rejected." Candidates are notified when their status changes. Providing a reason for rejection is encouraged but not mandatory.',
            },
        ],
    },
    {
        id: 'setup-tryout',
        label: 'Tryouts & Grading',
        articles: [
            {
                id: 'setup-tryout',
                q: 'How do I set up a Tryout?',
                a: 'When creating or editing a job listing, scroll to the Tryout section and toggle it on. Define the task description, expected deliverables, time limit (in days), and the compensation amount you\'ll pay candidates for completing it. The compensation is held in escrow by JobsRow.com and only released when you approve a submission.',
            },
            {
                id: 'grade-tryouts',
                q: 'How do I grade Tryout submissions?',
                a: 'Go to Employer Dashboard > Grade Tryouts. You\'ll see all pending submissions for your active tryouts. Click a submission to view the candidate\'s work. Use the scoring rubric to evaluate quality, then choose "Approve" or "Request Revision" or "Reject." If approved, the escrowed payment is released to the candidate automatically.',
            },
            {
                id: 'tryout-payment',
                q: 'What happens if I don\'t grade a Tryout in time?',
                a: 'You have 5 business days to review each tryout submission. If you don\'t grade within that window, the payment is automatically released to the candidate. This policy ensures fairness and encourages timely reviews. You can still leave feedback after automatic release.',
            },
            {
                id: 'tryout-cost',
                q: 'How much do Tryouts cost?',
                a: 'You set the compensation for each tryout—typically ₹2,000–₹20,000 depending on the complexity and time required. JobsRow.com charges a 10% platform fee on top of the tryout amount, deducted when you fund the escrow. There are no additional hidden fees.',
            },
        ],
    },
    {
        id: 'analytics',
        label: 'Analytics & Insights',
        articles: [
            {
                id: 'analytics',
                q: 'How do I access Analytics?',
                a: 'Go to Employer Dashboard > Analytics to view performance data for your job listings. You\'ll see metrics like total views, applications received, application conversion rate, tryout completion rate, and time-to-hire. Use the date range picker to compare performance across different periods.',
            },
            {
                id: 'job-performance',
                q: 'How can I improve my job listing performance?',
                a: 'Jobs with clear descriptions, competitive salary ranges, and an attached tryout consistently receive 3x more quality applications. Adding your full company profile, including a logo and description, also significantly boosts candidate interest. Analytics will show which listings are underperforming so you can refine them.',
            },
        ],
    },
    {
        id: 'billing',
        label: 'Billing & Pricing',
        articles: [
            {
                id: 'free-plan',
                q: 'What is included in the free plan?',
                a: 'The free plan lets you post unlimited job listings, receive and review applications, and message candidates. Tryouts require funding the escrow (plus the 10% platform fee). There is no subscription fee for the free plan.',
            },
            {
                id: 'pro-plan',
                q: 'What does the Pro plan include?',
                a: 'The Pro plan (₹9,999/month) includes priority listing placement, advanced analytics, unlimited tryouts with a reduced 7% platform fee, a dedicated account manager, and early access to new features. Ideal for companies hiring more than 5 roles per month.',
            },
            {
                id: 'refund',
                q: 'What is the refund policy for Tryouts?',
                a: 'If no candidate accepts your tryout within 14 days, the full escrow amount is refunded to your account. If you cancel a tryout before any submissions are received, a full refund is issued. Platform fees are non-refundable once a candidate has accepted the tryout.',
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
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f3f4f5] flex items-center justify-center group-hover:bg-[#e9ddff] transition-colors mt-0.5">
                    {open
                        ? <ChevronUp className="w-3.5 h-3.5 text-[#5e37b3]" />
                        : <ChevronDown className="w-3.5 h-3.5 text-[#414752]" />}
                </span>
            </button>
            {open && (
                <div className="pb-5 text-[#414752] text-sm leading-[1.7] pr-10">{article.a}</div>
            )}
        </div>
    );
}

export default function HelpEmployersPage() {
    const [activeCategory, setActiveCategory] = useState('getting-started');
    const current = categories.find(c => c.id === activeCategory) ?? categories[0];

    return (
        <div className="min-h-screen bg-[#f8f9fa] font-sans">
            <PublicNavbar />

            {/* Hero — employer purple theme */}
            <section className="pt-24 pb-10 bg-gradient-to-br from-[#23005c] to-[#5e37b3]">
                <div className="max-w-5xl mx-auto px-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-purple-200 text-xs mb-5">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link to="/help" className="hover:text-white transition-colors">Help Center</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white font-medium">Employers</span>
                    </div>
                    <Link to="/help" className="inline-flex items-center gap-1.5 text-purple-200 hover:text-white text-sm mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Help Center
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Help for Employers</h1>
                            <p className="text-purple-100 text-sm mt-1">Everything you need to post jobs, find talent, and hire smarter.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main content */}
            <div className="max-w-5xl mx-auto px-4 py-10">
                <div className="flex gap-8">

                    {/* Sidebar — purple employer theme */}
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
                                                ? 'bg-[#e9ddff] text-[#23005c] font-semibold'
                                                : 'text-[#414752] hover:bg-[#f3f4f5] hover:text-[#191c1d]'
                                        }`}
                                    >
                                        <span>{cat.label}</span>
                                        <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${activeCategory === cat.id ? 'text-[#5e37b3]' : 'text-gray-300 group-hover:text-gray-400'}`} />
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
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5e37b3]/20"
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

                        {/* Contact card — purple for employer */}
                        <div className="mt-6 bg-[#e9ddff] rounded-2xl px-6 py-5 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-[#23005c]">Didn't find what you were looking for?</p>
                                <p className="text-xs text-[#522aa7] mt-0.5">Our support team replies within a few hours.</p>
                            </div>
                            <Link
                                to="/contact"
                                className="flex-shrink-0 px-4 py-2 bg-[#5e37b3] text-white text-sm font-semibold rounded-xl hover:bg-[#23005c] transition-colors"
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

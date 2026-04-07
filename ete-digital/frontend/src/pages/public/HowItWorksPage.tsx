/**
 * How It Works Page — Jobsrow
 * Step-by-step visual guide for candidates and employers
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Search, Zap, CheckCircle2, ArrowRight, Upload,
    BarChart2, ShieldCheck, Users, Briefcase, Trophy,
    FileText, Star, ChevronRight
} from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.5 },
    }),
};

/* ── Step Card ────────────────────────────────────────────────────────────── */
function StepCard({
    number, icon, title, desc, tags, index
}: {
    number: string;
    icon: React.ReactNode;
    title: string;
    desc: string;
    tags?: string[];
    index: number;
}) {
    return (
        <motion.div
            custom={index}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative flex gap-6"
        >
            {/* Step number connector */}
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-violet-500/30">
                    {icon}
                </div>
                {/* Connector line */}
                <div className="flex-1 w-px bg-gradient-to-b from-violet-400/40 to-transparent mt-4 mb-0" />
            </div>

            {/* Content */}
            <div className="pb-12 flex-1">
                <span className="text-xs font-black uppercase tracking-widest text-violet-500 dark:text-violet-400 mb-1 block">
                    Step {number}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{desc}</p>
                {tags && (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-500/20">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

/* ── Comparison Row ───────────────────────────────────────────────────────── */
function CompareRow({ label, traditional, jobsrow }: { label: string; traditional: string; jobsrow: string }) {
    return (
        <div className="grid grid-cols-3 gap-4 py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</div>
            <div className="text-sm text-slate-400 dark:text-slate-500 line-through">{traditional}</div>
            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} /> {jobsrow}
            </div>
        </div>
    );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300">
            {/* Ambient glows */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/10 dark:bg-violet-600/15 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[120px]" />
            </div>

            <PublicNavbar />

            {/* ── Hero ── */}
            <header className="pt-36 pb-20 text-center px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 mb-6">
                        How Jobsrow Works
                    </span>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
                        Built for the Way{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
                            Hiring Should Be
                        </span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Jobsrow replaces outdated interview processes with real skill validation. Here's exactly how it works, for both candidates and employers.
                    </p>
                </motion.div>
            </header>

            {/* ── Tabs — Two journeys ── */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-28">
                <div className="grid md:grid-cols-2 gap-16">

                    {/* Candidate Journey */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-3 mb-10"
                        >
                            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center border border-violet-200 dark:border-violet-500/20">
                                <Users size={20} className="text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">For Candidates</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Your path from search to hired</p>
                            </div>
                        </motion.div>

                        <div>
                            <StepCard number="01" icon={<Search size={20} />} title="Browse & Discover"
                                desc="Search thousands of verified job listings. Filter by role, skills, location, salary, or remote options. Each listing is posted by a real verified employer."
                                tags={['Verified employers', 'Smart filters', 'Salary transparency']}
                                index={0} />
                            <StepCard number="02" icon={<FileText size={20} />} title="Build Your Profile"
                                desc="Set up your Jobsrow profile with your experience, skills, and links. Add your resume and toggle visibility to control who can find you."
                                tags={['Privacy controls', 'Resume upload', 'Skill tags']}
                                index={1} />
                            <StepCard number="03" icon={<Zap size={20} />} title="Take the Tryout"
                                desc="Jobs tagged with ⚡ Tryout have a real project challenge attached. Submit your work and our automated evaluator gives instant feedback."
                                tags={['Real projects', 'Auto-graded', 'Instant results']}
                                index={2} />
                            <StepCard number="04" icon={<ShieldCheck size={20} />} title="Vault Your Results"
                                desc="Your graded try out results are stored in your personal Talent Vault. Share it with any employer as a verified proof of skill — forever."
                                tags={['Shareable link', 'Permanent record', 'Employer verified']}
                                index={3} />
                            <StepCard number="05" icon={<Trophy size={20} />} title="Get Hired"
                                desc="Employers see your verified results, not just a CV. Get fast-tracked to final rounds or offers — sometimes without any additional interview."
                                tags={['Skip early rounds', 'Faster offers', 'Verified hiring']}
                                index={4} />
                        </div>
                    </div>

                    {/* Employer Journey */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-3 mb-10"
                        >
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                                <Briefcase size={20} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">For Employers</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">From job post to great hire</p>
                            </div>
                        </motion.div>

                        <div>
                            <StepCard number="01" icon={<Upload size={20} />} title="Post a Job"
                                desc="Create a job listing in minutes. Add title, description, skills, salary, and choose whether to attach a skill tryout challenge."
                                tags={['Free to post', 'Skills-based', 'Trout optional']}
                                index={0} />
                            <StepCard number="02" icon={<Zap size={20} />} title="Design a Tryout"
                                desc="Optionally attach a real project challenge to your listing. We handle distribution, submission collection, and automated grading."
                                tags={['Custom challenges', 'Auto-evaluation', 'Objective scoring']}
                                index={1} />
                            <StepCard number="03" icon={<Users size={20} />} title="Receive Applications"
                                desc="Candidates apply with their profile + tryout results. You see verified skill scores right on the application — no guesswork."
                                tags={['Verified scores', 'Skills visible', 'No resume parsing']}
                                index={2} />
                            <StepCard number="04" icon={<BarChart2 size={20} />} title="Evaluate & Compare"
                                desc="Use the analytics dashboard to rank candidates by tryout performance. See who *actually* has the skills your role needs."
                                tags={['Score comparison', 'Analytics dashboard', 'Side-by-side view']}
                                index={3} />
                            <StepCard number="05" icon={<CheckCircle2 size={20} />} title="Make the Hire"
                                desc="Reach out to top candidates directly through Jobsrow's messaging. Accept or reject applications with status updates to candidates."
                                tags={['Direct messaging', 'Status updates', 'Faster time-to-hire']}
                                index={4} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Comparison Table ── */}
            <section className="py-24 bg-white dark:bg-slate-900/30 border-y border-slate-200 dark:border-white/5">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                            Jobsrow vs Traditional Hiring
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">Why skill-based beats résumé-based every time</p>
                    </motion.div>

                    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
                        {/* Header */}
                        <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-200 dark:border-white/10 mb-2">
                            <div className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Category</div>
                            <div className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Traditional</div>
                            <div className="text-xs font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">Jobsrow</div>
                        </div>
                        <CompareRow label="Candidate evaluation" traditional="Resume screening" jobsrow="Live skill tryout" />
                        <CompareRow label="Time to shortlist" traditional="2–4 weeks" jobsrow="24–48 hours" />
                        <CompareRow label="Bias risk" traditional="High (name/college)" jobsrow="Near zero" />
                        <CompareRow label="Proof of skills" traditional="Self-declared" jobsrow="Verified & graded" />
                        <CompareRow label="Employer cost" traditional="Recruiter fees ~15%" jobsrow="Free to post" />
                        <CompareRow label="Candidate ghosting" traditional="Very common" jobsrow="Reduced with tryouts" />
                        <CompareRow label="Portfolio visibility" traditional="None" jobsrow="Permanent Talent Vault" />
                    </div>
                </div>
            </section>

            {/* ── FAQ Snippet ── */}
            <section className="py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Quick Questions</h2>
                    <p className="text-slate-500 dark:text-slate-400">Things people ask us all the time</p>
                </motion.div>
                <div className="space-y-4">
                    {[
                        {
                            q: 'Is Jobsrow free to use?',
                            a: 'Yes — candidates can browse jobs, take tryouts, and build their vault for free. Employers get one free job post. Premium plans unlock more posts and analytics.',
                        },
                        {
                            q: 'How are tryouts graded?',
                            a: 'We use an automated evaluation engine that checks code for correctness, efficiency, and best practices. Results are instant and objective — no human bias.',
                        },
                        {
                            q: 'Can I apply without doing a tryout?',
                            a: 'For jobs without a tryout, yes — your profile and resume are enough. For ⚡ Tryout roles, completing the challenge improves your chances significantly.',
                        },
                        {
                            q: 'How does the Talent Vault work?',
                            a: 'Your vault stores all your verified tryout results, projects, and certifications. You can share a secure link with employers at any time — it lives forever.',
                        },
                    ].map((item, i) => (
                        <motion.details
                            key={i}
                            custom={i}
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl p-6 cursor-pointer open:shadow-md transition-all"
                        >
                            <summary className="font-bold text-slate-900 dark:text-white flex items-center justify-between list-none">
                                {item.q}
                                <ChevronRight size={18} className="text-slate-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                            </summary>
                            <p className="mt-4 text-slate-500 dark:text-slate-400 leading-relaxed">{item.a}</p>
                        </motion.details>
                    ))}
                </div>
                <div className="mt-8 text-center">
                    <Link to="/faq" className="text-violet-600 dark:text-violet-400 font-bold hover:text-violet-500 dark:hover:text-violet-300 transition-colors flex items-center justify-center gap-2">
                        View all FAQs <ArrowRight size={16} />
                    </Link>
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section className="mx-4 md:mx-8 lg:mx-16 mb-16 py-20 rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 relative overflow-hidden text-center px-4">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10">
                    <div className="flex justify-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => <Star key={i} size={18} className="text-amber-300 fill-amber-300" />)}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-violet-200 text-lg mb-8 max-w-md mx-auto">
                        Join thousands of professionals and companies who've already made the switch.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/register" className="px-8 py-4 bg-white text-violet-700 rounded-full font-bold text-lg hover:bg-violet-50 hover:scale-105 transition-all shadow-xl">
                            Create Free Account
                        </Link>
                        <Link to="/jobs" className="px-8 py-4 border-2 border-white/40 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            Browse Jobs <ArrowRight size={18} />
                        </Link>
                    </div>
                </motion.div>
            </section>

            <Footer />
        </div>
    );
}

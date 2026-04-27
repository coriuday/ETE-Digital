/**
 * Jobsrow — Landing Page
 * Premium redesign with:
 *  • Full dark/light mode via Tailwind dark: prefix
 *  • Live Featured Roles from /api/jobs/search
 *  • Animated hero, stats, features, how-it-works, dual CTA
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Code, Zap, ShieldCheck, ChevronRight, Briefcase,
    MapPin, Clock, ArrowRight, Building2, Search, Star,
    Users, TrendingUp, CheckCircle2, Sparkles
} from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { jobsApi, Job } from '../../api/jobs';

/* ── Animated Counter ─────────────────────────────────────────────────────── */
function AnimatedStat({ value, label }: { value: string; label: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
        >
            <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-violet-400 dark:to-indigo-400">
                {value}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{label}</div>
        </motion.div>
    );
}

/* ── Job Card ─────────────────────────────────────────────────────────────── */
function FeaturedJobCard({ job, index }: { job: Job; index: number }) {
    const initials = (job.company ?? 'J').slice(0, 2).toUpperCase();
    const gradients = [
        'from-violet-600 to-indigo-600',
        'from-blue-600 to-cyan-600',
        'from-emerald-600 to-teal-600',
        'from-orange-500 to-amber-500',
        'from-pink-600 to-rose-600',
        'from-purple-600 to-violet-600',
    ];
    const grad = gradients[index % gradients.length];

    const formatSalary = () => {
        if (!job.salary_min) return 'Competitive';
        const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${n.toLocaleString()}`;
        return job.salary_max ? `${fmt(job.salary_min)} – ${fmt(job.salary_max)}` : `${fmt(job.salary_min)}+`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -6 }}
            className="group relative bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 hover:border-violet-400/50 dark:hover:border-violet-500/50 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] rounded-2xl p-6 flex flex-col transition-all duration-300 cursor-pointer"
        >
            <Link to={`/jobs/${job.id}`} className="absolute inset-0 z-10" aria-label={`View ${job.title}`} />

            {/* Company avatar + meta */}
            <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 text-white font-black text-sm shadow-lg`}>
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate text-base">
                        {job.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate font-medium">
                        {job.company ?? 'Confidential'}
                    </p>
                </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                {job.has_tryout && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-bold">
                        <Zap size={10} /> Tryout
                    </span>
                )}
                {job.remote_ok && (
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold">
                        Remote
                    </span>
                )}
                {job.job_type && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 text-xs font-medium capitalize">
                        <Clock size={10} /> {job.job_type.replace('_', ' ')}
                    </span>
                )}
                {job.location && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 text-xs font-medium">
                        <MapPin size={10} /> {job.location}
                    </span>
                )}
            </div>

            {/* Skills */}
            {job.skills_required?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.skills_required.slice(0, 3).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/5">
                            {s}
                        </span>
                    ))}
                    {job.skills_required.length > 3 && (
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400 font-medium">
                            +{job.skills_required.length - 3} more
                        </span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatSalary()}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 group-hover:gap-2 transition-all relative z-20">
                    Apply now <ArrowRight size={12} />
                </span>
            </div>
        </motion.div>
    );
}

/* ── Skeleton Card ────────────────────────────────────────────────────────── */
function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl p-6 animate-pulse">
            <div className="flex gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                </div>
            </div>
            <div className="flex gap-2 mb-4">
                <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
                <div className="h-5 w-12 bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full mb-2" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
        </div>
    );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function LandingPage() {
    const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
    const [jobsLoading, setJobsLoading] = useState(true);

    useEffect(() => {
        jobsApi.searchJobs({ page_size: 6, sort_by: 'created_at', sort_order: 'desc' })
            .then(data => setFeaturedJobs(data.jobs))
            .catch(() => setFeaturedJobs([]))
            .finally(() => setJobsLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-hidden font-sans transition-colors duration-300">

            {/* ── Ambient Background Glows (dark only) ── */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 dark:bg-violet-600/20 rounded-full blur-[128px] animate-pulse" />
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[100px]" />
            </div>

            <PublicNavbar />

            {/* ════════════════════════════════════════════
                HERO
            ════════════════════════════════════════════ */}
            <main className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex justify-center mb-8"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 shadow-sm">
                            <Sparkles size={14} className="text-violet-500 dark:text-violet-400" />
                            India’s Most Result-Oriented Hiring Platform
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                            Prove Your Skills.{' '}
                            <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-600 dark:from-violet-400 dark:via-indigo-400 dark:to-blue-400">
                                Land the Job.
                            </span>
                        </h1>
                        <p className="mt-4 max-w-2xl text-lg md:text-xl text-slate-500 dark:text-slate-400 mx-auto mb-10 leading-relaxed">
                            Skip generic interviews. Take skill-based tryouts, build your verified Talent Vault, and get hired by top companies — faster.
                        </p>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16"
                    >
                        <Link
                            to="/jobs"
                            className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 flex items-center justify-center gap-2"
                        >
                            <Search size={18} />
                            Find Elite Jobs
                        </Link>
                        <Link
                            to="/register"
                            className="group w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800/50 border-2 border-slate-300 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 text-slate-900 dark:text-white rounded-full font-bold text-lg hover:bg-violet-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                            Post a Job Free
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="max-w-3xl mx-auto mb-20"
                    >
                        <Link
                            to="/jobs"
                            className="flex items-center gap-3 w-full px-6 py-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md dark:hover:shadow-violet-500/10 backdrop-blur-md transition-all group"
                        >
                            <Search size={20} className="text-slate-400 dark:text-slate-500 group-hover:text-violet-500 transition-colors" />
                            <span className="text-slate-400 dark:text-slate-500 font-medium">
                                Search by role, skill, or company...
                            </span>
                            <span className="ml-auto flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 transition-colors text-white text-sm font-bold rounded-xl">
                                Search <ArrowRight size={14} />
                            </span>
                        </Link>
                    </motion.div>

                    {/* Stats Strip */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm dark:shadow-none">
                            <AnimatedStat value="2k+" label="Active Jobs" />
                            <AnimatedStat value="15k+" label="Verified Talent" />
                            <AnimatedStat value="40k+" label="Tryouts Taken" />
                            <AnimatedStat value="94%" label="Hire Rate" />
                        </div>
                    </motion.div>
                </div>
            </main>


            {/* ════════════════════════════════════════════
                FEATURES
            ════════════════════════════════════════════ */}
            <section className="py-28 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 mb-4">
                                Why Jobsrow
                            </span>
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
                                A Next-Gen Hiring Experience
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                                Skip the generic interviews. Prove exactly what you can build.
                            </p>
                        </motion.div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Code className="w-7 h-7" />,
                                color: 'text-blue-600 dark:text-blue-400',
                                bg: 'bg-blue-100 dark:bg-blue-500/10',
                                border: 'border-blue-200 dark:border-blue-500/20',
                                glow: 'hover:shadow-blue-500/10',
                                title: 'Skill-Based Tryouts',
                                desc: 'Take project-based assessments tailored to the exact role. Let your code speak louder than your resume.',
                            },
                            {
                                icon: <ShieldCheck className="w-7 h-7" />,
                                color: 'text-violet-600 dark:text-violet-400',
                                bg: 'bg-violet-100 dark:bg-violet-500/10',
                                border: 'border-violet-200 dark:border-violet-500/20',
                                glow: 'hover:shadow-violet-500/10',
                                title: 'Secure Talent Vault',
                                desc: 'Store verified projects, grades, and code in a shareable vault that travels with your career forever.',
                            },
                            {
                                icon: <Zap className="w-7 h-7" />,
                                color: 'text-emerald-600 dark:text-emerald-400',
                                bg: 'bg-emerald-100 dark:bg-emerald-500/10',
                                border: 'border-emerald-200 dark:border-emerald-500/20',
                                glow: 'hover:shadow-emerald-500/10',
                                title: 'Automated Grading',
                                desc: 'Instant AI-powered feedback on submissions using advanced evaluation. No waiting weeks for results.',
                            },
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                whileHover={{ y: -6 }}
                                className={`group p-8 rounded-3xl bg-white dark:bg-slate-900/50 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 hover:border-current/20 hover:shadow-xl ${f.glow} transition-all duration-300`}
                            >
                                <div className={`w-14 h-14 rounded-2xl ${f.bg} border ${f.border} flex items-center justify-center mb-6 ${f.color} group-hover:scale-110 transition-transform`}>
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{f.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════
                HOW IT WORKS
            ════════════════════════════════════════════ */}
            <section className="py-24 bg-white dark:bg-slate-900/30 border-y border-slate-200 dark:border-white/5">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                                How It Works
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">Three steps to your next role</p>
                        </motion.div>
                    </div>
                    <div className="relative grid md:grid-cols-3 gap-12">
                        {/* Connecting line (desktop) */}
                        <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px border-t-2 border-dashed border-slate-200 dark:border-white/10 z-0" style={{ left: '20%', right: '20%' }} />

                        {[
                            { step: '01', icon: <Search size={24} />, color: 'from-violet-600 to-indigo-600', title: 'Browse Roles', desc: 'Find jobs matching your skills from verified employers posting on Jobsrow.' },
                            { step: '02', icon: <Zap size={24} />, color: 'from-blue-600 to-cyan-600', title: 'Take the Tryout', desc: 'Complete a skill-based project challenge designed for the specific role.' },
                            { step: '03', icon: <CheckCircle2 size={24} />, color: 'from-emerald-600 to-teal-600', title: 'Get Hired', desc: 'Your verified performance speaks for itself. Get hired faster, better.' },
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="relative z-10 flex flex-col items-center text-center"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg mb-5`}>
                                    {step.icon}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Step {step.step}</span>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{step.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm max-w-xs">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-14 text-center">
                        <Link to="/how-it-works" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-violet-300 dark:border-violet-500/40 text-violet-700 dark:text-violet-400 font-bold hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors">
                            Learn more <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════
                FEATURED ROLES
            ════════════════════════════════════════════ */}
            <section className="py-28 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                            <span className="inline-block text-xs font-bold uppercase tracking-widest text-violet-700 dark:text-violet-400 mb-2">Live from employers</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Featured Roles</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Latest jobs posted by companies on Jobsrow</p>
                        </motion.div>
                        <Link
                            to="/jobs"
                            className="flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 font-bold transition-colors shrink-0"
                        >
                            View all jobs <ArrowRight size={16} />
                        </Link>
                    </div>

                    {jobsLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : featuredJobs.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-24 bg-white dark:bg-slate-900/30 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl"
                        >
                            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-8 h-8 text-violet-500 dark:text-violet-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No jobs posted yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                                Be the first to post a job and reach thousands of verified candidates.
                            </p>
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-full hover:shadow-lg hover:shadow-violet-500/30 transition-all"
                            >
                                Post a Job Free <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredJobs.map((job, i) => (
                                <FeaturedJobCard key={job.id} job={job} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ════════════════════════════════════════════
                DUAL CTA — CANDIDATES + EMPLOYERS
            ════════════════════════════════════════════ */}
            <section className="py-20 bg-white dark:bg-slate-900/30 border-y border-slate-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Candidates */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative p-8 rounded-3xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-600/10 dark:to-indigo-600/10 border border-violet-100 dark:border-violet-500/20 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-400/10 rounded-full blur-2xl" />
                            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                                <Users size={24} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">For Candidates</h3>
                            <ul className="space-y-3 mb-8">
                                {[
                                    'Prove skills, skip filter rounds',
                                    'Build a verified portfolio vault',
                                    'Get hired 3x faster than traditional',
                                    '1.5 Cr+ job opportunities',
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm font-medium">
                                        <CheckCircle2 size={16} className="text-violet-500 dark:text-violet-400 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-full hover:shadow-lg hover:shadow-violet-500/30 transition-all"
                            >
                                Find Your Next Job <ArrowRight size={16} />
                            </Link>
                        </motion.div>

                        {/* Employers */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative p-8 rounded-3xl bg-gradient-to-br from-slate-50 to-blue-50 dark:from-blue-600/10 dark:to-cyan-600/10 border border-blue-100 dark:border-blue-500/20 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl" />
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-6">
                                <TrendingUp size={24} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">For Employers</h3>
                            <ul className="space-y-3 mb-8">
                                {[
                                    'Access pre-vetted, skill-verified talent',
                                    'Set custom tryouts for any role',
                                    'Reduce time-to-hire by 60%',
                                    'Post your first job absolutely free',
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm font-medium">
                                        <CheckCircle2 size={16} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-full hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                            >
                                Post a Job Free <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>


            {/* ════════════════════════════════════════════
                FINAL CTA BANNER
            ════════════════════════════════════════════ */}
            <section className="py-20 mx-4 md:mx-8 lg:mx-16 mb-12 rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="relative z-10 text-center px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
                            Ready to Find Your Row?
                        </h2>
                        <p className="text-violet-200 text-lg mb-10 max-w-xl mx-auto">
                            Join 15,000+ verified professionals who get hired based on what they can do, not just what they say.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                to="/register"
                                className="px-8 py-4 bg-white text-violet-700 rounded-full font-bold text-lg hover:bg-violet-50 hover:scale-105 transition-all shadow-xl"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                to="/jobs"
                                className="px-8 py-4 border-2 border-white/40 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                Browse Jobs <Building2 size={18} />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

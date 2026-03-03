/**
 * Job Details Page — Premium Dark Mode Redesign
 * 70/30 split: rich details left, sticky application/tryout card right
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jobsApi, Job } from '../../api/jobs';
import { useAuthStore } from '../../stores/authStore';
import {
    ArrowLeft, MapPin, Clock, Globe, Eye, Users,
    CheckCircle2, Star, DollarSign, Loader2, Building2, CalendarDays, Zap, Code2, ChevronRight
} from 'lucide-react';

export default function JobDetailsPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (jobId) {
            setLoading(true);
            jobsApi.getJob(jobId)
                .then(setJob)
                .catch(() => setJob(null))
                .finally(() => setLoading(false));
        }
    }, [jobId]);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) { navigate('/login', { state: { returnTo: `/jobs/${jobId}` } }); return; }
        if (user?.role !== 'candidate') { alert('Only candidates can apply to jobs'); return; }
        setApplying(true);
        try {
            await jobsApi.applyToJob(jobId!, { cover_letter: coverLetter });
            setSuccess(true);
            setShowForm(false);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to apply');
        } finally {
            setApplying(false);
        }
    };

    // ── Loading Skeleton ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950">
                <div className="h-64 bg-slate-900 border-b border-white/5 animate-pulse" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-slate-900/50 rounded-3xl p-8 border border-white/5 animate-pulse">
                                <div className="h-5 bg-slate-800 rounded w-1/3 mb-6" />
                                <div className="space-y-3">
                                    <div className="h-3 bg-slate-800 rounded w-full" />
                                    <div className="h-3 bg-slate-800 rounded w-5/6" />
                                    <div className="h-3 bg-slate-800 rounded w-4/6" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-4">
                        <div className="bg-slate-900/50 rounded-3xl p-8 border border-white/5 h-96 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    // ── Not Found ───────────────────────────────────────────────────────────────
    if (!job) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/10 p-12">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building2 size={32} className="text-slate-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Position Not Found</h2>
                    <p className="text-slate-400 mb-8">This job may have been closed or the link is invalid.</p>
                    <Link to="/jobs" className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
                        Explore Open Roles
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30 pb-20">
            {/* Ambient Base Glow */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[150px]" />
            </div>

            {/* ── Hero Banner ─────────────────────────────────────────────────── */}
            <div className="relative z-10 bg-slate-900/40 border-b border-white/5 backdrop-blur-lg pt-24 pb-12 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
                    <Link to="/jobs" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 text-sm font-bold mb-8 transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Search
                    </Link>

                    <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-slate-800 to-slate-900 p-0.5 rounded-2xl shadow-2xl flex-shrink-0">
                            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center border border-white/5">
                                <Building2 size={36} className="text-blue-500" />
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">{job.title}</h1>
                            </div>

                            <p className="text-xl md:text-2xl font-medium text-slate-300 mb-6 flex items-center gap-2">
                                {job.company ?? (job as any).company_name ?? 'Confidential Company'}
                                {job.has_tryout && (
                                    <span className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-full uppercase tracking-wider">
                                        <Zap size={10} className="fill-purple-400" /> Tryout Expected
                                    </span>
                                )}
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm font-medium">
                                {job.location && (
                                    <span className="flex items-center gap-1.5 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                                        <MapPin size={14} className="text-slate-500" /> {job.location}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5 capitalize">
                                    <Clock size={14} className="text-slate-500" /> {job.job_type?.replace('_', ' ')}
                                </span>
                                {job.remote_ok && (
                                    <span className="flex items-center gap-1.5 text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                                        <Globe size={14} /> Remote OK
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Layout ─────────────────────────────────────────────────── */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Left Column: Job Details (70%) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Skills Header (If any) */}
                    {job.skills_required?.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                <Code2 size={20} className="text-blue-400" /> Tech Stack & Skills
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {job.skills_required.map((skill) => (
                                    <span key={skill} className="px-4 py-2 bg-slate-800/80 text-slate-300 text-sm font-bold rounded-xl border border-white/10 hover:border-blue-500/50 hover:text-blue-300 transition-colors cursor-default">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Description */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm prose prose-invert max-w-none">
                        <h2 className="text-xl font-bold text-white mb-6">About the Role</h2>
                        <div className="text-slate-400 text-base leading-relaxed whitespace-pre-line font-medium">{job.description}</div>
                    </motion.div>

                    {/* Requirements */}
                    {job.requirements && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm prose prose-invert max-w-none">
                            <h2 className="text-xl font-bold text-white mb-6">Requirements</h2>
                            <div className="text-slate-400 text-base leading-relaxed whitespace-pre-line font-medium">{job.requirements}</div>
                        </motion.div>
                    )}
                </div>

                {/* Right Column: Sticky Sidebar (30%) */}
                <div className="lg:col-span-4">
                    <div className="sticky top-28 space-y-6">

                        {/* Core Application Card */}
                        <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                            {/* Salary Glow Top */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-purple-500" />

                            {/* Salary Display */}
                            <div className="mb-8">
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Compensation</p>
                                {job.salary_min ? (
                                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                        ${job.salary_min.toLocaleString()}
                                        {job.salary_max && <span className="text-slate-500 text-xl font-bold mx-1">–</span>}
                                        {job.salary_max && `$${job.salary_max.toLocaleString()}`}
                                    </div>
                                ) : (
                                    <div className="text-2xl font-bold text-slate-300">Competitive</div>
                                )}
                            </div>

                            {/* Tryout Callout */}
                            {job.has_tryout && (
                                <div className="mb-8 relative p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 inner-glow-amber">
                                    <div className="absolute -top-3 -right-3 w-20 h-20 bg-amber-500/10 blur-xl rounded-full pointer-events-none" />
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Star size={14} className="text-amber-400 fill-amber-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-1">Skill Tryout Required</h4>
                                            <p className="text-xs text-amber-200/60 leading-relaxed font-medium">To apply, you must complete a practical coding challenge to prove your skills.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Application Action */}
                            {success ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 size={24} className="text-emerald-400" />
                                    </div>
                                    <p className="font-bold text-emerald-300 mb-1">Application Sent!</p>
                                    <p className="text-xs text-emerald-400/70 mb-4">The employer will review your profile.</p>
                                    <Link to="/dashboard" className="text-sm font-bold text-white hover:text-emerald-300 transition-colors flex items-center justify-center gap-1">
                                        Go to dashboard <ChevronRight size={14} />
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    {!showForm ? (
                                        <button
                                            onClick={() => isAuthenticated ? setShowForm(true) : navigate('/login', { state: { returnTo: `/jobs/${jobId}` } })}
                                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-2xl hover:scale-[1.02] transform transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
                                        >
                                            {isAuthenticated ? (job.has_tryout ? 'Take Tryout to Apply' : 'Apply Now') : 'Sign In to Apply'}
                                        </button>
                                    ) : (
                                        <form onSubmit={handleApply} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 text-sm mb-4">
                                                {job.has_tryout ? (
                                                    <p className="text-amber-300 font-medium">By clicking submit, you agree to start the timed Tryout challenge immediately.</p>
                                                ) : (
                                                    <p className="text-slate-400">Please provide a brief cover letter (optional) below before submitting.</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cover Letter</label>
                                                <textarea
                                                    value={coverLetter}
                                                    onChange={(e) => setCoverLetter(e.target.value)}
                                                    rows={4}
                                                    placeholder="State your case..."
                                                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-600 font-medium"
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button type="button" onClick={() => setShowForm(false)}
                                                    className="px-6 py-3 border border-white/10 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                                                    Cancel
                                                </button>
                                                <button type="submit" disabled={applying}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl disabled:opacity-50 transition-colors">
                                                    {applying ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit Application'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Secondary Info Card */}
                        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-sm space-y-4 text-sm font-medium">
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                <span className="text-slate-500 flex items-center gap-2"><CalendarDays size={14} /> Posted</span>
                                <span className="text-white">{new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                <span className="text-slate-500 flex items-center gap-2"><Eye size={14} /> Views</span>
                                <span className="text-white">{job.views_count.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 flex items-center gap-2"><Users size={14} /> Applicants</span>
                                <span className="text-white">{job.applications_count.toLocaleString()}</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

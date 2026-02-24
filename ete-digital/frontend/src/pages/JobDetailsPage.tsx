/**
 * Job Details Page — 60/40 split: rich details left, sticky application card right
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobsApi, Job } from '../api/jobs';
import { useAuthStore } from '../stores/authStore';
import {
    ArrowLeft, MapPin, Clock, Globe, Eye, Users,
    CheckCircle2, Star, DollarSign, Loader2, Building2, CalendarDays
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

    // Loading skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="h-48 bg-gradient-to-br from-slate-900 to-blue-900 animate-pulse" />
                <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-100 rounded w-full" />
                                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl p-6 h-64 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Building2 size={48} className="text-gray-200 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Job not found</h2>
                    <Link to="/jobs" className="text-blue-600 hover:text-blue-700 font-medium">← Back to search</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Company Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-violet-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
                <div className="relative max-w-6xl mx-auto px-6 py-10">
                    <Link to="/jobs" className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-sm font-medium mb-6 transition-colors">
                        <ArrowLeft size={15} /> Back to search
                    </Link>
                    <div className="flex items-start gap-5">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Building2 size={28} className="text-white" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-2xl md:text-3xl font-extrabold text-white">{job.title}</h1>
                                {job.has_tryout && (
                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
                                        <Star size={11} className="fill-amber-400 text-amber-400" /> Tryout Available
                                    </span>
                                )}
                            </div>
                            <p className="text-blue-200 text-lg">{job.company ?? (job as any).company_name ?? 'Company'}</p>
                            <div className="flex flex-wrap gap-3 mt-3 text-sm text-blue-200">
                                {job.location && <span className="flex items-center gap-1"><MapPin size={13} /> {job.location}</span>}
                                <span className="flex items-center gap-1 capitalize"><Clock size={13} /> {job.job_type?.replace('_', ' ')}</span>
                                {job.remote_ok && <span className="flex items-center gap-1"><Globe size={13} /> Remote</span>}
                                <span className="flex items-center gap-1"><Eye size={13} /> {job.views_count} views</span>
                                <span className="flex items-center gap-1"><Users size={13} /> {job.applications_count} applicants</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* ── Left: Details 60% ──────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Salary */}
                    {job.salary_min && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4">
                            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                                <DollarSign size={22} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5">Annual Salary</p>
                                <p className="text-xl font-extrabold text-gray-900">
                                    ${job.salary_min.toLocaleString()}
                                    {job.salary_max ? ` – $${job.salary_max.toLocaleString()}` : '+'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h2 className="font-bold text-gray-900 text-lg mb-4">Job Description</h2>
                        <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{job.description}</div>
                    </div>

                    {/* Requirements */}
                    {job.requirements && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 text-lg mb-4">Requirements</h2>
                            <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{job.requirements}</div>
                        </div>
                    )}

                    {/* Skills */}
                    {job.skills_required?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 text-lg mb-4">Required Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {job.skills_required.map((skill) => (
                                    <span key={skill} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl border border-blue-100">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tryout Section */}
                    {job.has_tryout && (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <Star size={20} className="text-amber-600 fill-amber-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900">Job Tryout Available</h2>
                                    <p className="text-xs text-amber-700">Paid trial task · Stand out from other applicants</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                This employer uses ETE Digital's Tryout system. Complete a real, paid task to prove your skills
                                before the interview. Top tryout scores move to the front of the queue.
                            </p>
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                {['Paid Task', 'AI Scoring', 'Fast Feedback'].map((f) => (
                                    <div key={f} className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                                        <CheckCircle2 size={13} className="text-amber-600" /> {f}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right: Sticky Application Card 40% ────────────────── */}
                <div className="lg:col-span-2">
                    <div className="sticky top-6 space-y-4">
                        {/* Application card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <p className="text-xs text-gray-400 font-medium mb-4 flex items-center gap-1.5">
                                <CalendarDays size={12} /> Posted {new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>

                            {success ? (
                                <div className="flex flex-col items-center gap-3 py-4">
                                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <CheckCircle2 size={30} className="text-emerald-500" />
                                    </div>
                                    <p className="font-bold text-gray-900">Application Submitted!</p>
                                    <p className="text-sm text-gray-500 text-center">You'll hear back from the employer soon.</p>
                                    <Link to="/dashboard" className="text-blue-600 text-sm font-medium hover:text-blue-700">
                                        View my applications →
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    {!showForm ? (
                                        <button
                                            onClick={() => isAuthenticated ? setShowForm(true) : navigate('/login', { state: { returnTo: `/jobs/${jobId}` } })}
                                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/20 text-sm"
                                        >
                                            {isAuthenticated ? 'Apply Now' : 'Sign In to Apply'}
                                        </button>
                                    ) : (
                                        <form onSubmit={handleApply} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Letter <span className="text-gray-400 font-normal">(optional)</span></label>
                                                <textarea
                                                    value={coverLetter}
                                                    onChange={(e) => setCoverLetter(e.target.value)}
                                                    rows={5}
                                                    placeholder="Tell us why you're a great fit…"
                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setShowForm(false)}
                                                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                                    Cancel
                                                </button>
                                                <button type="submit" disabled={applying}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl disabled:opacity-60 text-sm">
                                                    {applying ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : 'Submit'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Quick info */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3 text-sm">
                            {[
                                { label: 'Job Type', value: job.job_type?.replace('_', ' ') },
                                { label: 'Location', value: job.location || 'Not specified' },
                                { label: 'Remote', value: job.remote_ok ? 'Yes' : 'No' },
                                { label: 'Applicants', value: `${job.applications_count}` },
                            ].map((row) => (
                                <div key={row.label} className="flex justify-between items-center">
                                    <span className="text-gray-500">{row.label}</span>
                                    <span className="font-semibold text-gray-800 capitalize">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

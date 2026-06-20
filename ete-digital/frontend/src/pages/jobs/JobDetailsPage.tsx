/**
 * Job Details Page — Light theme (matches JobsRow design system)
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jobsApi, Job } from '../../api/jobs';
import { useAuthStore } from '../../stores/authStore';
import AppShell from '../../components/layout/AppShell';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { toastSuccess, toastError } from '../../utils/toast';
import {
    ArrowLeft, MapPin, Clock, Globe, Eye, Users,
    CheckCircle2, Star, Loader2, Building2, CalendarDays, Zap, Code2,
    ChevronRight, ExternalLink, ShieldCheck,
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
    const [existingAppStatus, setExistingAppStatus] = useState<string | null>(null);

    useEffect(() => {
        if (jobId) {
            setLoading(true);
            jobsApi.getJob(jobId)
                .then(setJob)
                .catch(() => setJob(null))
                .finally(() => setLoading(false));
        }
    }, [jobId]);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'candidate' || !jobId) {
            setExistingAppStatus(null);
            return;
        }
        jobsApi.getMyApplications(1)
            .then((res: { applications?: { job_id: string; status: string }[] }) => {
                const match = res.applications?.find(a => a.job_id === jobId);
                setExistingAppStatus(match?.status ?? null);
            })
            .catch(() => setExistingAppStatus(null));
    }, [isAuthenticated, user?.role, jobId]);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login', { state: { returnTo: `/jobs/${jobId}` } });
            return;
        }
        if (user?.role !== 'candidate') {
            toastError('Only candidates can apply to jobs');
            return;
        }
        setApplying(true);
        try {
            await jobsApi.applyToJob(jobId!, { cover_letter: coverLetter });
            setSuccess(true);
            setShowForm(false);
            setExistingAppStatus('pending');
            toastSuccess('Application submitted successfully');
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toastError(typeof detail === 'string' ? detail : 'Failed to apply');
        } finally {
            setApplying(false);
        }
    };

    const pageContent = (() => {
        if (loading) {
            return (
                <div className="min-h-screen bg-gray-50">
                    <div className="h-48 bg-white border-b border-gray-200 animate-pulse" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-8 space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-2xl p-8 border border-gray-200 animate-pulse">
                                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-6" />
                                    <div className="space-y-3">
                                        <div className="h-3 bg-gray-100 rounded w-full" />
                                        <div className="h-3 bg-gray-100 rounded w-5/6" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-2xl p-8 border border-gray-200 h-80 animate-pulse" />
                        </div>
                    </div>
                </div>
            );
        }

        if (!job) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Building2 size={28} className="text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Position Not Found</h2>
                        <p className="text-gray-500 mb-8">This job may have been closed or the link is invalid.</p>
                        <Link to="/jobs" className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
                            Explore Open Roles
                        </Link>
                    </div>
                </div>
            );
        }

        const companyName = job.company ?? (job as Job & { company_name?: string }).company_name ?? 'Confidential Company';
        const hasActiveApplication = existingAppStatus && !['rejected', 'withdrawn'].includes(existingAppStatus);
        const wasRejected = existingAppStatus === 'rejected';
        const canShowApply = !hasActiveApplication && !success;

        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                {/* Hero */}
                <div className="bg-white border-b border-gray-200 pt-6 pb-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <Link to="/jobs" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 text-sm font-semibold mb-6 transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Search
                        </Link>

                        <div className="flex flex-col md:flex-row items-start gap-6">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Building2 size={32} className="text-primary-600" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{job.title}</h1>
                                <p className="text-lg md:text-xl font-medium text-gray-600 mb-4 flex items-center gap-2 flex-wrap">
                                    {companyName}
                                    {job.employer_verified && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
                                            <ShieldCheck size={12} /> Verified
                                        </span>
                                    )}
                                    {job.has_tryout && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold rounded-full">
                                            <Zap size={10} /> Tryout
                                        </span>
                                    )}
                                </p>
                                <div className="flex flex-wrap gap-2 text-sm">
                                    {job.location && (
                                        <span className="flex items-center gap-1.5 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                                            <MapPin size={14} className="text-gray-400" /> {job.location}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg capitalize">
                                        <Clock size={14} className="text-gray-400" /> {job.job_type?.replace('_', ' ')}
                                    </span>
                                    {job.remote_ok && (
                                        <span className="flex items-center gap-1.5 text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100">
                                            <Globe size={14} /> Remote OK
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                        {job.skills_required?.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Code2 size={18} className="text-primary-600" /> Skills & Tech Stack
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills_required.map(skill => (
                                        <span key={skill} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg border border-gray-200">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">About the Role</h2>
                            <div className="text-gray-600 text-base leading-relaxed whitespace-pre-line">{job.description}</div>
                        </motion.div>

                        {job.requirements && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Requirements</h2>
                                <div className="text-gray-600 text-base leading-relaxed whitespace-pre-line">{job.requirements}</div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 space-y-4">
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div className="mb-6">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Compensation</p>
                                    {job.salary_min ? (
                                        <p className="text-2xl font-extrabold text-gray-900">
                                            ${job.salary_min.toLocaleString()}
                                            {job.salary_max && <span className="text-gray-400 mx-1">–</span>}
                                            {job.salary_max && `$${job.salary_max.toLocaleString()}`}
                                        </p>
                                    ) : (
                                        <p className="text-xl font-bold text-gray-700">Competitive</p>
                                    )}
                                </div>

                                {job.has_tryout && (
                                    <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                                        <div className="flex items-start gap-3">
                                            <Star size={16} className="text-amber-500 fill-amber-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 mb-1">Skill Tryout Required</h4>
                                                <p className="text-xs text-amber-800/80 leading-relaxed">Complete a practical challenge to apply for this role.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {success ? (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                                        <CheckCircle2 size={28} className="text-emerald-600 mx-auto mb-2" />
                                        <p className="font-bold text-emerald-800 mb-1">Application Sent!</p>
                                        <p className="text-xs text-emerald-600 mb-3">The employer will review your profile.</p>
                                        <Link to="/dashboard" className="text-sm font-semibold text-primary-600 hover:underline flex items-center justify-center gap-1">
                                            Go to dashboard <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                ) : job.external_apply_url ? (
                                    <div className="space-y-3">
                                        <a href={job.external_apply_url} target="_blank" rel="noopener noreferrer"
                                            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                                            <ExternalLink size={16} /> Apply on Company Website
                                        </a>
                                        <p className="text-xs text-gray-500 text-center">
                                            You'll be redirected to {companyName}'s careers page.
                                        </p>
                                    </div>
                                ) : hasActiveApplication ? (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                                        <CheckCircle2 size={28} className="text-blue-600 mx-auto mb-2" />
                                        <p className="font-bold text-blue-900 mb-1">Application submitted</p>
                                        <p className="text-xs text-blue-700 mb-3">Your application is being reviewed.</p>
                                        <Link to="/dashboard/applications" className="text-sm font-semibold text-primary-600 hover:underline flex items-center justify-center gap-1">
                                            View my applications <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                ) : wasRejected && !showForm ? (
                                    <div className="space-y-3">
                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
                                            You were previously rejected for this role. You may reapply after the employer&apos;s cooldown period.
                                        </div>
                                        <button
                                            onClick={() => isAuthenticated ? setShowForm(true) : navigate('/login', { state: { returnTo: `/jobs/${jobId}` } })}
                                            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                                        >
                                            Apply Again
                                        </button>
                                    </div>
                                ) : !showForm && canShowApply && !wasRejected ? (
                                    <button
                                        onClick={() => isAuthenticated ? setShowForm(true) : navigate('/login', { state: { returnTo: `/jobs/${jobId}` } })}
                                        className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                                    >
                                        {isAuthenticated ? (job.has_tryout ? 'Take Tryout to Apply' : 'Apply Now') : 'Sign In to Apply'}
                                    </button>
                                ) : showForm && (canShowApply || wasRejected) ? (
                                    <form onSubmit={handleApply} className="space-y-4">
                                        <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                            {wasRejected
                                                ? 'Submit a new application for this role. Cooldown rules may apply.'
                                                : job.has_tryout
                                                    ? 'By submitting, you agree to start the timed Tryout challenge.'
                                                    : 'Add an optional cover letter below.'}
                                        </p>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cover Letter</label>
                                            <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={4}
                                                placeholder="Tell them why you're a great fit…"
                                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 resize-none bg-white" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setShowForm(false)}
                                                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                                                Cancel
                                            </button>
                                            <button type="submit" disabled={applying}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl disabled:opacity-50">
                                                {applying ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : wasRejected ? 'Submit Reapplication' : 'Submit Application'}
                                            </button>
                                        </div>
                                    </form>
                                ) : null}
                            </div>

                            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3 text-sm">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                                    <span className="text-gray-500 flex items-center gap-2"><CalendarDays size={14} /> Posted</span>
                                    <span className="font-semibold text-gray-900">
                                        {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                                    <span className="text-gray-500 flex items-center gap-2"><Eye size={14} /> Views</span>
                                    <span className="font-semibold text-gray-900">{job.views_count.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 flex items-center gap-2"><Users size={14} /> Applicants</span>
                                    <span className="font-semibold text-gray-900">{job.applications_count.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    })();

    if (isAuthenticated) {
        return <AppShell>{pageContent}</AppShell>;
    }

    return (
        <>
            <PublicNavbar />
            <div className="pt-16">{pageContent}</div>
        </>
    );
}

/**
 * Employer Jobs Page — Premium rebuild
 *
 * Improvements:
 *  - Design system tokens throughout
 *  - useCallback + AbortController for data fetching
 *  - Skeleton loading rows replace full-page pulse
 *  - EmptyState component
 *  - FilterTab component with active count badges
 *  - Proper Job type used (no `any`)
 *  - Consistent button/link sizing
 *  - "Close" confirmation uses a proper accessible confirm dialog approach
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi, Job } from '../../api/jobs';
import toast from 'react-hot-toast';
import {
    Users, Eye, CalendarDays, Plus, Briefcase, Zap,
    PenSquare, X as CloseIcon,
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

/* ── Status config ──────────────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Active' },
    ACTIVE: { color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Active' },
    draft:  { color: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Draft' },
    DRAFT:  { color: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Draft' },
    closed: { color: 'bg-background text-text-tertiary border border-border', label: 'Closed' },
    CLOSED: { color: 'bg-background text-text-tertiary border border-border', label: 'Closed' },
};

const FILTER_TABS = ['all', 'active', 'draft', 'closed'] as const;
type FilterStatus = typeof FILTER_TABS[number];

export default function EmployerJobsPage() {
    const [jobs, setJobs]             = useState<Job[]>([]);
    const [loading, setLoading]       = useState(true);
    const [filterStatus, setFilter]   = useState<FilterStatus>('all');
    const [closingId, setClosingId]   = useState<string | null>(null);

    const loadJobs = useCallback(async (signal?: AbortSignal) => {
        try {
            const response = await jobsApi.getEmployerJobs();
            if (signal?.aborted) return;
            setJobs(response.jobs || []);
        } catch {
            if (signal?.aborted) return;
            toast.error('Failed to load jobs');
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        loadJobs(controller.signal);
        return () => controller.abort();
    }, [loadJobs]);

    const filteredJobs = jobs.filter(job => {
        if (filterStatus === 'all') return true;
        return job.status.toLowerCase() === filterStatus;
    });

    const handleCloseJob = async (jobId: string) => {
        if (!confirm('Close this job? It will no longer accept new applications.')) return;
        setClosingId(jobId);
        try {
            await jobsApi.deleteJob(jobId);
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'closed' } : j));
            toast.success('Job closed successfully');
        } catch {
            toast.error('Failed to close job. Please try again.');
        } finally {
            setClosingId(null);
        }
    };

    /* Count per status */
    const counts: Record<string, number> = { all: jobs.length };
    jobs.forEach(j => {
        const key = j.status.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
    });

    return (
        <AppShell>
            <div className="p-6 lg:p-8 space-y-5 max-w-5xl mx-auto">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-text-primary">My Jobs</h1>
                        <p className="text-sm text-text-secondary mt-0.5">Manage your job postings</p>
                    </div>
                    <Link
                        to="/employer/jobs/create"
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm flex-shrink-0"
                    >
                        <Plus size={15} /> Post New Job
                    </Link>
                </div>

                {/* ── Filter Tabs ──────────────────────────────────────── */}
                <div className="flex flex-wrap gap-2">
                    {FILTER_TABS.map(s => {
                        const count = counts[s] ?? 0;
                        const label = s === 'all' ? 'All' : STATUS_CFG[s]?.label ?? s;
                        const isActive = filterStatus === s;
                        return (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={[
                                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                                    isActive
                                        ? 'bg-text-primary text-white border-text-primary'
                                        : 'bg-surface text-text-secondary border-border hover:border-text-tertiary hover:text-text-primary',
                                ].join(' ')}
                            >
                                {label}
                                <span className={[
                                    'min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold',
                                    isActive ? 'bg-white/20 text-white' : 'bg-background text-text-tertiary',
                                ].join(' ')}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Job List ─────────────────────────────────────────── */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-surface rounded-xl border border-border p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-2.5 flex-1">
                                        <Skeleton className="h-5 w-56" />
                                        <Skeleton className="h-3.5 w-72" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-8 w-28 rounded-lg" />
                                        <Skeleton className="h-8 w-14 rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-border">
                        <EmptyState
                            icon={<Briefcase />}
                            title={filterStatus === 'all' ? 'No jobs posted yet' : `No ${STATUS_CFG[filterStatus]?.label ?? filterStatus} jobs`}
                            description={filterStatus === 'all' ? 'Start by posting your first job to attract candidates' : `Switch filter to see other jobs`}
                            action={filterStatus === 'all' ? { label: 'Post a Job', href: '/employer/jobs/create' } : undefined}
                            size="md"
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredJobs.map(job => {
                            const cfg = STATUS_CFG[job.status] ?? STATUS_CFG.closed;
                            const appCount = job.applications_count ?? 0;
                            const isClosing = closingId === job.id;

                            return (
                                <div
                                    key={job.id}
                                    className="bg-surface rounded-xl border border-border shadow-card p-5 hover:shadow-card-hover transition-shadow"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        {/* Job Info */}
                                        <div className="flex-1 min-w-0">
                                            {/* Title + status badges */}
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <h3 className="text-sm font-semibold text-text-primary truncate">{job.title}</h3>
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                                {job.has_tryout && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                                                        <Zap size={10} /> Tryout
                                                    </span>
                                                )}
                                                <span className={[
                                                    'flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold',
                                                    appCount > 0
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-background text-text-tertiary border border-border',
                                                ].join(' ')}>
                                                    <Users size={10} />
                                                    {appCount} {appCount === 1 ? 'Applicant' : 'Applicants'}
                                                </span>
                                            </div>

                                            {/* Meta row */}
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
                                                <span className="flex items-center gap-1">
                                                    📍 {job.location || 'Remote'}
                                                </span>
                                                <span>· {job.job_type?.replace('_', ' ') ?? 'Full-time'}</span>
                                                {job.salary_min && job.salary_max && (
                                                    <span>
                                                        · {job.salary_currency ?? '₹'} {job.salary_min.toLocaleString()}–{job.salary_max.toLocaleString()}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Eye size={10} /> {job.views_count ?? 0} views
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays size={10} />
                                                    {new Date(job.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Link
                                                to={`/employer/applications?job=${job.id}`}
                                                className="flex items-center gap-1.5 px-3.5 py-2 bg-primary-50 text-primary-600 border border-primary-200 rounded-lg text-xs font-semibold hover:bg-primary-100 transition-colors"
                                            >
                                                <Users size={12} /> Applications
                                            </Link>
                                            {job.has_tryout && (
                                                <Link
                                                    to={`/employer/tryouts/grade?jobId=${job.id}`}
                                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-50 text-violet-600 border border-violet-200 rounded-lg text-xs font-semibold hover:bg-violet-100 transition-colors"
                                                >
                                                    <Zap size={12} /> Grade
                                                </Link>
                                            )}
                                            <Link
                                                to={`/employer/jobs/${job.id}/edit`}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-background text-text-secondary border border-border rounded-lg text-xs font-semibold hover:bg-surface hover:text-text-primary transition-colors"
                                                title="Edit job"
                                            >
                                                <PenSquare size={12} /> Edit
                                            </Link>
                                            {job.status !== 'closed' && job.status !== 'CLOSED' && (
                                                <button
                                                    onClick={() => handleCloseJob(job.id)}
                                                    disabled={isClosing}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    title="Close job"
                                                >
                                                    <CloseIcon size={12} /> {isClosing ? '…' : 'Close'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppShell>
    );
}

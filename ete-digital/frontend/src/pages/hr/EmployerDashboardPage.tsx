/**
 * HR Dashboard — Premium rebuild
 *
 * Improvements:
 *  - Design system tokens throughout (no raw gray-* / bg-white)
 *  - Skeleton loaders replace '—' flashes on KPI cards
 *  - AbortController useEffect cleanup (no memory leaks)
 *  - Proper TypeScript types (no `any`)
 *  - EmptyState component replaces inline empties
 *  - memoized KpiCard
 *  - Match bar uses design-system colors
 *  - Consistent border/shadow usage
 */
import { useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import {
    Briefcase, Users, Star, UserCheck, TrendingUp,
    PlusCircle, ClipboardList, BarChart2, ArrowRight,
    Eye, CheckCircle2, XCircle,
} from 'lucide-react';
import { jobsApi } from '../../api/jobs';

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Application {
    id: string;
    candidate_name?: string;
    applicant_name?: string;
    candidate_email?: string;
    job_title?: string;
    match_score?: number;
    status: string;
    created_at: string;
    tryout_submitted?: boolean;
}

interface Job {
    id: string;
    title: string;
    location?: string | null;
    job_type?: string | null;
    status: string;
    application_count?: number;
    applications_count?: number;
}

interface DashboardStats {
    jobs: number;
    applications: number;
    tryouts: number;
    hired: number;
}


/* ── Status pill ────────────────────────────────────────────────────────── */
const STATUS_PILLS: Record<string, string> = {
    PENDING:     'bg-amber-50 text-amber-700 border border-amber-200',
    REVIEWING:   'bg-blue-50 text-blue-700 border border-blue-200',
    ACCEPTED:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
    REJECTED:    'bg-red-50 text-red-700 border border-red-200',
    SHORTLISTED: 'bg-violet-50 text-violet-700 border border-violet-200',
};

/* ── Match bar ──────────────────────────────────────────────────────────── */
function MatchBar({ score }: { score: number }) {
    const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-400';
    return (
        <div className="flex items-center gap-2 w-32">
            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${score}%` }}
                />
            </div>
            <span className="text-xs font-semibold text-text-secondary tabular-nums w-8">{score}%</span>
        </div>
    );
}

/* ── KPI Card ───────────────────────────────────────────────────────────── */
interface KpiCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    iconBg: string;
    trend?: string;
    loading: boolean;
}

const KpiCard = memo(function KpiCard({ label, value, icon, iconBg, trend, loading }: KpiCardProps) {
    return (
        <div className="bg-surface rounded-xl p-5 border border-border shadow-card flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                {loading ? (
                    <>
                        <Skeleton className="h-7 w-16 mb-1.5" />
                        <Skeleton className="h-3.5 w-24" />
                    </>
                ) : (
                    <>
                        <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
                        <p className="text-xs text-text-secondary mt-1">{label}</p>
                        {trend && (
                            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                                <TrendingUp size={10} /> {trend}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
});

/* ── Candidate avatar initials ──────────────────────────────────────────── */
function CandidateAvatar({ name }: { name: string }) {
    const initial = (name || 'C').charAt(0).toUpperCase();
    return (
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initial}
        </div>
    );
}

/* ── Main Dashboard ─────────────────────────────────────────────────────── */
export default function EmployerDashboardPage() {
    const [jobs, setJobs]           = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [stats, setStats]         = useState<DashboardStats>({ jobs: 0, applications: 0, tryouts: 0, hired: 0 });
    const [loading, setLoading]     = useState(true);

    const fetchData = useCallback(async (signal: AbortSignal) => {
        try {
            const jobsData = await jobsApi.getEmployerJobs().catch(() => ({ total: 0, jobs: [] }));
            const jobList: Job[] = jobsData.jobs ?? [];

            let appList: Application[] = [];
            if (jobList.length > 0) {
                const appsData = await jobsApi.getJobApplications(jobList[0].id, 1)
                    .catch(() => ({ total: 0, applications: [] }));
                appList = appsData.applications ?? [];
            }

            if (signal.aborted) return;

            setJobs(jobList.slice(0, 3));
            setApplications(appList.slice(0, 5));
            setStats({
                jobs:         jobsData.total ?? jobList.length,
                applications: appList.length,
                tryouts:      appList.filter(a => a.tryout_submitted).length,
                hired:        appList.filter(a => a.status === 'ACCEPTED').length,
            });
        } catch {
            // keep defaults on error
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
    }, [fetchData]);

    return (
        <AppShell>
            <div className="p-6 lg:p-8 space-y-7 max-w-6xl mx-auto">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-text-primary">HR Dashboard</h1>
                        <p className="text-sm text-text-secondary mt-1">Manage your postings and review candidates</p>
                    </div>
                    <Link
                        to="/hr/jobs/create"
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm flex-shrink-0"
                    >
                        <PlusCircle size={15} /> Post a Job
                    </Link>
                </div>

                {/* ── KPI Cards ─────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label="Active Jobs"
                        value={stats.jobs}
                        icon={<Briefcase size={18} className="text-blue-600" />}
                        iconBg="bg-blue-50"
                        trend="Live listings"
                        loading={loading}
                    />
                    <KpiCard
                        label="Applications"
                        value={stats.applications}
                        icon={<Users size={18} className="text-violet-600" />}
                        iconBg="bg-violet-50"
                        loading={loading}
                    />
                    <KpiCard
                        label="Tryouts"
                        value={stats.tryouts}
                        icon={<Star size={18} className="text-amber-600" />}
                        iconBg="bg-amber-50"
                        loading={loading}
                    />
                    <KpiCard
                        label="Candidates Hired"
                        value={stats.hired}
                        icon={<UserCheck size={18} className="text-emerald-600" />}
                        iconBg="bg-emerald-50"
                        trend="All time"
                        loading={loading}
                    />
                </div>

                {/* ── Quick Actions ─────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { label: 'Post a Job', sub: 'Create new listing', href: '/hr/jobs/create', icon: <PlusCircle size={19} />, color: 'text-primary-600', hover: 'hover:bg-primary-50 hover:border-primary-200' },
                        { label: 'Review Applications', sub: 'View & respond to candidates', href: '/hr/applications', icon: <ClipboardList size={19} />, color: 'text-violet-600', hover: 'hover:bg-violet-50 hover:border-violet-200' },
                        { label: 'Analytics', sub: 'Track performance', href: '/hr/analytics', icon: <BarChart2 size={19} />, color: 'text-amber-600', hover: 'hover:bg-amber-50 hover:border-amber-200' },
                    ].map(a => (
                        <Link
                            key={a.href}
                            to={a.href}
                            className={`flex items-center gap-4 p-4 bg-surface border border-border rounded-xl transition-all duration-150 group shadow-card ${a.hover}`}
                        >
                            <span className={`${a.color} flex-shrink-0`}>{a.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-text-primary text-sm">{a.label}</p>
                                <p className="text-xs text-text-secondary truncate">{a.sub}</p>
                            </div>
                            <ArrowRight size={14} className="text-border group-hover:text-text-secondary transition-colors flex-shrink-0" />
                        </Link>
                    ))}
                </div>

                {/* ── Panels Row ────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Recent Applications */}
                    <div className="bg-surface rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <h2 className="text-sm font-semibold text-text-primary">Recent Applications</h2>
                            <Link to="/hr/applications" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors">
                                View all <ArrowRight size={11} />
                            </Link>
                        </div>

                        {loading ? (
                            <div className="divide-y divide-border">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-3.5 w-36" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                        <Skeleton className="h-5 w-16 rounded-md" />
                                    </div>
                                ))}
                            </div>
                        ) : applications.length === 0 ? (
                            <EmptyState
                                icon={<ClipboardList />}
                                title="No applications yet"
                                description="Post a job to start receiving candidates"
                                size="sm"
                                action={{ label: 'Post a Job', href: '/hr/jobs/create' }}
                            />
                        ) : (
                            <div className="divide-y divide-border">
                                {applications.map(app => {
                                    const name = app.candidate_name ?? app.applicant_name ?? 'Candidate';
                                    const pill = STATUS_PILLS[app.status] ?? 'bg-background text-text-tertiary border border-border';
                                    return (
                                        <div key={app.id} className="flex items-center gap-3 px-5 py-3 hover:bg-background transition-colors">
                                            <CandidateAvatar name={name} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                                                <p className="text-xs text-text-tertiary truncate">{app.job_title ?? app.candidate_email ?? ''}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <MatchBar score={app.match_score ?? 70} />
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${pill}`}>
                                                    {app.status}
                                                </span>
                                                <Link
                                                    to={`/hr/applications/${app.id}`}
                                                    className="p-1 rounded-md text-text-tertiary hover:bg-primary-50 hover:text-primary-600 transition-colors"
                                                    title="View application"
                                                >
                                                    <Eye size={14} />
                                                </Link>
                                                <button className="p-1 rounded-md text-text-tertiary hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Accept">
                                                    <CheckCircle2 size={14} />
                                                </button>
                                                <button className="p-1 rounded-md text-text-tertiary hover:bg-red-50 hover:text-red-500 transition-colors" title="Reject">
                                                    <XCircle size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Active Job Listings */}
                    <div className="bg-surface rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <h2 className="text-sm font-semibold text-text-primary">Active Job Listings</h2>
                            <Link to="/hr/jobs" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors">
                                Manage <ArrowRight size={11} />
                            </Link>
                        </div>

                        {loading ? (
                            <div className="divide-y divide-border">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between px-5 py-4">
                                        <div className="space-y-1.5">
                                            <Skeleton className="h-3.5 w-40" />
                                            <Skeleton className="h-3 w-28" />
                                        </div>
                                        <Skeleton className="h-5 w-20 rounded-md" />
                                    </div>
                                ))}
                            </div>
                        ) : jobs.length === 0 ? (
                            <EmptyState
                                icon={<Briefcase />}
                                title="No active jobs"
                                description="Post your first job to start hiring"
                                size="sm"
                                action={{ label: 'Post Your First Job', href: '/hr/jobs/create' }}
                            />
                        ) : (
                            <div className="divide-y divide-border">
                                {jobs.map(job => {
                                    const appCount = job.application_count ?? job.applications_count ?? 0;
                                    return (
                                        <div key={job.id} className="flex items-center justify-between px-5 py-4 hover:bg-background transition-colors">
                                            <div className="min-w-0 mr-4">
                                                <p className="text-sm font-semibold text-text-primary truncate">{job.title}</p>
                                                <p className="text-xs text-text-tertiary mt-0.5">
                                                    {job.location ?? 'Remote'} · {job.job_type ?? 'Full-time'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <div className="text-right">
                                                    <p className="text-xs font-semibold text-text-primary">{appCount} applicants</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.status === 'ACTIVE' || job.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-background text-text-tertiary'}`}>
                                                        {job.status}
                                                    </span>
                                                </div>
                                                <Link
                                                    to={`/hr/applications?job=${job.id}`}
                                                    className="p-1.5 rounded-lg text-text-tertiary hover:bg-primary-50 hover:text-primary-600 transition-colors"
                                                    title="View applications"
                                                >
                                                    <ArrowRight size={14} />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AppShell>
    );
}

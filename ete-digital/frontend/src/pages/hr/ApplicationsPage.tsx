/**
 * Applications Page — HR view of all candidate applications
 */
import { useState, useEffect, useCallback, memo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { jobsApi } from '../../api/jobs';
import {
    hrPageCls, inputCls, selectCls, cardCls, btnPrimary, btnSecondary,
    APPLICATION_STATUS,
} from './hrShared';
import {
    ClipboardList, Users, Search, Filter, Star, ChevronRight,
    AlertCircle, Briefcase, Calendar, Zap, ArrowUpDown,
} from 'lucide-react';

interface Application {
    id: string;
    job_id: string;
    job_title: string;
    candidate_id: string;
    candidate_name: string;
    candidate_email: string;
    cover_letter: string | null;
    status: string;
    match_score: number | null;
    fraud_score?: number;
    created_at: string;
}

function MatchBadge({ score }: { score: number | null }) {
    if (score === null) return null;
    const color = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';
    const barColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-400';
    const bgColor = score >= 80
        ? 'bg-emerald-50 border-emerald-200'
        : score >= 60
            ? 'bg-amber-50 border-amber-200'
            : 'bg-red-50 border-red-200';

    return (
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${bgColor}`}>
            <Zap size={11} className={color} />
            <span className={color}>{score}% match</span>
            <div className="w-12 h-1 rounded-full bg-border overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
            </div>
        </div>
    );
}

function FraudBadge({ score }: { score?: number }) {
    if (score === undefined || score < 20) return null;
    const color = score >= 60 ? 'text-red-600' : 'text-amber-600';
    const bgColor = score >= 60 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${bgColor}`} title="Suspicious activity detected">
            <AlertCircle size={12} className={color} />
            <span className={color}>Fraud: {score}</span>
        </div>
    );
}

const KpiCard = memo(function KpiCard({
    label, value, icon, iconBg, loading,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    iconBg: string;
    loading: boolean;
}) {
    return (
        <div className={`${cardCls} p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                {icon}
            </div>
            <div>
                {loading ? (
                    <>
                        <Skeleton className="h-6 w-12 mb-1" />
                        <Skeleton className="h-3 w-20" />
                    </>
                ) : (
                    <>
                        <p className="text-xl font-extrabold text-text-primary">{value}</p>
                        <p className="text-xs text-text-secondary">{label}</p>
                    </>
                )}
            </div>
        </div>
    );
});

function ApplicationSkeleton() {
    return (
        <div className={`${cardCls} p-5 animate-pulse`}>
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
        </div>
    );
}

export default function ApplicationsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterJob, setFilterJob] = useState(searchParams.get('job') || 'all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'match'>('match');
    const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const jobsData = await jobsApi.getEmployerJobs();
            const jobList = jobsData.jobs || [];
            setJobs(jobList);

            const results = await Promise.allSettled(
                jobList.map((job: { id: string; title: string }) =>
                    jobsApi.getJobApplications(job.id).then(data => ({ job, data }))
                )
            );

            const allApps: Application[] = [];
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    const { job, data } = result.value;
                    (data.applications || []).forEach((app: Application) => {
                        allApps.push({ ...app, job_title: job.title });
                    });
                }
            }
            setApplications(allApps);
        } catch {
            setError('Failed to load applications. Please refresh to try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    let filtered = applications
        .filter(a => filterStatus === 'all' || a.status === filterStatus)
        .filter(a => filterJob === 'all' || a.job_id === filterJob)
        .filter(a => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                a.candidate_name?.toLowerCase().includes(q) ||
                a.candidate_email?.toLowerCase().includes(q) ||
                a.job_title?.toLowerCase().includes(q)
            );
        });

    filtered = [...filtered].sort((a, b) => {
        if (sortBy === 'match') {
            return (b.match_score ?? -1) - (a.match_score ?? -1);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const pendingCount = applications.filter(a => a.status === 'pending').length;
    const withScore = applications.filter(a => a.match_score !== null);
    const avgMatch = withScore.length
        ? Math.round(withScore.reduce((s, a) => s + (a.match_score ?? 0), 0) / withScore.length)
        : 0;

    return (
        <AppShell>
            <div className={hrPageCls}>
                <PageHeader
                    title="Applications"
                    description={`${applications.length} total · sorted by ${sortBy === 'match' ? 'AI match score' : 'date applied'}`}
                />

                {!loading && applications.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <KpiCard label="Total" value={applications.length} icon={<Users size={18} className="text-primary-600" />} iconBg="bg-primary-50" loading={loading} />
                        <KpiCard label="Pending Review" value={pendingCount} icon={<ClipboardList size={18} className="text-amber-600" />} iconBg="bg-amber-50" loading={loading} />
                        <KpiCard label="Avg Match Score" value={withScore.length ? `${avgMatch}%` : '—'} icon={<Zap size={18} className="text-violet-600" />} iconBg="bg-violet-50" loading={loading} />
                    </div>
                )}

                <div className={`${cardCls} p-4 flex flex-wrap items-center gap-3`}>
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Search size={15} className="text-text-tertiary flex-shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search candidates or jobs…"
                            className={inputCls}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-text-tertiary" />
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
                            <option value="all">All Statuses</option>
                            {Object.entries(APPLICATION_STATUS).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                    <select value={filterJob} onChange={e => setFilterJob(e.target.value)} className={selectCls}>
                        <option value="all">All Jobs</option>
                        {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                    <button
                        onClick={() => setSortBy(s => s === 'match' ? 'date' : 'match')}
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                            sortBy === 'match'
                                ? 'bg-primary-50 border-primary-200 text-primary-700'
                                : 'border-border text-text-secondary hover:bg-background'
                        }`}
                    >
                        <ArrowUpDown size={12} />
                        {sortBy === 'match' ? 'AI Match' : 'Newest'}
                    </button>
                    <span className="text-xs text-text-tertiary whitespace-nowrap">{filtered.length} shown</span>
                </div>

                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        <AlertCircle size={18} className="flex-shrink-0" />
                        <p className="flex-1">{error}</p>
                        <button onClick={loadData} className="underline text-xs font-medium">Retry</button>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => <ApplicationSkeleton key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={<ClipboardList size={40} />}
                        title="No applications found"
                        description={
                            applications.length === 0
                                ? 'No one has applied yet. Share your job listings to attract candidates.'
                                : 'Adjust your filters to see more results.'
                        }
                        action={applications.length === 0 ? { label: 'View My Jobs', onClick: () => navigate('/hr/jobs') } : undefined}
                    />
                ) : (
                    <div className="space-y-3">
                        {filtered.map(app => {
                            const statusCfg = APPLICATION_STATUS[app.status] ?? APPLICATION_STATUS.pending;
                            return (
                                <div key={app.id} className={`${cardCls} group transition-shadow hover:shadow-md`}>
                                    <div className="p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                {(app.candidate_name || 'C').charAt(0).toUpperCase()}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                    <h3 className="font-bold text-text-primary">{app.candidate_name || 'Candidate'}</h3>
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                                        {statusCfg.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-text-secondary">{app.candidate_email}</p>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-text-tertiary">
                                                    <span className="flex items-center gap-1"><Briefcase size={11} /> {app.job_title}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={11} />
                                                        Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                {(app.match_score !== null || (app.fraud_score && app.fraud_score >= 20)) && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <MatchBadge score={app.match_score} />
                                                        <FraudBadge score={app.fraud_score} />
                                                    </div>
                                                )}
                                                {app.cover_letter && (
                                                    <p className="mt-2.5 text-xs line-clamp-2 text-text-tertiary">{app.cover_letter}</p>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                <Link to={`/hr/applications/${app.id}`} className={btnPrimary + ' text-xs whitespace-nowrap'}>
                                                    Review <ChevronRight size={13} />
                                                </Link>
                                                {app.status === 'pending' && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await jobsApi.updateApplicationStatus(app.id, 'shortlisted');
                                                                setApplications(prev => prev.map(a =>
                                                                    a.id === app.id ? { ...a, status: 'shortlisted' } : a
                                                                ));
                                                            } catch { /* silent */ }
                                                        }}
                                                        className={btnSecondary + ' text-xs whitespace-nowrap border-emerald-200 text-emerald-700 hover:bg-emerald-50'}
                                                    >
                                                        <Star size={11} /> Shortlist
                                                    </button>
                                                )}
                                            </div>
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

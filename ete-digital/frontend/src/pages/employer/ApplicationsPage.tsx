/**
 * Applications Page — Employer view of all candidate applications
 * Premium redesign: AppShell, AI match scores, parallel loading, dark mode
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { jobsApi } from '../../api/jobs';
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
    match_explanation: Record<string, any> | null;
    created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    reviewed: { label: 'Reviewed', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    shortlisted: { label: 'Shortlisted ⭐', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
    hired: { label: 'Hired 🎉', color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
    withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
};

function MatchBadge({ score }: { score: number | null }) {
    if (score === null) return null;
    const color = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-400';
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
            <div className="w-12 h-1 rounded-full bg-gray-200 overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="rounded-2xl border p-5 animate-pulse bg-white border-gray-200">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex-shrink-0 bg-gray-200" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/5 rounded bg-gray-200" />
                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                </div>
                <div className="h-6 w-20 rounded-full bg-gray-200" />
            </div>
        </div>
    );
}

export default function ApplicationsPage() {
    const [searchParams] = useSearchParams();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterJob, setFilterJob] = useState(searchParams.get('job') || 'all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'match'>('match');
    const [jobs, setJobs] = useState<any[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const jobsData = await jobsApi.getEmployerJobs();
            const jobList = jobsData.jobs || [];
            setJobs(jobList);

            // Load all applications in parallel — tolerant of individual failures
            const results = await Promise.allSettled(
                jobList.map((job: any) => jobsApi.getJobApplications(job.id).then(data => ({ job, data })))
            );

            const allApps: Application[] = [];
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    const { job, data } = result.value;
                    (data.applications || []).forEach((app: any) => {
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

    // Filter & sort
    let filtered = applications
        .filter(a => filterStatus === 'all' || a.status === filterStatus)
        .filter(a => filterJob === 'all' || a.job_id === filterJob)
        .filter(a => {
            if (!search) return true;
            const q = search.toLowerCase();
            return a.candidate_name?.toLowerCase().includes(q) || a.candidate_email?.toLowerCase().includes(q) || a.job_title?.toLowerCase().includes(q);
        });

    filtered = [...filtered].sort((a, b) => {
        if (sortBy === 'match') {
            const sm = b.match_score ?? -1;
            const am = a.match_score ?? -1;
            return sm - am;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const bg = 'bg-gray-50';
    const cardBg = 'bg-white border-gray-200';
    const textPrimary = 'text-gray-900';
    const textMuted = 'text-gray-500';
    const inputCls = `w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-violet-500 bg-white border-gray-300 text-gray-900`;

    // KPI stats
    const pendingCount = applications.filter(a => a.status === 'pending').length;
    const avgMatch = applications.filter(a => a.match_score !== null).reduce((s, a) => s + (a.match_score ?? 0), 0) /
        (applications.filter(a => a.match_score !== null).length || 1);

    return (
        <AppShell>
            <div className={`min-h-full ${bg}`}>
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-5 bg-white">
                    <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                                <ClipboardList size={18} className="text-white" />
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold ${textPrimary}`}>Applications</h1>
                                <p className={`text-sm ${textMuted}`}>{applications.length} total · sorted by AI match score</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
                    {/* KPI Cards */}
                    {!loading && applications.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Total', value: applications.length, icon: <Users size={18} />, color: 'from-blue-500 to-indigo-600' },
                                { label: 'Pending Review', value: pendingCount, icon: <ClipboardList size={18} />, color: 'from-amber-500 to-orange-500' },
                                { label: 'Avg Match Score', value: `${Math.round(avgMatch)}%`, icon: <Zap size={18} />, color: 'from-violet-500 to-purple-600' },
                            ].map(kpi => (
                                <div key={kpi.label} className={`rounded-2xl border p-4 flex items-center gap-3 ${cardBg}`}>
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white flex-shrink-0`}>
                                        {kpi.icon}
                                    </div>
                                    <div>
                                        <p className={`text-xl font-extrabold ${textPrimary}`}>{kpi.value}</p>
                                        <p className={`text-xs ${textMuted}`}>{kpi.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Filters Toolbar */}
                    <div className={`rounded-2xl border p-4 flex flex-wrap items-center gap-3 ${cardBg}`}>
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <Search size={15} className={textMuted} />
                            <input
                                type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search candidates or jobs…" className={inputCls}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={14} className={textMuted} />
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputCls}>
                                <option value="all">All Statuses</option>
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>
                        <select value={filterJob} onChange={e => setFilterJob(e.target.value)} className={inputCls}>
                            <option value="all">All Jobs</option>
                            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                        </select>
                        <button
                            onClick={() => setSortBy(s => s === 'match' ? 'date' : 'match')}
                            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                                sortBy === 'match'
                                    ? 'bg-violet-50 border-violet-200 text-violet-700'
                                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <ArrowUpDown size={12} />
                            {sortBy === 'match' ? 'AI Match' : 'Newest'}
                        </button>
                        <span className={`text-xs ${textMuted} whitespace-nowrap`}>
                            {filtered.length} shown
                        </span>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <p>{error}</p>
                            <button onClick={loadData} className="ml-auto underline text-xs font-medium">Retry</button>
                        </div>
                    )}

                    {/* Applications */}
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-gray-300">
                            <ClipboardList size={48} className="mb-4 opacity-20" />
                            <h3 className={`font-bold text-lg mb-1 ${textPrimary}`}>No applications found</h3>
                            <p className={`text-sm ${textMuted}`}>
                                {applications.length === 0 ? 'No one has applied yet. Share your job listings to attract candidates.' : 'Adjust your filters to see more results.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map(app => {
                                const statusCfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                                return (
                                    <div key={app.id} className={`group rounded-2xl border transition-all hover:shadow-md ${cardBg}`}>
                                        <div className="p-5">
                                            <div className="flex items-start gap-4">
                                                {/* Avatar */}
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                    {(app.candidate_name || 'C').charAt(0).toUpperCase()}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                        <h3 className={`font-bold ${textPrimary}`}>{app.candidate_name || 'Candidate'}</h3>
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                                            {statusCfg.label}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm ${textMuted}`}>{app.candidate_email}</p>
                                                    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs ${textMuted}`}>
                                                        <span className="flex items-center gap-1"><Briefcase size={11} /> {app.job_title}</span>
                                                        <span className="flex items-center gap-1"><Calendar size={11} /> Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    </div>

                                                    {/* Match score */}
                                                    {app.match_score !== null && (
                                                        <div className="mt-2">
                                                            <MatchBadge score={app.match_score} />
                                                        </div>
                                                    )}

                                                    {/* Cover letter preview */}
                                                    {app.cover_letter && (
                                                        <p className={`mt-2.5 text-xs line-clamp-2 ${textMuted}`}>{app.cover_letter}</p>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-col gap-2 flex-shrink-0">
                                                    <Link
                                                        to={`/employer/applications/${app.id}`}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
                                                    >
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
                                                            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
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
            </div>
        </AppShell>
    );
}

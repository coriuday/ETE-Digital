/**
 * My Applications Page (Candidate)
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../api/client';
import { FileText, ArrowRight, Briefcase } from 'lucide-react';

interface Application {
    id: string; job_id: string; candidate_id: string; cover_letter: string | null;
    status: string; match_score: number | null; created_at: string; updated_at: string | null;
}
interface JobInfo {
    id: string; title: string; company: string; location: string | null;
    job_type: string; salary_min: number | null; salary_max: number | null; salary_currency: string;
}
interface EnrichedApplication extends Application { job?: JobInfo; }

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-amber-100 text-amber-700', label: 'Under Review' },
    reviewed: { color: 'bg-blue-100 text-blue-700', label: 'Reviewed' },
    shortlisted: { color: 'bg-violet-100 text-violet-700', label: 'Shortlisted ⭐' },
    rejected: { color: 'bg-red-100 text-red-600', label: 'Rejected' },
    hired: { color: 'bg-emerald-100 text-emerald-700', label: 'Hired! 🎉' },
    withdrawn: { color: 'bg-gray-100 text-gray-500', label: 'Withdrawn' },
};

function formatSalary(min: number | null, max: number | null, currency: string) {
    if (!min && !max) return null;
    const fmt = (n: number) => currency === 'INR' ? `₹${(n / 100000).toFixed(1)}L` : `$${(n / 1000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return `Up to ${fmt(max!)}`;
}

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState<EnrichedApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => { fetchApplications(); }, []);

    async function fetchApplications() {
        setLoading(true); setError('');
        try {
            const res = await api.get<{ applications: Application[]; total: number }>(
                '/api/jobs/applications/my-applications', { params: { page: 1, page_size: 50 } }
            );
            const enriched = await Promise.all(
                res.data.applications.map(async (app) => {
                    try {
                        const jobRes = await api.get<JobInfo>(`/api/jobs/${app.job_id}`);
                        return { ...app, job: jobRes.data };
                    } catch { return { ...app }; }
                })
            );
            setApplications(enriched);
        } catch { setError('Failed to load your applications. Please try again.'); }
        finally { setLoading(false); }
    }

    const filtered = statusFilter ? applications.filter((a) => a.status === statusFilter) : applications;

    return (
        <AppShell>
            <div className="p-6 lg:p-8">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
                        <p className="text-sm text-gray-500 mt-1">Track all your job applications</p>
                    </div>
                    <Link to="/jobs" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                        <Briefcase size={15} /> Browse Jobs
                    </Link>
                </div>

                {!loading && applications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button onClick={() => setStatusFilter('')}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${statusFilter === '' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                            All ({applications.length})
                        </button>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                            const count = applications.filter(a => a.status === key).length;
                            if (count === 0) return null;
                            return (
                                <button key={key} onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${statusFilter === key ? cfg.color + ' border-current' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                                    {cfg.label} ({count})
                                </button>
                            );
                        })}
                    </div>
                )}

                {loading ? (
                    <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-48 text-red-500 text-sm">
                        <p>{error}</p>
                        <button onClick={fetchApplications} className="mt-3 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors">Retry</button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-56 text-gray-400">
                        <FileText size={40} className="mb-3 opacity-30" />
                        <p className="text-sm font-medium text-gray-500">{statusFilter ? `No ${statusFilter} applications` : 'No applications yet'}</p>
                        {!statusFilter && (
                            <Link to="/jobs" className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                                Find Jobs <ArrowRight size={15} />
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((app) => {
                            const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                            const salary = app.job ? formatSalary(app.job.salary_min, app.job.salary_max, app.job.salary_currency) : null;
                            return (
                                <div key={app.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                {(app.job?.company || 'J').charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 leading-tight">{app.job?.title || 'Unknown Job'}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {app.job?.company || '—'}
                                                    {app.job?.location && <span className="text-gray-400"> · {app.job.location}</span>}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    {app.job?.job_type && <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-500 capitalize">{app.job.job_type.replace('_', ' ')}</span>}
                                                    {salary && <span className="px-2 py-0.5 bg-emerald-50 rounded-md text-xs text-emerald-600">{salary} /yr</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end gap-1.5 flex-shrink-0">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                                            {app.match_score !== null && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400">Match</span>
                                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${app.match_score >= 80 ? 'bg-emerald-500' : app.match_score >= 60 ? 'bg-amber-500' : 'bg-red-400'}`}
                                                            style={{ width: `${app.match_score}%` }} />
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-700">{app.match_score}%</span>
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-400">Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
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

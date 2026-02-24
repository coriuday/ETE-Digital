/**
 * Admin Jobs Moderation — List all jobs, close or reopen
 */
import { useState, useEffect, useCallback } from 'react';
import AppShell from '../../components/layout/AppShell';
import { Briefcase, Search, XCircle, RotateCcw } from 'lucide-react';
import { api } from '../../api/client';

interface AdminJob {
    id: string;
    title: string;
    company: string;
    employer_email?: string;
    status: string;
    views_count: number;
    applications_count: number;
    created_at: string;
}

export default function AdminJobsPage() {
    const [jobs, setJobs] = useState<AdminJob[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [moderating, setModerating] = useState<string | null>(null);
    const PAGE_SIZE = 20;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page, page_size: PAGE_SIZE };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/api/jobs/all', { params });
            setJobs(res.data.jobs ?? []);
            setTotal(res.data.total ?? 0);
        } catch {
            setJobs([]);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => { load(); }, [load]);

    const moderate = async (jobId: string, action: 'close' | 'reopen') => {
        setModerating(jobId);
        try {
            await api.patch(`/api/admin/jobs/${jobId}/moderate?action=${action}`);
            setJobs(prev => prev.map(j =>
                j.id === jobId ? { ...j, status: action === 'close' ? 'CLOSED' : 'ACTIVE' } : j
            ));
        } catch {
            alert('Failed to moderate job');
        } finally {
            setModerating(null);
        }
    };

    return (
        <AppShell>
            <div className="p-6 lg:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Briefcase size={24} className="text-red-500" />
                    <h1 className="text-2xl font-bold text-gray-900">Job Moderation</h1>
                    <span className="ml-auto text-sm text-gray-500">{total} total</span>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search jobs…"
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="CLOSED">Closed</option>
                        <option value="DRAFT">Draft</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="divide-y divide-gray-50">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center px-6 py-4 gap-4 animate-pulse">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-200 rounded w-48" />
                                        <div className="h-2 bg-gray-100 rounded w-32" />
                                    </div>
                                    <div className="h-6 w-16 bg-gray-100 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Briefcase size={36} className="text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500">No jobs found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        <th className="text-left px-6 py-3">Job</th>
                                        <th className="text-left px-6 py-3">Status</th>
                                        <th className="text-left px-6 py-3">Views</th>
                                        <th className="text-left px-6 py-3">Applications</th>
                                        <th className="text-left px-6 py-3">Posted</th>
                                        <th className="text-left px-6 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {jobs.map((job) => (
                                        <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                                                <p className="text-xs text-gray-400">{job.company}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${job.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                                        job.status === 'CLOSED' ? 'bg-red-100 text-red-600' :
                                                            'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{job.views_count}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{job.applications_count}</td>
                                            <td className="px-6 py-4 text-xs text-gray-400">
                                                {new Date(job.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {job.status === 'ACTIVE' ? (
                                                    <button
                                                        disabled={moderating === job.id}
                                                        onClick={() => moderate(job.id, 'close')}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    >
                                                        <XCircle size={13} /> Close
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled={moderating === job.id}
                                                        onClick={() => moderate(job.id, 'reopen')}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                                    >
                                                        <RotateCcw size={13} /> Reopen
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {/* Pagination */}
                    {total > PAGE_SIZE && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                            </p>
                            <div className="flex gap-2">
                                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">Prev</button>
                                <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}

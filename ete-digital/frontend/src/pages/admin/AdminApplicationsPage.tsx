/**
 * Admin Applications Page
 * Platform-wide application moderation for admin
 */
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import { adminPageCls, adminCardCls } from './adminShared';
import { api } from '../../api/client';
import { toastSuccess, toastError } from '../../utils/toast';

interface AdminApplication {
    id: string;
    job_id: string;
    candidate_id: string;
    candidate_email: string | null;
    candidate_name: string | null;
    job_title: string | null;
    company: string | null;
    status: string;
    match_score: number | null;
    created_at: string;
}

interface AdminApplicationListResponse {
    applications: AdminApplication[];
    total: number;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    reviewed: 'bg-blue-100 text-blue-700',
    shortlisted: 'bg-purple-100 text-purple-700',
    rejected: 'bg-red-50 text-red-600',
    reopened: 'bg-amber-50 text-amber-700',
    hired: 'bg-emerald-50 text-emerald-700',
    withdrawn: 'bg-background text-text-tertiary',
};

const STATUS_OPTIONS = ['pending', 'shortlisted', 'reviewed', 'rejected', 'reopened', 'hired', 'withdrawn'];

export default function AdminApplicationsPage() {
    const [applications, setApplications] = useState<AdminApplication[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const PAGE_SIZE = 15;

    useEffect(() => {
        fetchApplications();
        
    }, [page, statusFilter]);

    async function fetchApplications() {
        setLoading(true);
        setError('');
        try {
            const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
            if (statusFilter) params.status = statusFilter;
            const res = await api.get<AdminApplicationListResponse>('/api/admin/applications', { params });
            setApplications(res.data.applications);
            setTotal(res.data.total);
        } catch {
            setError('Failed to load applications.');
        } finally {
            setLoading(false);
        }
    }

    async function forceStatus(appId: string, status: string) {
        try {
            await api.post(`/api/admin/applications/${appId}/status`, { status });
            toastSuccess('Status updated');
            fetchApplications();
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toastError(typeof detail === 'string' ? detail : 'Failed to update status');
        }
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <AppShell>
            <div className={adminPageCls}>
                <PageHeader title="All Applications" description={`Platform-wide view — ${total} total`} />

                {/* Status filter pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {['', ...STATUS_OPTIONS].map((s) => (
                        <button
                            key={s || 'all'}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${statusFilter === s
                                    ? 'bg-violet-600 text-white border-violet-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                }`}
                        >
                            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className={`${adminCardCls} overflow-hidden`}>
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-48 text-red-500 text-sm">{error}</div>
                    ) : applications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <p className="text-sm">No applications found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        <th className="text-left px-6 py-3">Candidate</th>
                                        <th className="text-left px-6 py-3">Job / Company</th>
                                        <th className="text-left px-6 py-3">Status</th>
                                        <th className="text-left px-6 py-3">Match</th>
                                        <th className="text-left px-6 py-3">Applied</th>
                                        <th className="text-left px-6 py-3">Override</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">{app.candidate_name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-400">
                                                    {app.candidate_email || app.candidate_id.slice(0, 8) + '...'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">{app.job_title || 'N/A'}</p>
                                                <p className="text-xs text-gray-400">{app.company || '—'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-500'}`}>
                                                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {app.match_score !== null ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-violet-500"
                                                                style={{ width: `${app.match_score}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-600">{app.match_score}%</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-text-tertiary">
                                                {new Date(app.created_at).toLocaleDateString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                {app.status !== 'hired' && (
                                                    <select
                                                        defaultValue=""
                                                        onChange={(e) => {
                                                            if (e.target.value) forceStatus(app.id, e.target.value);
                                                            e.target.value = '';
                                                        }}
                                                        className="px-2 py-1 border border-border rounded-lg text-xs bg-surface"
                                                    >
                                                        <option value="">Set status…</option>
                                                        {STATUS_OPTIONS.filter(s => s !== app.status).map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-5">
                        <p className="text-sm text-gray-500">
                            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                            >
                                Prev
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}

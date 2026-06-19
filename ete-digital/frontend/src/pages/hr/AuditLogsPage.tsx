/**
 * AuditLogsPage — HR view organization audit trails
 */
import { useState, useEffect, useCallback } from 'react';
import AppShell from '../../components/layout/AppShell';
import api from '../../api/client';
import {
    ShieldAlert, Loader2, AlertCircle, FileText, RefreshCw,
} from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    ip_address: string | null;
    user_email: string | null;
    details: Record<string, unknown>;
    timestamp: string;
}

const ACTION_LABELS: Record<string, string> = {
    vault_access: 'Vault accessed',
    vault_share: 'Vault shared',
    data_export: 'Data exported',
    data_deletion: 'Data deleted',
    profile_update: 'Profile updated',
    password_change: 'Password changed',
    admin_action: 'Admin action',
    job_created: 'Job created',
    job_updated: 'Job updated',
    bulk_upload: 'Bulk upload',
    member_invited: 'Member invited',
    member_removed: 'Member removed',
    role_changed: 'Role changed',
    subscription_updated: 'Subscription updated',
    application_status_changed: 'Application status changed',
};

function formatAction(action: string): string {
    return ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = actionFilter ? { action: actionFilter } : {};
            const res = await api.get('/api/audit', { params });
            setLogs(res.data);
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number; data?: { detail?: string } } })?.response?.status;
            const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            if (status === 404) {
                setError('No organisation found. Complete company setup in Settings first.');
            } else if (status === 403) {
                setError('You do not have permission to view audit logs.');
            } else {
                setError(typeof detail === 'string' ? detail : 'Failed to load audit logs.');
            }
        } finally {
            setLoading(false);
        }
    }, [actionFilter]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const uniqueActions = [...new Set(logs.map(l => l.action))].sort();

    return (
        <AppShell>
            <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                            <ShieldAlert size={20} className="text-primary-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-text-primary">Audit Logs</h1>
                            <p className="text-sm text-text-secondary">Security and compliance trail for your organization</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={actionFilter}
                            onChange={e => setActionFilter(e.target.value)}
                            className="text-sm border border-border rounded-lg px-3 py-2 bg-surface text-text-primary"
                        >
                            <option value="">All actions</option>
                            {uniqueActions.map(a => (
                                <option key={a} value={a}>{formatAction(a)}</option>
                            ))}
                        </select>
                        <button
                            onClick={fetchLogs}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-background transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-primary-500" size={28} />
                    </div>
                ) : logs.length === 0 && !error ? (
                    <div className="bg-surface rounded-2xl border border-border shadow-sm p-12 text-center">
                        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText size={24} className="text-primary-400" />
                        </div>
                        <p className="font-semibold text-text-primary">No audit logs found</p>
                        <p className="text-sm text-text-secondary mt-1">Actions performed by your team will appear here.</p>
                    </div>
                ) : logs.length > 0 ? (
                    <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-background border-b border-border">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold tracking-wider text-xs uppercase text-text-tertiary">Timestamp</th>
                                        <th className="px-5 py-3 font-semibold tracking-wider text-xs uppercase text-text-tertiary">Action</th>
                                        <th className="px-5 py-3 font-semibold tracking-wider text-xs uppercase text-text-tertiary">User</th>
                                        <th className="px-5 py-3 font-semibold tracking-wider text-xs uppercase text-text-tertiary">IP Address</th>
                                        <th className="px-5 py-3 font-semibold tracking-wider text-xs uppercase text-text-tertiary">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-background/50 transition-colors">
                                            <td className="px-5 py-3 text-text-secondary whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="bg-primary-50 text-primary-700 border border-primary-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                                    {formatAction(log.action)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 font-medium text-text-primary">{log.user_email || 'System'}</td>
                                            <td className="px-5 py-3 text-text-tertiary font-mono text-xs">{log.ip_address || '—'}</td>
                                            <td className="px-5 py-3 text-text-secondary">
                                                {Object.keys(log.details).length > 0 ? (
                                                    <pre className="bg-background p-2 rounded-lg text-xs font-mono border border-border max-w-xs overflow-x-auto">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                ) : <span className="text-text-tertiary italic">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </div>
        </AppShell>
    );
}

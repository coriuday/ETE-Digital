/**
 * Admin Audit Logs — platform-wide audit trail
 */
import { useState, useEffect, useCallback } from 'react';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import { adminPageCls, adminCardCls, AdminLoading, AdminErrorBanner } from './adminShared';
import { api } from '../../api/client';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    ip_address: string | null;
    user_email: string | null;
    org_id: string | null;
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
    application_reopened: 'Application reopened',
    application_reapplied: 'Application reapplied',
};

function formatAction(action: string): string {
    return ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = actionFilter ? { action: actionFilter } : {};
            const res = await api.get('/api/admin/audit', { params });
            setLogs(res.data);
        } catch (e: unknown) {
            const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Failed to load audit logs.');
        } finally {
            setLoading(false);
        }
    }, [actionFilter]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const uniqueActions = [...new Set(logs.map(l => l.action))].sort();

    return (
        <AppShell>
            <div className={adminPageCls}>
                <PageHeader
                    title="Platform Audit Logs"
                    description="Security and compliance events across the entire platform"
                />

                <div className={`${adminCardCls} p-4 flex flex-wrap items-center gap-3`}>
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary"
                    >
                        <option value="">All actions</option>
                        {uniqueActions.map(a => (
                            <option key={a} value={a}>{formatAction(a)}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={fetchLogs}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-background text-text-secondary"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                {error && <AdminErrorBanner message={error} onRetry={fetchLogs} />}

                {loading ? (
                    <AdminLoading label="Loading audit logs…" />
                ) : logs.length === 0 ? (
                    <div className={`${adminCardCls} p-12 text-center text-text-secondary`}>
                        <ShieldAlert size={32} className="mx-auto mb-3 text-text-tertiary" />
                        <p>No audit events found.</p>
                    </div>
                ) : (
                    <div className={`${adminCardCls} overflow-hidden`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-background text-left text-text-tertiary">
                                        <th className="px-4 py-3 font-semibold">Time</th>
                                        <th className="px-4 py-3 font-semibold">Action</th>
                                        <th className="px-4 py-3 font-semibold">User</th>
                                        <th className="px-4 py-3 font-semibold">Resource</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id} className="border-b border-border last:border-0 hover:bg-background/50">
                                            <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-text-primary">
                                                {formatAction(log.action)}
                                            </td>
                                            <td className="px-4 py-3 text-text-secondary">{log.user_email ?? '—'}</td>
                                            <td className="px-4 py-3 text-text-tertiary text-xs">
                                                {log.resource_type ?? '—'}
                                                {log.resource_id ? ` · ${log.resource_id.slice(0, 8)}…` : ''}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}

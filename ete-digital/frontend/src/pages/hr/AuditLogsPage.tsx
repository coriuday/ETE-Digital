/**
 * AuditLogsPage — HR owners view organization audit trails
 */
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import api from '../../api/client';
import {
    ShieldAlert, Loader2, AlertCircle, FileText,
} from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    ip_address: string | null;
    user_email: string | null;
    details: Record<string, any>;
    timestamp: string;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchLogs = async () => {
        try {
            const res = await api.get('/audit');
            setLogs(res.data);
        } catch (e: any) {
            setError(e.response?.data?.detail ?? 'Failed to load audit logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    return (
        <AppShell>
            <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <ShieldAlert size={20} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
                        <p className="text-sm text-gray-500">Security and compliance trail for your organization</p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-indigo-500" size={28} />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText size={24} className="text-indigo-400" />
                        </div>
                        <p className="font-semibold text-gray-700">No audit logs found</p>
                        <p className="text-sm text-gray-400 mt-1">Actions performed by your team will appear here.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold tracking-wider text-xs uppercase text-gray-500">Timestamp</th>
                                        <th className="px-5 py-3 font-semibold tracking-wider text-xs uppercase text-gray-500">Action</th>
                                        <th className="px-5 py-3 font-semibold tracking-wider text-xs uppercase text-gray-500">User</th>
                                        <th className="px-5 py-3 font-semibold tracking-wider text-xs uppercase text-gray-500">IP Address</th>
                                        <th className="px-5 py-3 font-semibold tracking-wider text-xs uppercase text-gray-500">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 font-medium text-gray-900">{log.user_email || 'System'}</td>
                                            <td className="px-5 py-3 text-gray-400 font-mono text-xs">{log.ip_address || '-'}</td>
                                            <td className="px-5 py-3 text-gray-500">
                                                {Object.keys(log.details).length > 0 ? (
                                                    <pre className="bg-gray-50 p-2 rounded-lg text-xs font-mono border border-gray-100 max-w-xs overflow-x-auto">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                ) : <span className="text-gray-300 italic">—</span>}
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

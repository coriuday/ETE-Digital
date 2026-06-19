/**
 * Admin Organizations Page — Review standard-path employer registrations
 */
import { useState, useEffect, useCallback } from 'react';
import AppShell from '../../components/layout/AppShell';
import { Building2, CheckCircle2, XCircle, Shield, Loader2 } from 'lucide-react';
import { adminOrganizationsApi, AdminOrganization } from '../../api/organizations';

const tierColors: Record<string, string> = {
    unverified: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
    verified: 'bg-emerald-100 text-emerald-700',
};

export default function AdminOrganizationsPage() {
    const [orgs, setOrgs] = useState<AdminOrganization[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tierFilter, setTierFilter] = useState('pending');
    const [page, setPage] = useState(1);
    const [actionId, setActionId] = useState<string | null>(null);
    const PAGE_SIZE = 20;

    const loadOrgs = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
            if (tierFilter) params.trust_tier = tierFilter;
            const res = await adminOrganizationsApi.list(params);
            setOrgs(res.organizations);
            setTotal(res.total);
        } catch {
            setOrgs([]);
        } finally {
            setLoading(false);
        }
    }, [page, tierFilter]);

    useEffect(() => { loadOrgs(); }, [loadOrgs]);

    const approve = async (orgId: string) => {
        setActionId(orgId);
        try {
            await adminOrganizationsApi.approve(orgId);
            await loadOrgs();
        } catch {
            alert('Failed to approve organisation');
        } finally {
            setActionId(null);
        }
    };

    const reject = async (orgId: string) => {
        if (!confirm('Mark this organisation as unverified?')) return;
        setActionId(orgId);
        try {
            await adminOrganizationsApi.reject(orgId);
            await loadOrgs();
        } catch {
            alert('Failed to reject organisation');
        } finally {
            setActionId(null);
        }
    };

    return (
        <AppShell>
            <div className="p-6 lg:p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <Building2 size={24} className="text-red-500" />
                    <h1 className="text-2xl font-bold text-gray-900">Organisation Review</h1>
                    <span className="ml-auto text-sm text-gray-500">{total} organisations</span>
                </div>

                <div className="flex gap-3">
                    {['pending', 'verified', 'unverified', ''].map((tier) => (
                        <button
                            key={tier || 'all'}
                            onClick={() => { setTierFilter(tier); setPage(1); }}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                tierFilter === tier
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {tier === '' ? 'All' : tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="animate-spin text-gray-400" size={28} />
                        </div>
                    ) : orgs.length === 0 ? (
                        <p className="text-center py-16 text-gray-500 text-sm">No organisations found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Company</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Owner</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Path</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Tier</th>
                                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {orgs.map((org) => (
                                        <tr key={org.id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-900">{org.company_name}</p>
                                                <p className="text-xs text-gray-400">{org.website}</p>
                                                {org.industry && <p className="text-xs text-gray-500">{org.industry} · {org.company_size}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{org.owner_email ?? '—'}</td>
                                            <td className="px-4 py-3 capitalize text-gray-600">{org.registration_path}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${tierColors[org.trust_tier] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {org.trust_tier}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {org.trust_tier === 'pending' && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => approve(org.id)}
                                                            disabled={actionId === org.id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 size={14} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => reject(org.id)}
                                                            disabled={actionId === org.id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 disabled:opacity-50"
                                                        >
                                                            <XCircle size={14} /> Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {org.is_verified && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                                                        <Shield size={12} /> Verified
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {total > PAGE_SIZE && (
                    <div className="flex justify-center gap-2">
                        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Previous</button>
                        <span className="px-4 py-2 text-sm text-gray-500">Page {page}</span>
                        <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}
                            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Next</button>
                    </div>
                )}
            </div>
        </AppShell>
    );
}

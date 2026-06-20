/**
 * Admin Users Page — List, search, filter, activate/deactivate, role change, remove
 */
import { useState, useEffect, useCallback } from 'react';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import { adminPageCls, adminCardCls, adminInputCls, adminBtnDanger } from './adminShared';
import { Users, Search, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { toastSuccess, toastError } from '../../utils/toast';

interface AdminUser {
    id: string;
    email: string;
    role: string;
    is_verified: boolean;
    is_active: boolean;
    created_at: string;
}

const roleColors: Record<string, string> = {
    candidate: 'bg-blue-50 text-blue-700 border-blue-200',
    employer: 'bg-violet-50 text-violet-700 border-violet-200',
    admin: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function AdminUsersPage() {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
            if (search) params.search = search;
            if (roleFilter) params.role = roleFilter;
            const res = await api.get('/api/admin/users', { params });
            setUsers(res.data.users);
            setTotal(res.data.total);
        } catch {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const toggleActive = async (userId: string) => {
        try {
            await api.patch(`/api/admin/users/${userId}/toggle-active`);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u));
            toastSuccess('User status updated');
        } catch {
            toastError('Failed to update user status');
        }
    };

    const changeRole = async (userId: string, role: string) => {
        try {
            await api.patch(`/api/admin/users/${userId}/role`, { role });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
            toastSuccess('Role updated');
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toastError(typeof detail === 'string' ? detail : 'Failed to change role');
        }
    };

    const removeUser = async (userId: string) => {
        if (!window.confirm('Remove this user? Their account will be deactivated and anonymized.')) return;
        try {
            await api.delete(`/api/admin/users/${userId}`);
            await loadUsers();
            toastSuccess('User removed');
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toastError(typeof detail === 'string' ? detail : 'Failed to remove user');
        }
    };

    return (
        <AppShell>
            <div className={adminPageCls}>
                <PageHeader
                    title="User Management"
                    description={`${total} users on the platform`}
                />

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by email…"
                            className={`${adminInputCls} pl-9`}
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        className={adminInputCls}
                    >
                        <option value="">All Roles</option>
                        <option value="candidate">Candidate</option>
                        <option value="employer">HR Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div className={`${adminCardCls} overflow-hidden`}>
                    {loading ? (
                        <div className="p-8 text-center text-text-secondary">Loading users…</div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Users size={36} className="text-text-tertiary mb-3" />
                            <p className="text-sm text-text-secondary">No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-background text-xs font-semibold text-text-tertiary uppercase tracking-wide border-b border-border">
                                        <th className="text-left px-6 py-3">User</th>
                                        <th className="text-left px-6 py-3">Role</th>
                                        <th className="text-left px-6 py-3">Verified</th>
                                        <th className="text-left px-6 py-3">Status</th>
                                        <th className="text-left px-6 py-3">Joined</th>
                                        <th className="text-left px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-background/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-text-primary">{user.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.id === currentUser?.id ? (
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[user.role] ?? ''}`}>
                                                        {user.role}
                                                    </span>
                                                ) : (
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => changeRole(user.id, e.target.value)}
                                                        className="px-2 py-1 border border-border rounded-lg text-xs bg-surface"
                                                    >
                                                        <option value="candidate">candidate</option>
                                                        <option value="employer">employer</option>
                                                        <option value="admin">admin</option>
                                                    </select>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_verified
                                                    ? <CheckCircle2 size={16} className="text-emerald-500" />
                                                    : <XCircle size={16} className="text-text-tertiary" />}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-text-tertiary">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.id === currentUser?.id ? (
                                                    <span className="text-xs text-text-tertiary">You</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleActive(user.id)}
                                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${user.is_active
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                                        >
                                                            {user.is_active ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUser(user.id)}
                                                            className={`${adminBtnDanger} px-3 py-1.5 text-xs`}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {total > PAGE_SIZE && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                            <p className="text-sm text-text-secondary">
                                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                            </p>
                            <div className="flex gap-2">
                                <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-background disabled:opacity-40">
                                    Prev
                                </button>
                                <button type="button" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-background disabled:opacity-40">
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}

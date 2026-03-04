/**
 * Admin Users Page — List, search, filter, activate/deactivate users
 */
import { useState, useEffect, useCallback } from 'react';
import AppShell from '../../components/layout/AppShell';
import { Users, Search, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

interface AdminUser {
    id: string;
    email: string;
    role: string;
    is_verified: boolean;
    is_active: boolean;
    created_at: string;
}

const roleColors: Record<string, string> = {
    candidate: 'bg-blue-100 text-blue-700',
    employer: 'bg-violet-100 text-violet-700',
    admin: 'bg-rose-100 text-rose-700',
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
            const params: Record<string, any> = { page, page_size: PAGE_SIZE };
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
        } catch {
            alert('Failed to update user status');
        }
    };

    return (
        <AppShell>
            <div className="p-6 lg:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Shield size={24} className="text-red-500" />
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <span className="ml-auto text-sm text-gray-500">{total} total users</span>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by email…"
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="">All Roles</option>
                        <option value="candidate">Candidate</option>
                        <option value="employer">Employer</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="divide-y divide-gray-50">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center px-6 py-4 gap-4 animate-pulse">
                                    <div className="w-9 h-9 bg-gray-200 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-200 rounded w-48" />
                                        <div className="h-2 bg-gray-100 rounded w-24" />
                                    </div>
                                    <div className="h-6 w-16 bg-gray-100 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Users size={36} className="text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500">No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        <th className="text-left px-6 py-3">User</th>
                                        <th className="text-left px-6 py-3">Role</th>
                                        <th className="text-left px-6 py-3">Verified</th>
                                        <th className="text-left px-6 py-3">Status</th>
                                        <th className="text-left px-6 py-3">Joined</th>
                                        <th className="text-left px-6 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                        {user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_verified
                                                    ? <CheckCircle2 size={16} className="text-emerald-500" />
                                                    : <XCircle size={16} className="text-gray-300" />}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-400">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.id === currentUser?.id ? (
                                                    <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">
                                                        You
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => toggleActive(user.id)}
                                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${user.is_active
                                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                            }`}
                                                    >
                                                        {user.is_active ? 'Deactivate' : 'Activate'}
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
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    Prev
                                </button>
                                <button
                                    disabled={page * PAGE_SIZE >= total}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
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

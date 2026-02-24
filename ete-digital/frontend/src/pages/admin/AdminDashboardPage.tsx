/**
 * Admin Dashboard — Platform overview for admins only
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { Users, Briefcase, Star, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';

interface PlatformStats {
    total_users: number;
    total_candidates: number;
    total_employers: number;
    total_jobs: number;
    active_jobs: number;
    total_applications: number;
}

function StatCard({ label, value, icon, color }: {
    label: string; value: number | string;
    icon: React.ReactNode; color: string;
}) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/admin/stats')
            .then((r: { data: PlatformStats }) => setStats(r.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppShell>
            <div className="p-6 lg:p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <ShieldCheck size={28} className="text-red-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500 mt-0.5">Platform-wide overview and controls</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard label="Total Users" value={loading ? '—' : stats?.total_users ?? 0} icon={<Users size={22} className="text-blue-600" />} color="bg-blue-50" />
                    <StatCard label="Candidates" value={loading ? '—' : stats?.total_candidates ?? 0} icon={<Users size={22} className="text-violet-600" />} color="bg-violet-50" />
                    <StatCard label="Employers" value={loading ? '—' : stats?.total_employers ?? 0} icon={<ShieldCheck size={22} className="text-rose-600" />} color="bg-rose-50" />
                    <StatCard label="Total Jobs" value={loading ? '—' : stats?.total_jobs ?? 0} icon={<Briefcase size={22} className="text-emerald-600" />} color="bg-emerald-50" />
                    <StatCard label="Active Jobs" value={loading ? '—' : stats?.active_jobs ?? 0} icon={<TrendingUp size={22} className="text-amber-600" />} color="bg-amber-50" />
                    <StatCard label="Applications" value={loading ? '—' : stats?.total_applications ?? 0} icon={<Star size={22} className="text-indigo-600" />} color="bg-indigo-50" />
                </div>

                {/* Quick Nav */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: 'Manage Users', sub: 'View, activate, or deactivate users', href: '/admin/users', icon: <Users size={20} /> },
                        { label: 'Moderate Jobs', sub: 'Close or reopen job listings', href: '/admin/jobs', icon: <Briefcase size={20} /> },
                    ].map((a) => (
                        <Link
                            key={a.href}
                            to={a.href}
                            className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-2xl hover:border-red-300 hover:bg-red-50 transition-all group shadow-sm"
                        >
                            <div className="text-gray-400 group-hover:text-red-500 transition-colors">{a.icon}</div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">{a.label}</p>
                                <p className="text-xs text-gray-500">{a.sub}</p>
                            </div>
                            <ArrowRight size={16} className="text-gray-300 group-hover:text-red-400 transition-colors" />
                        </Link>
                    ))}
                </div>
            </div>
        </AppShell>
    );
}

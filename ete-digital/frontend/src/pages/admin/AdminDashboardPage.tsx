/**
 * Admin Dashboard — Platform overview for admins only
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import { adminPageCls, adminCardCls } from './adminShared';
import { Users, Briefcase, Star, TrendingUp, ShieldCheck, ArrowRight, Building2, ClipboardList } from 'lucide-react';
import { api } from '../../api/client';

interface PlatformStats {
    total_users: number;
    total_candidates: number;
    total_employers: number;
    total_jobs: number;
    active_jobs: number;
    total_applications: number;
}

function StatCard({ label, value, icon, color, href }: {
    label: string; value: number | string;
    icon: React.ReactNode; color: string; href?: string;
}) {
    const inner = (
        <div className={`${adminCardCls} p-6 flex items-start gap-4 ${href ? 'hover:border-red-200 transition-colors' : ''}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
            <div>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
                <p className="text-sm text-text-secondary mt-0.5">{label}</p>
            </div>
        </div>
    );
    return href ? <Link to={href}>{inner}</Link> : inner;
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
            <div className={adminPageCls}>
                <PageHeader
                    title="Admin Dashboard"
                    description="Platform-wide overview and owner controls"
                />

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard label="Total Users" value={loading ? '—' : stats?.total_users ?? 0} icon={<Users size={22} className="text-blue-600" />} color="bg-blue-50" href="/admin/users" />
                    <StatCard label="Candidates" value={loading ? '—' : stats?.total_candidates ?? 0} icon={<Users size={22} className="text-violet-600" />} color="bg-violet-50" href="/admin/users?role=candidate" />
                    <StatCard label="Employers" value={loading ? '—' : stats?.total_employers ?? 0} icon={<ShieldCheck size={22} className="text-rose-600" />} color="bg-rose-50" href="/admin/users?role=employer" />
                    <StatCard label="Total Jobs" value={loading ? '—' : stats?.total_jobs ?? 0} icon={<Briefcase size={22} className="text-emerald-600" />} color="bg-emerald-50" href="/admin/jobs" />
                    <StatCard label="Active Jobs" value={loading ? '—' : stats?.active_jobs ?? 0} icon={<TrendingUp size={22} className="text-amber-600" />} color="bg-amber-50" href="/admin/jobs?status=active" />
                    <StatCard label="Applications" value={loading ? '—' : stats?.total_applications ?? 0} icon={<Star size={22} className="text-indigo-600" />} color="bg-indigo-50" href="/admin/applications" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: 'Manage Users', sub: 'Roles, activation, removal', href: '/admin/users', icon: <Users size={20} /> },
                        { label: 'Moderate Jobs', sub: 'Close or reopen job listings', href: '/admin/jobs', icon: <Briefcase size={20} /> },
                        { label: 'All Applications', sub: 'Platform-wide application oversight', href: '/admin/applications', icon: <ClipboardList size={20} /> },
                        { label: 'Review Organisations', sub: 'Approve standard-path employer registrations', href: '/admin/organizations', icon: <Building2 size={20} /> },
                    ].map((a) => (
                        <Link
                            key={a.href}
                            to={a.href}
                            className={`${adminCardCls} flex items-center gap-4 p-5 hover:border-red-200 transition-all group`}
                        >
                            <div className="text-text-tertiary group-hover:text-red-500 transition-colors">{a.icon}</div>
                            <div className="flex-1">
                                <p className="font-semibold text-text-primary">{a.label}</p>
                                <p className="text-sm text-text-secondary mt-0.5">{a.sub}</p>
                            </div>
                            <ArrowRight size={16} className="text-text-tertiary group-hover:text-red-500" />
                        </Link>
                    ))}
                </div>
            </div>
        </AppShell>
    );
}

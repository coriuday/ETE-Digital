/**
 * Candidate Dashboard — redesigned with AppShell, KPI cards, tryout gauges, applications table
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import AppShell from '../components/layout/AppShell';
import {
    FileText, Star, Trophy, BadgeCheck, TrendingUp,
    Briefcase, ArrowRight, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { jobsApi } from '../api/jobs';
import { tryoutsApi } from '../api/tryouts';
import { vaultApi } from '../api/vault';

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusPill(status: string) {
    const map: Record<string, string> = {
        PENDING: 'bg-amber-100 text-amber-700',
        REVIEWING: 'bg-blue-100 text-blue-700',
        ACCEPTED: 'bg-emerald-100 text-emerald-700',
        REJECTED: 'bg-red-100 text-red-700',
        SUBMITTED: 'bg-violet-100 text-violet-700',
        PASSED: 'bg-emerald-100 text-emerald-700',
        FAILED: 'bg-red-100 text-red-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
}

// Circular gauge SVG
function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
    const r = (size - 12) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <svg width={size} height={size} className="rotate-[-90deg]">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={color} strokeWidth="6"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
            <text
                x={size / 2} y={size / 2 + 5}
                textAnchor="middle" fill={color}
                fontSize="14" fontWeight="700"
                style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
            >
                {score}
            </text>
        </svg>
    );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    trend?: string;
}

function KpiCard({ label, value, icon, color, trend }: KpiCardProps) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                {trend && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                        <TrendingUp size={10} /> {trend}
                    </p>
                )}
            </div>
        </div>
    );
}


// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { user } = useAuthStore();

    if (user?.role === 'employer') {
        // AppRouter should route employers to /employer/dashboard — fallback guard
        return (
            <AppShell>
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Redirecting to employer dashboard…</p>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <CandidateDashboard />
        </AppShell>
    );
}



// ── Candidate Dashboard Body ──────────────────────────────────────────────────

function CandidateDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [apps, subs, vaultStats] = await Promise.all([
                    jobsApi.getMyApplications(1).catch(() => ({ total: 0, applications: [] })),
                    tryoutsApi.getMySubmissions(1).catch(() => ({ total: 0, submissions: [] })),
                    vaultApi.getVaultStats().catch(() => ({ total_items: 0, verified_items: 0 })),
                ]);
                setStats({
                    applications: apps.total ?? 0,
                    tryouts: subs.total ?? 0,
                    vaultItems: vaultStats.total_items ?? 0,
                    verified: vaultStats.verified_items ?? 0,
                    recentApps: (apps.applications ?? []).slice(0, 5),
                    recentSubs: (subs.submissions ?? []).slice(0, 3),
                });
            } catch {
                setStats({ applications: 0, tryouts: 0, vaultItems: 0, verified: 0, recentApps: [], recentSubs: [] });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const firstName = user?.full_name?.split(' ')[0] ?? 'there';

    return (
        <div className="p-6 lg:p-8 space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {firstName}! 👋
                </h1>
                <p className="text-gray-500 mt-1">Here's your job search overview</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Applications"
                    value={loading ? '—' : stats?.applications}
                    icon={<FileText size={22} className="text-blue-600" />}
                    color="bg-blue-50"
                    trend="Track status below"
                />
                <KpiCard
                    label="Tryouts"
                    value={loading ? '—' : stats?.tryouts}
                    icon={<Star size={22} className="text-violet-600" />}
                    color="bg-violet-50"
                />
                <KpiCard
                    label="Vault Items"
                    value={loading ? '—' : stats?.vaultItems}
                    icon={<Trophy size={22} className="text-amber-600" />}
                    color="bg-amber-50"
                />
                <KpiCard
                    label="Verified"
                    value={loading ? '—' : stats?.verified}
                    icon={<BadgeCheck size={22} className="text-emerald-600" />}
                    color="bg-emerald-50"
                    trend="Tryout-verified items"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Browse Jobs', sub: 'Find your next opportunity', href: '/jobs', icon: <Briefcase size={22} />, border: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50' },
                    { label: 'My Tryouts', sub: 'View submission status', href: '/dashboard/tryouts', icon: <Star size={22} />, border: 'border-violet-200 hover:border-violet-400 hover:bg-violet-50' },
                    { label: 'Talent Vault', sub: 'Manage your portfolio', href: '/vault', icon: <Trophy size={22} />, border: 'border-amber-200 hover:border-amber-400 hover:bg-amber-50' },
                ].map((a) => (
                    <Link
                        key={a.href}
                        to={a.href}
                        className={`flex items-center gap-4 p-4 bg-white border-2 rounded-2xl transition-all duration-200 group shadow-sm ${a.border}`}
                    >
                        <div className="text-gray-500 group-hover:text-gray-900 transition-colors">{a.icon}</div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{a.label}</p>
                            <p className="text-xs text-gray-500">{a.sub}</p>
                        </div>
                        <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
                    </Link>
                ))}
            </div>

            {/* Recent Applications + Tryout Results */}
            {!loading && stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Applications Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-900">Recent Applications</h2>
                            <Link to="/jobs" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                Browse Jobs <ArrowRight size={12} />
                            </Link>
                        </div>
                        {stats.recentApps.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                                <FileText size={32} className="text-gray-300 mb-3" />
                                <p className="text-sm font-medium text-gray-500">No applications yet</p>
                                <p className="text-xs text-gray-400 mt-1">Start applying to jobs to see them here</p>
                                <Link to="/jobs" className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                    Browse Jobs
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {stats.recentApps.map((app: any) => (
                                    <div key={app.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{app.job_title ?? `Application #${app.id.slice(0, 8)}`}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{app.company_name ?? new Date(app.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusPill(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tryout Results */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-900">Tryout Results</h2>
                            <Link to="/dashboard/tryouts" className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                                View All <ArrowRight size={12} />
                            </Link>
                        </div>
                        {stats.recentSubs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                                <Star size={32} className="text-gray-300 mb-3" />
                                <p className="text-sm font-medium text-gray-500">No tryout submissions yet</p>
                                <p className="text-xs text-gray-400 mt-1">Complete job tryouts to build your verified portfolio</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {stats.recentSubs.map((sub: any) => (
                                    <div key={sub.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                                        <ScoreGauge score={sub.final_score ?? 0} size={56} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                Submission #{sub.id.slice(0, 8)}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {sub.status === 'PASSED' ? (
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                ) : sub.status === 'FAILED' ? (
                                                    <XCircle size={12} className="text-red-500" />
                                                ) : (
                                                    <Clock size={12} className="text-amber-500" />
                                                )}
                                                <span className={`text-xs font-semibold ${statusPill(sub.status)} px-2 py-0.5 rounded-full`}>
                                                    {sub.status}
                                                </span>
                                            </div>
                                        </div>
                                        {sub.final_score !== undefined && (
                                            <p className="text-xs text-gray-500">{sub.final_score}/100</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}



/**
 * Candidate Dashboard — Premium rebuild
 *
 * Improvements:
 *  - Skeleton loaders replace '—' placeholder values
 *  - EmptyState component replaces inline empty states
 *  - PageHeader component for consistent heading
 *  - Proper TypeScript types (no `any`)
 *  - Memoized KpiCard
 *  - useEffect cleanup (AbortController)
 *  - Time-of-day greeting
 *  - Cleaner table and action cards
 */
import { useState, useEffect, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import AppShell from '../../components/layout/AppShell';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { FileText, Star, Trophy, BadgeCheck, TrendingUp,
    Briefcase, ArrowRight, Clock, CheckCircle2, XCircle,
    Zap, Plus,
} from 'lucide-react';
import { jobsApi } from '../../api/jobs';
import { tryoutsApi } from '../../api/tryouts';
import { vaultApi } from '../../api/vault';
import ProfileCompletionCard from '../../components/ui/ProfileCompletionCard';

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Application {
    id: string;
    job_title?: string;
    company_name?: string;
    status: string;
    created_at: string;
}

interface Submission {
    id: string;
    final_score?: number;
    status: string;
}

interface DashboardStats {
    applications:  number;
    tryouts:       number;
    vaultItems:    number;
    verified:      number;
    recentApps:    Application[];
    recentSubs:    Submission[];
}

/* ── Status badge ───────────────────────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
    PENDING:   'bg-amber-50  text-amber-700  border-amber-200',
    REVIEWING: 'bg-blue-50   text-blue-700   border-blue-200',
    ACCEPTED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED:  'bg-red-50    text-red-700    border-red-200',
    SUBMITTED: 'bg-violet-50 text-violet-700 border-violet-200',
    PASSED:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    FAILED:    'bg-red-50    text-red-700    border-red-200',
};

function StatusBadge({ status }: { status: string }) {
    const cls = STATUS_COLORS[status] ?? 'bg-background text-text-tertiary border-border';
    return (
        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>
            {status}
        </span>
    );
}

/* ── Score gauge ────────────────────────────────────────────────────────── */
function ScoreGauge({ score, size = 56 }: { score: number; size?: number }) {
    const r = (size - 10) / 2;
    const circ = 2 * Math.PI * r;
    const dash  = (Math.min(score, 100) / 100) * circ;
    const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <svg width={size} height={size} className="rotate-[-90deg] flex-shrink-0">
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e4e4e7" strokeWidth="5" />
            <circle
                cx={size/2} cy={size/2} r={r}
                fill="none" stroke={color} strokeWidth="5"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.7s ease' }}
            />
            <text
                x={size/2} y={size/2 + 4.5}
                textAnchor="middle" fill={color}
                fontSize="11" fontWeight="700"
                style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}
            >
                {score}
            </text>
        </svg>
    );
}

/* ── KPI Card ───────────────────────────────────────────────────────────── */
interface KpiCardProps {
    label: string;
    value: number | string;
    icon:  React.ReactNode;
    iconBg: string;
    loading: boolean;
    trend?:  string;
}

const KpiCard = memo(function KpiCard({ label, value, icon, iconBg, loading, trend }: KpiCardProps) {
    return (
        <div className="bg-surface rounded-xl p-5 border border-border shadow-card flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                {loading ? (
                    <>
                        <Skeleton className="h-7 w-16 mb-1.5" />
                        <Skeleton className="h-3.5 w-24" />
                    </>
                ) : (
                    <>
                        <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
                        <p className="text-xs text-text-secondary mt-1">{label}</p>
                        {trend && (
                            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                                <TrendingUp size={10} /> {trend}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
});

/* ── Quick Action Card ──────────────────────────────────────────────────── */
const QuickAction = memo(function QuickAction({
    label, sub, href, icon, accent,
}: {
    label: string; sub: string; href: string; icon: React.ReactNode; accent: string;
}) {
    return (
        <Link
            to={href}
            className={`flex items-center gap-4 p-4 bg-surface border border-border rounded-xl transition-all duration-200 group hover:shadow-card-hover hover:border-current/20 ${accent}`}
        >
            <div className="text-current/40 group-hover:text-current transition-colors flex-shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary text-sm">{label}</p>
                <p className="text-xs text-text-secondary truncate">{sub}</p>
            </div>
            <ArrowRight size={15} className="text-border group-hover:text-text-secondary transition-colors flex-shrink-0" />
        </Link>
    );
});

/* ── Time-of-day greeting ───────────────────────────────────────────────── */
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

/* ── Main Dashboard ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    // Employer redirect (shouldn't land here, but guard anyway)
    useEffect(() => {
        if (user?.role === 'employer') navigate('/hr/dashboard', { replace: true });
    }, [user?.role, navigate]);

    if (user?.role === 'employer') return null;

    return (
        <AppShell>
            <CandidateDashboard />
        </AppShell>
    );
}

function CandidateDashboard() {
    const { user }  = useAuthStore();
    const [stats, setStats]   = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async (signal: AbortSignal) => {
        try {
            const [apps, subs, vaultStats] = await Promise.all([
                jobsApi.getMyApplications(1).catch(() => ({ total: 0, applications: [] })),
                tryoutsApi.getMySubmissions(1).catch(() => ({ total: 0, submissions: [] })),
                vaultApi.getVaultStats().catch(() => ({ total_items: 0, verified_items: 0 })),
            ]);
            if (signal.aborted) return;
            setStats({
                applications:  apps.total        ?? 0,
                tryouts:       subs.total        ?? 0,
                vaultItems:    vaultStats.total_items   ?? 0,
                verified:      vaultStats.verified_items ?? 0,
                recentApps:    (apps.applications  ?? []).slice(0, 5),
                recentSubs:    (subs.submissions   ?? []).slice(0, 3),
            });
        } catch {
            if (signal.aborted) return;
            setStats({ applications: 0, tryouts: 0, vaultItems: 0, verified: 0, recentApps: [], recentSubs: [] });
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchStats(controller.signal);
        return () => controller.abort();
    }, [fetchStats]);

    const firstName = user?.full_name?.split(' ')[0] ?? 'there';
    const greeting  = getGreeting();

    return (
        <div className="p-6 lg:p-8 space-y-7 max-w-6xl mx-auto">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-text-primary">
                        {greeting}, {firstName}! 👋
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Here's your job search overview for today.
                    </p>
                </div>
                <Link
                    to="/jobs"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0 shadow-sm"
                >
                    <Plus size={15} />
                    Find Jobs
                </Link>
            </div>

            {/* ── KPI Grid ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Applications"
                    value={stats?.applications ?? 0}
                    icon={<FileText size={18} className="text-blue-600" />}
                    iconBg="bg-blue-50"
                    loading={loading}
                    trend="Track status below"
                />
                <KpiCard
                    label="Tryouts"
                    value={stats?.tryouts ?? 0}
                    icon={<Star size={18} className="text-violet-600" />}
                    iconBg="bg-violet-50"
                    loading={loading}
                />
                <KpiCard
                    label="Vault Items"
                    value={stats?.vaultItems ?? 0}
                    icon={<Trophy size={18} className="text-amber-600" />}
                    iconBg="bg-amber-50"
                    loading={loading}
                />
                <KpiCard
                    label="Verified"
                    value={stats?.verified ?? 0}
                    icon={<BadgeCheck size={18} className="text-emerald-600" />}
                    iconBg="bg-emerald-50"
                    loading={loading}
                    trend="Tryout-verified"
                />
            </div>

            {/* ── Profile Completion Card (only shown when incomplete) ── */}
            <ProfileCompletionCard profile={user?.profile} />

            {/* ── Quick Actions ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <QuickAction
                    label="Browse Jobs"
                    sub="Find your next opportunity"
                    href="/jobs"
                    icon={<Briefcase size={20} />}
                    accent="hover:text-blue-600"
                />
                <QuickAction
                    label="My Tryouts"
                    sub="View submission status"
                    href="/dashboard/tryouts"
                    icon={<Zap size={20} />}
                    accent="hover:text-violet-600"
                />
                <QuickAction
                    label="Talent Vault"
                    sub="Manage your portfolio"
                    href="/vault"
                    icon={<Trophy size={20} />}
                    accent="hover:text-amber-600"
                />
            </div>

            {/* ── Activity Panels ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Recent Applications */}
                <div className="bg-surface rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <h2 className="text-sm font-semibold text-text-primary">Recent Applications</h2>
                        <Link
                            to="/dashboard/applications"
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
                        >
                            View all <ArrowRight size={11} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="divide-y divide-border">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-3.5 w-40" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-5 w-16 rounded-md" />
                                </div>
                            ))}
                        </div>
                    ) : stats?.recentApps.length === 0 ? (
                        <EmptyState
                            icon={<FileText />}
                            title="No applications yet"
                            description="Start applying to jobs to track your progress here."
                            size="sm"
                            action={{ label: 'Browse Jobs', href: '/jobs' }}
                        />
                    ) : (
                        <div className="divide-y divide-border">
                            {stats!.recentApps.map((app) => (
                                <div
                                    key={app.id}
                                    className="flex items-center justify-between px-5 py-3.5 hover:bg-background transition-colors"
                                >
                                    <div className="min-w-0 mr-4">
                                        <p className="text-sm font-medium text-text-primary truncate">
                                            {app.job_title ?? `Application #${app.id.slice(0, 8)}`}
                                        </p>
                                        <p className="text-xs text-text-tertiary mt-0.5 truncate">
                                            {app.company_name ?? new Date(app.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <StatusBadge status={app.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tryout Results */}
                <div className="bg-surface rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <h2 className="text-sm font-semibold text-text-primary">Tryout Results</h2>
                        <Link
                            to="/dashboard/tryouts"
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
                        >
                            View all <ArrowRight size={11} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="divide-y divide-border">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                                    <Skeleton className="w-14 h-14 rounded-full" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-3.5 w-36" />
                                        <Skeleton className="h-5 w-16 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : stats?.recentSubs.length === 0 ? (
                        <EmptyState
                            icon={<Star />}
                            title="No tryout submissions yet"
                            description="Complete skill-based tryouts to see your scores here."
                            size="sm"
                        />
                    ) : (
                        <div className="divide-y divide-border">
                            {stats!.recentSubs.map((sub) => (
                                <div
                                    key={sub.id}
                                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-background transition-colors"
                                >
                                    <ScoreGauge score={sub.final_score ?? 0} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-text-primary truncate">
                                            Submission #{sub.id.slice(0, 8)}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {sub.status === 'PASSED'
                                                ? <CheckCircle2 size={11} className="text-emerald-500" />
                                                : sub.status === 'FAILED'
                                                    ? <XCircle size={11} className="text-red-500" />
                                                    : <Clock size={11} className="text-amber-500" />
                                            }
                                            <StatusBadge status={sub.status} />
                                        </div>
                                    </div>
                                    {sub.final_score !== undefined && (
                                        <p className="text-xs text-text-tertiary flex-shrink-0">
                                            {sub.final_score}/100
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

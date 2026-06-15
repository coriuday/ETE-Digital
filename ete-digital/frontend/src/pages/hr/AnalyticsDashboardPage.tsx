/**
 * Analytics Dashboard — Charts with Recharts, KPI cards, date range selector
 */
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { BarChart2, TrendingUp, Users, Briefcase, Star, Download, Calendar } from 'lucide-react';
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar,
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { analyticsApi, AnalyticsSummary } from '../../api/analytics';

// ── Mock data (used when API returns empty) ───────────────────────────────────

const mockLineData = [
    { name: 'Jan', applications: 24, views: 140 },
    { name: 'Feb', applications: 38, views: 210 },
    { name: 'Mar', applications: 52, views: 290 },
    { name: 'Apr', applications: 41, views: 245 },
    { name: 'May', applications: 67, views: 380 },
    { name: 'Jun', applications: 78, views: 420 },
    { name: 'Jul', applications: 61, views: 360 },
];

const mockBarData = [
    { name: 'Senior Dev', applications: 42 },
    { name: 'UX Designer', applications: 35 },
    { name: 'Product Mgr', applications: 28 },
    { name: 'Data Eng', applications: 22 },
    { name: 'DevOps', applications: 18 },
];

const mockPieData = [
    { name: 'Job Board', value: 45, color: '#6366f1' },
    { name: 'Direct', value: 25, color: '#8b5cf6' },
    { name: 'Referral', value: 20, color: '#a78bfa' },
    { name: 'Social', value: 10, color: '#c4b5fd' },
];

const mockFunnelData = [
    { name: 'Applied', value: 240, fill: '#6366f1' },
    { name: 'Reviewing', value: 160, fill: '#8b5cf6' },
    { name: 'Shortlisted', value: 80, fill: '#a78bfa' },
    { name: 'Interviewed', value: 40, fill: '#c4b5fd' },
    { name: 'Hired', value: 18, fill: '#ddd6fe' },
];

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, trend, color }: {
    label: string; value: string | number;
    icon: React.ReactNode; trend: string; color: string;
}) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    {icon}
                </div>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp size={10} /> {trend}
                </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnalyticsDashboardPage() {
    const [days, setDays] = useState(30);
    const [data, setData] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await analyticsApi.getAnalyticsSummary(days);
                setData(res);
            } catch {
                setData(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [days]);

    const lineData = data?.applications_over_time?.map(p => ({ name: p.date.slice(5), applications: p.value })) ?? mockLineData;
    const barData = data?.top_jobs?.map(j => ({ name: j.title, applications: j.applications })) ?? mockBarData;

    const kpiValues = {
        views: data?.kpis?.find(k => k.label === 'Total Jobs')?.value ?? '—',
        applications: data?.kpis?.find(k => k.label === 'Applications')?.value ?? '—',
        shortlisted: data?.kpis?.find(k => k.label === 'Shortlisted')?.value ?? '—',
        hired: data?.kpis?.find(k => k.label === 'Hired')?.value ?? '—',
    };

    return (
        <AppShell>
            <div className="p-6 lg:p-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                        <p className="text-gray-500 mt-1">Track your hiring performance</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                            <Calendar size={14} className="text-gray-400" />
                            <select value={days} onChange={(e) => setDays(Number(e.target.value))}
                                className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer">
                                <option value={7}>Last 7 days</option>
                                <option value={30}>Last 30 days</option>
                                <option value={90}>Last 90 days</option>
                            </select>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                            <Download size={14} /> Export
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard label="Total Jobs" value={kpiValues.views} icon={<BarChart2 size={18} className="text-blue-600" />} color="bg-blue-50" trend={data ? '' : '+18%'} />
                    <KpiCard label="Applications" value={kpiValues.applications} icon={<Users size={18} className="text-violet-600" />} color="bg-violet-50" trend={data ? `${data.kpis?.find((k: any) => k.label === 'Applications')?.change_pct ?? 0}%` : '+12%'} />
                    <KpiCard label="Shortlisted" value={kpiValues.shortlisted} icon={<Briefcase size={18} className="text-amber-600" />} color="bg-amber-50" trend={data ? '' : '+2'} />
                    <KpiCard label="Hired" value={kpiValues.hired} icon={<Star size={18} className="text-emerald-600" />} color="bg-emerald-50" trend={data ? '' : '+3'} />
                </div>

                {/* Applications Over Time + Top Jobs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="font-semibold text-gray-900 mb-6">Applications Over Time</h2>
                        {loading ? <div className="h-56 bg-gray-50 rounded-xl animate-pulse" /> : (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={lineData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.1)' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} name="Applications" />
                                    <Line type="monotone" dataKey="views" stroke="#c4b5fd" strokeWidth={2} strokeDasharray="4 2" dot={false} name="Views" />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="font-semibold text-gray-900 mb-6">Top Performing Jobs</h2>
                        {loading ? <div className="h-56 bg-gray-50 rounded-xl animate-pulse" /> : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={barData} layout="vertical" margin={{ left: 16 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.1)' }} />
                                    <Bar dataKey="applications" fill="#6366f1" radius={[0, 6, 6, 0]} name="Applications" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Donut Chart + Funnel */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="font-semibold text-gray-900 mb-6">Candidate Sources</h2>
                        {loading ? <div className="h-56 bg-gray-50 rounded-xl animate-pulse" /> : (
                            <div className="flex items-center gap-8">
                                <ResponsiveContainer width={160} height={160}>
                                    <PieChart>
                                        <Pie data={mockPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                            {mockPieData.map((entry) => (
                                                <Cell key={entry.name} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2.5">
                                    {mockPieData.map((d) => (
                                        <div key={d.name} className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                                            <span className="text-sm text-gray-700">{d.name}</span>
                                            <span className="text-sm font-semibold text-gray-900 ml-auto">{d.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="font-semibold text-gray-900 mb-6">Application Funnel</h2>
                        <div className="space-y-2">
                            {mockFunnelData.map((stage) => {
                                const max = mockFunnelData[0].value;
                                const pct = Math.round((stage.value / max) * 100);
                                return (
                                    <div key={stage.name} className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 w-20 text-right">{stage.name}</span>
                                        <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                                            <div className="h-full rounded-lg flex items-center px-2 transition-all duration-700"
                                                style={{ width: `${pct}%`, backgroundColor: stage.fill }}>
                                                <span className="text-xs font-semibold text-white">{stage.value}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 w-8">{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </AppShell>
    );
}

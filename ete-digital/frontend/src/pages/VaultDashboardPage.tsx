/**
 * Vault Dashboard Page — Portfolio masonry grid · Sharing activity sidebar · Category filters
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vaultApi, VaultItem, VaultStats } from '../api/vault';
import {
    Plus, Eye, Share2, Shield, Trophy, FileText,
    Briefcase, Award, Grid3x3, List, Trash2,
    Edit, ExternalLink, Loader2, Archive
} from 'lucide-react';

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: JSX.Element }> = {
    project: { label: 'Project', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: <Briefcase size={14} /> },
    verified_sample: { label: 'Verified', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <Shield size={14} /> },
    badge: { label: 'Badge', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200', icon: <Trophy size={14} /> },
    certificate: { label: 'Certificate', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <Award size={14} /> },
    other: { label: 'Other', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200', icon: <FileText size={14} /> },
};

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color }: { label: string; value: number | string; icon: JSX.Element; color: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
            </div>
        </div>
    );
}

// ── Vault Card ────────────────────────────────────────────────────────────────

function VaultCard({ item, view, onDelete }: { item: VaultItem; view: 'grid' | 'list'; onDelete: (id: string) => void }) {
    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.other;

    if (view === 'list') {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-gray-900 truncate">{item.title}</h3>
                        {item.is_verified && (
                            <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                                <Shield size={10} /> Verified
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                    <span className="flex items-center gap-1"><Eye size={11} /> {item.view_count}</span>
                    <span className="flex items-center gap-1"><Share2 size={11} /> {item.share_count}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Link to={`/vault/edit/${item.id}`}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit size={15} />
                    </Link>
                    <button onClick={() => onDelete(item.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all overflow-hidden">
            {/* Card top accent */}
            <div className={`h-1.5 w-full ${item.is_verified ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-blue-400 to-violet-400'}`} />
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}
                    </div>
                    <div className="flex items-center gap-1">
                        {item.is_verified && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                                <Shield size={10} /> Verified
                            </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                        </span>
                    </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-1.5 group-hover:text-blue-700 transition-colors">{item.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{item.description}</p>

                {/* Tech stack */}
                {(item.metadata as any)?.tech_stack?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {((item.metadata as any).tech_stack as string[]).slice(0, 4).map((t) => (
                            <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-lg">{t}</span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Eye size={11} /> {item.view_count}</span>
                        <span className="flex items-center gap-1"><Share2 size={11} /> {item.share_count}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/vault/edit/${item.id}`}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                            <Edit size={13} />
                        </Link>
                        <button onClick={() => onDelete(item.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['all', 'project', 'verified_sample', 'badge', 'certificate', 'other'];

export default function VaultDashboardPage() {
    const [items, setItems] = useState<VaultItem[]>([]);
    const [stats, setStats] = useState<VaultStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState('all');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');

    useEffect(() => {
        Promise.all([vaultApi.getVaultItems(), vaultApi.getVaultStats()])
            .then(([i, s]) => { setItems(i); setStats(s); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this item?')) return;
        try {
            await vaultApi.deleteVaultItem(id);
            setItems(prev => prev.filter(i => i.id !== id));
        } catch { alert('Failed to delete'); }
    };

    const filtered = items
        .filter(i => activeType === 'all' || i.type === activeType)
        .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <div className="bg-gradient-to-br from-slate-900 via-violet-950 to-blue-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
                <div className="relative max-w-7xl mx-auto px-6 py-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white">My Talent Vault</h1>
                            <p className="text-blue-200 text-sm mt-1">Showcase your skills, projects, and achievements</p>
                        </div>
                        <Link to="/vault/add"
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors text-sm shadow-lg">
                            <Plus size={16} /> Add Item
                        </Link>
                    </div>
                    {/* KPI row */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <KpiCard label="Total Items" value={stats.total_items} icon={<Archive size={18} />} color="bg-blue-100 text-blue-600" />
                            <KpiCard label="Verified" value={stats.verified_items} icon={<Shield size={18} />} color="bg-emerald-100 text-emerald-600" />
                            <KpiCard label="Times Shared" value={stats.total_shares} icon={<Share2 size={18} />} color="bg-violet-100 text-violet-600" />
                            <KpiCard label="Total Views" value={stats.total_views} icon={<Eye size={18} />} color="bg-amber-100 text-amber-600" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Search + controls */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search vault…"
                        className="flex-1 min-w-[180px] px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />

                    {/* Category pills */}
                    <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => setActiveType(cat)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors
                                    ${activeType === cat ? 'bg-blue-600 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                                {cat === 'all' ? 'All' : TYPE_CONFIG[cat]?.label ?? cat}
                            </button>
                        ))}
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                        <button onClick={() => setView('grid')}
                            className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                            <Grid3x3 size={14} />
                        </button>
                        <button onClick={() => setView('list')}
                            className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                            <List size={14} />
                        </button>
                    </div>
                </div>

                {/* Grid/List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={36} className="animate-spin text-blue-600" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Archive size={48} className="text-gray-200 mb-4" />
                        <p className="font-bold text-gray-600 mb-1">
                            {items.length === 0 ? 'Your vault is empty' : 'No items match your filters'}
                        </p>
                        <p className="text-sm text-gray-400 mb-5">
                            {items.length === 0 ? 'Add your first project, badge, or certificate.' : 'Try a different category or search term.'}
                        </p>
                        {items.length === 0 && (
                            <Link to="/vault/add"
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl text-sm">
                                <Plus size={15} /> Add First Item
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className={view === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                        : 'space-y-3'}>
                        {filtered.map(item => (
                            <VaultCard key={item.id} item={item} view={view} onDelete={handleDelete} />
                        ))}
                    </div>
                )}

                {/* Share link */}
                {items.length > 0 && (
                    <div className="mt-10 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-white text-lg">Share your Vault</h3>
                            <p className="text-blue-100 text-sm">Send employers a link to your complete portfolio</p>
                        </div>
                        <Link to="/vault/shares"
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-bold rounded-xl text-sm hover:bg-blue-50 transition-colors">
                            <ExternalLink size={14} /> Manage Share Links
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

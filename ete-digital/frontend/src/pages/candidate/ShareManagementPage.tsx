/**
 * Share Management Page — Candidate: manage vault share tokens
 * Redesigned with AppShell, dark mode, premium cards, proper UX
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { vaultApi, ShareToken, VaultItem } from '../../api/vault';
import {
    Share2, Copy, Trash2, Plus, Loader2, Eye, CheckCircle,
    AlertCircle, Clock, X, ChevronLeft,
} from 'lucide-react';

export default function ShareManagementPage() {
    const [tokens, setTokens] = useState<ShareToken[]>([]);
    const [items, setItems] = useState<VaultItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);


    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [tokensData, itemsData] = await Promise.all([
                vaultApi.getShareTokens(),
                vaultApi.getVaultItems(),
            ]);
            setTokens(tokensData);
            setItems(itemsData);
        } catch {
            setError('Failed to load share data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (tokenId: string) => {
        if (!confirm('Are you sure you want to revoke this share link? Anyone using it will lose access immediately.')) return;
        try {
            await vaultApi.revokeShareToken(tokenId);
            setTokens(prev => prev.filter(t => t.id !== tokenId));
        } catch {
            alert('Failed to revoke share token. Please try again.');
        }
    };

    const copyShareLink = async (token: string, tokenId: string) => {
        const url = `${window.location.origin}/shared/${token}`;
        await navigator.clipboard.writeText(url);
        setCopiedId(tokenId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const bg = 'bg-gray-50';
    const cardBg = 'bg-white border-gray-200';
    const textPrimary = 'text-gray-900';
    const textMuted = 'text-gray-500';

    return (
        <AppShell>
            <div className={`min-h-full ${bg}`}>
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-5 bg-white">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link to="/vault" className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-500">
                                <ChevronLeft size={18} />
                            </Link>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                                <Share2 size={18} className="text-white" />
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold ${textPrimary}`}>Share Manager</h1>
                                <p className={`text-sm ${textMuted}`}>Control who sees your Talent Vault</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                        >
                            {showCreateForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> New Share</>}
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Create Form inline */}
                    {showCreateForm && (
                        <CreateShareForm
                            items={items}
                            onSuccess={(newToken) => {
                                setTokens(prev => [newToken, ...prev]);
                                setShowCreateForm(false);
                            }}
                        />
                    )}

                    {/* Tokens List */}
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="h-36 rounded-2xl animate-pulse bg-gray-200" />
                            ))}
                        </div>
                    ) : tokens.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-gray-300">
                            <Share2 size={48} className="mb-4 opacity-20" />
                            <h3 className={`font-bold text-lg mb-1 ${textPrimary}`}>No share links yet</h3>
                            <p className={`text-sm mb-6 max-w-xs ${textMuted}`}>
                                Create a share link to send specific portfolio items directly to employers — with optional expiry and view limits.
                            </p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                            >
                                <Plus size={15} /> Create First Share Link
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tokens.map(token => (
                                <div key={token.id} className={`rounded-2xl border overflow-hidden transition-all hover:shadow-md ${cardBg}`}>
                                    <div className={`h-1 w-full ${token.is_active ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gray-300'}`} />
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        token.is_active
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {token.is_active ? <CheckCircle size={10} /> : <X size={10} />}
                                                        {token.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {token.expires_at && (
                                                        <span className={`flex items-center gap-1 text-xs ${textMuted}`}>
                                                            <Clock size={11} />
                                                            Expires {new Date(token.expires_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                {token.shared_with_company && (
                                                    <p className={`text-sm font-semibold ${textPrimary}`}>{token.shared_with_company}</p>
                                                )}
                                                {token.shared_with_email && (
                                                    <p className={`text-xs ${textMuted}`}>{token.shared_with_email}</p>
                                                )}
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`text-2xl font-extrabold ${textPrimary}`}>
                                                    {token.current_views}{token.max_views ? `/${token.max_views}` : ''}
                                                </p>
                                                <p className={`text-xs ${textMuted} flex items-center gap-1 justify-end`}>
                                                    <Eye size={10} /> views
                                                </p>
                                            </div>
                                        </div>

                                        <p className={`text-xs mb-4 ${textMuted}`}>
                                            {token.vault_item_ids.length} vault item{token.vault_item_ids.length !== 1 ? 's' : ''} shared
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => copyShareLink(token.token, token.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                                    copiedId === token.id
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                }`}
                                            >
                                                {copiedId === token.id ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                                            </button>
                                            <button
                                                onClick={() => handleRevoke(token.id)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors bg-red-50 text-red-600 hover:bg-red-100"
                                            >
                                                <Trash2 size={14} /> Revoke
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}

function CreateShareForm({ items, onSuccess }: {
    items: VaultItem[];
    onSuccess: (token: ShareToken) => void;
}) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        vault_item_ids: [] as string[],
        shared_with_company: '',
        shared_with_email: '',
        expires_hours: '48',
        max_views: '',
    });

    const cardBg = 'bg-white border-gray-200';
    const inputCls = `w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-violet-500 bg-white text-gray-900`;
    const labelCls = `block text-sm font-medium mb-1.5 text-gray-700`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.vault_item_ids.length === 0) {
            alert('Please select at least one item to share.');
            return;
        }
        setSubmitting(true);
        try {
            const data = {
                vault_item_ids: formData.vault_item_ids,
                ...(formData.shared_with_company ? { shared_with_company: formData.shared_with_company } : {}),
                ...(formData.shared_with_email ? { shared_with_email: formData.shared_with_email } : {}),
                ...(formData.expires_hours ? { expires_hours: parseInt(formData.expires_hours) } : {}),
                ...(formData.max_views ? { max_views: parseInt(formData.max_views) } : {}),
            };
            const token = await vaultApi.createShareToken(data);
            onSuccess(token);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to create share link. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleItem = (id: string) => {
        setFormData(prev => ({
            ...prev,
            vault_item_ids: prev.vault_item_ids.includes(id)
                ? prev.vault_item_ids.filter(i => i !== id)
                : [...prev.vault_item_ids, id],
        }));
    };

    return (
        <div className={`rounded-2xl border p-6 ${cardBg}`}>
            <h2 className="text-base font-bold mb-5 text-gray-900">Create New Share Link</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className={labelCls}>Select Items to Share <span className="text-red-500">*</span></label>
                    <div className="border border-gray-200 bg-gray-50 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
                        {items.length === 0 ? (
                            <p className="text-sm text-center py-4 text-gray-400">
                                No vault items yet. <Link to="/vault/add" className="text-indigo-400 hover:underline">Add items</Link>
                            </p>
                        ) : items.map(item => (
                            <label key={item.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                formData.vault_item_ids.includes(item.id)
                                    ? 'bg-violet-50'
                                    : 'hover:bg-gray-100'
                            }`}>
                                <input type="checkbox" checked={formData.vault_item_ids.includes(item.id)} onChange={() => toggleItem(item.id)} className="accent-violet-500 w-4 h-4" />
                                <span className="text-sm text-gray-800">{item.title}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Company (optional)</label>
                        <input type="text" value={formData.shared_with_company} onChange={e => setFormData(p => ({ ...p, shared_with_company: e.target.value }))} className={inputCls} placeholder="Company name" />
                    </div>
                    <div>
                        <label className={labelCls}>Recipient Email (optional)</label>
                        <input type="email" value={formData.shared_with_email} onChange={e => setFormData(p => ({ ...p, shared_with_email: e.target.value }))} className={inputCls} placeholder="hr@company.com" />
                    </div>
                    <div>
                        <label className={labelCls}>Expires In</label>
                        <select value={formData.expires_hours} onChange={e => setFormData(p => ({ ...p, expires_hours: e.target.value }))} className={inputCls}>
                            <option value="24">24 hours</option>
                            <option value="48">48 hours</option>
                            <option value="168">1 week</option>
                            <option value="720">30 days</option>
                            <option value="">Never</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Max Views (optional)</label>
                        <input type="number" value={formData.max_views} onChange={e => setFormData(p => ({ ...p, max_views: e.target.value }))} className={inputCls} placeholder="Unlimited" min="1" />
                    </div>
                </div>

                <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <><Share2 size={16} /> Create Share Link</>}
                </button>
            </form>
        </div>
    );
}

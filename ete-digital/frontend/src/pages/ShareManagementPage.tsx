/**
 * Manage Share Tokens Page
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vaultApi, ShareToken, VaultItem } from '../api/vault';

export default function ShareManagementPage() {
    const [tokens, setTokens] = useState<ShareToken[]>([]);
    const [items, setItems] = useState<VaultItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tokensData, itemsData] = await Promise.all([
                vaultApi.getShareTokens(),
                vaultApi.getVaultItems(),
            ]);
            setTokens(tokensData);
            setItems(itemsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (tokenId: string) => {
        if (!confirm('Are you sure you want to revoke this share token?')) return;

        try {
            await vaultApi.revokeShareToken(tokenId);
            setTokens(tokens.filter(t => t.id !== tokenId));
        } catch (error) {
            alert('Failed to revoke token');
        }
    };

    const copyShareLink = (token: string) => {
        const url = `${window.location.origin}/shared/${token}`;
        navigator.clipboard.writeText(url);
        alert('Share link copied to clipboard!');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link to="/vault" className="text-primary-600 hover:text-primary-700 font-medium mb-2 block">
                                ← Back to vault
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900">Share Management</h1>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
                        >
                            {showCreateForm ? 'Cancel' : '+ Create Share'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Create Form */}
                {showCreateForm && (
                    <CreateShareForm
                        items={items}
                        onSuccess={(newToken) => {
                            setTokens([newToken, ...tokens]);
                            setShowCreateForm(false);
                        }}
                    />
                )}

                {/* Share Tokens List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                ) : tokens.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-600 mb-4">No share tokens yet. Create one to share your work!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tokens.map((token) => (
                            <div key={token.id} className="bg-white rounded-lg shadow p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${token.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {token.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                            {token.expires_at && (
                                                <span className="text-sm text-gray-600">
                                                    Expires: {new Date(token.expires_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        {token.shared_with_company && (
                                            <p className="text-sm text-gray-900">
                                                <strong>Company:</strong> {token.shared_with_company}
                                            </p>
                                        )}
                                        {token.shared_with_email && (
                                            <p className="text-sm text-gray-900">
                                                <strong>Email:</strong> {token.shared_with_email}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Views</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {token.current_views}
                                            {token.max_views && ` / ${token.max_views}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Items Count */}
                                <p className="text-sm text-gray-600 mb-4">
                                    {token.vault_item_ids.length} item(s) shared
                                </p>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => copyShareLink(token.token)}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                                    >
                                        📋 Copy Link
                                    </button>
                                    <button
                                        onClick={() => handleRevoke(token.id)}
                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                                    >
                                        Revoke
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

// Create Share Form Component
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.vault_item_ids.length === 0) {
            alert('Please select at least one item to share');
            return;
        }

        setSubmitting(true);
        try {
            const data: any = {
                vault_item_ids: formData.vault_item_ids,
            };

            if (formData.shared_with_company) data.shared_with_company = formData.shared_with_company;
            if (formData.shared_with_email) data.shared_with_email = formData.shared_with_email;
            if (formData.expires_hours) data.expires_hours = parseInt(formData.expires_hours);
            if (formData.max_views) data.max_views = parseInt(formData.max_views);

            const token = await vaultApi.createShareToken(data);
            onSuccess(token);
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to create share');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleItem = (itemId: string) => {
        setFormData({
            ...formData,
            vault_item_ids: formData.vault_item_ids.includes(itemId)
                ? formData.vault_item_ids.filter(id => id !== itemId)
                : [...formData.vault_item_ids, itemId],
        });
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Share Link</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Select Items */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Items to Share *
                    </label>
                    <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                        {items.length === 0 ? (
                            <p className="text-gray-500 text-sm">No items available</p>
                        ) : (
                            items.map((item) => (
                                <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.vault_item_ids.includes(item.id)}
                                        onChange={() => toggleItem(item.id)}
                                    />
                                    <span className="text-sm">{item.title}</span>
                                </label>
                            ))
                        )}
                    </div>
                </div>

                {/* Company */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company (optional)
                    </label>
                    <input
                        type="text"
                        value={formData.shared_with_company}
                        onChange={(e) => setFormData({ ...formData, shared_with_company: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Company name"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email (optional)
                    </label>
                    <input
                        type="email"
                        value={formData.shared_with_email}
                        onChange={(e) => setFormData({ ...formData, shared_with_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="recipient@example.com"
                    />
                </div>

                {/* Expiration */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expires in (hours)
                    </label>
                    <select
                        value={formData.expires_hours}
                        onChange={(e) => setFormData({ ...formData, expires_hours: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="24">24 hours</option>
                        <option value="48">48 hours</option>
                        <option value="168">1 week</option>
                        <option value="720">30 days</option>
                        <option value="">Never</option>
                    </select>
                </div>

                {/* Max Views */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Views (optional)
                    </label>
                    <input
                        type="number"
                        value={formData.max_views}
                        onChange={(e) => setFormData({ ...formData, max_views: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Unlimited"
                        min="1"
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold disabled:opacity-50"
                >
                    {submitting ? 'Creating...' : 'Create Share Link'}
                </button>
            </form>
        </div>
    );
}

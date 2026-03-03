/**
 * Add/Edit Vault Item Page
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { vaultApi, VaultItem } from '../../api/vault';

export default function VaultItemFormPage() {
    const { itemId } = useParams<{ itemId?: string }>();
    const navigate = useNavigate();
    const isEditMode = !!itemId;

    const [loading, setLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        type: 'project',
        title: '',
        description: '',
        file_url: '',
        tech_stack: '',
        live_url: '',
    });

    useEffect(() => {
        if (isEditMode && itemId) {
            loadItem();
        }
    }, [itemId]);

    const loadItem = async () => {
        try {
            const item = await vaultApi.getVaultItem(itemId!);
            setFormData({
                type: item.type,
                title: item.title,
                description: item.description,
                file_url: item.file_url,
                tech_stack: item.metadata?.tech_stack?.join(', ') || '',
                live_url: item.metadata?.live_url || '',
            });
        } catch (error) {
            console.error('Failed to load item:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const data = {
                type: formData.type,
                title: formData.title,
                description: formData.description,
                file_url: formData.file_url,
                metadata: {
                    tech_stack: formData.tech_stack.split(',').map(s => s.trim()).filter(Boolean),
                    live_url: formData.live_url || undefined,
                },
            };

            if (isEditMode) {
                await vaultApi.updateVaultItem(itemId!, data);
            } else {
                await vaultApi.createVaultItem(data);
            }

            navigate('/vault');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to save item');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-4">
                    <Link to="/vault" className="text-primary-600 hover:text-primary-700 font-medium">
                        ← Back to vault
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-lg shadow p-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">
                            {isEditMode ? 'Edit Item' : 'Add New Item'}
                        </h1>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type *
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="project">💼 Project</option>
                                    <option value="verified_sample">✅ Verified Sample</option>
                                    <option value="badge">🏆 Badge</option>
                                    <option value="certificate">📜 Certificate</option>
                                    <option value="other">📄 Other</option>
                                </select>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="E.g., E-commerce Platform"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Describe your work..."
                                />
                            </div>

                            {/* File URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    File/Project URL *
                                </label>
                                <input
                                    type="url"
                                    name="file_url"
                                    value={formData.file_url}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="https://github.com/..."
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    This URL will be encrypted for security
                                </p>
                            </div>

                            {/* Tech Stack */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tech Stack (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    name="tech_stack"
                                    value={formData.tech_stack}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="React, Node.js, PostgreSQL"
                                />
                            </div>

                            {/* Live URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Live Demo URL (optional)
                                </label>
                                <input
                                    type="url"
                                    name="live_url"
                                    value={formData.live_url}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="https://demo.example.com"
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : isEditMode ? 'Update Item' : 'Add Item'}
                                </button>
                                <Link
                                    to="/vault"
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

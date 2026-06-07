/**
 * Public Shared Vault View (no auth required)
 * Displays a single vault item shared via a secure token link.
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { vaultApi } from '../../api/vault';

export default function SharedVaultPage() {
    const { token } = useParams<{ token: string }>();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            loadSharedItem();
        }
    }, [token]);

    const loadSharedItem = async () => {
        setLoading(true);
        try {
            // Backend returns: { item, candidate_name, shared_with_company, remaining_views, expires_at }
            const response = await vaultApi.viewSharedItems(token!);
            setData(response);
        } catch (error: any) {
            setError(error.response?.data?.detail || 'Failed to load shared portfolio item');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading shared portfolio...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">
                        This link may have expired, been revoked, or reached its maximum view count.
                    </p>
                </div>
            </div>
        );
    }

    // Correctly destructure the real backend response shape
    const { item, candidate_name, shared_with_company, remaining_views, expires_at } = data;

    if (!item) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">No item found for this share link.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
                <div className="container mx-auto px-4 py-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {candidate_name ? `${candidate_name}'s Portfolio` : 'Shared Portfolio'}
                        </h1>
                        {shared_with_company && (
                            <p className="text-primary-200">
                                Shared with {shared_with_company}
                            </p>
                        )}
                        {remaining_views !== null && remaining_views !== undefined && (
                            <p className="text-primary-300 text-sm mt-1">
                                {remaining_views} view{remaining_views !== 1 ? 's' : ''} remaining
                            </p>
                        )}
                    </div>
                </div>
            </header>

            {/* Content — single item card */}
            <main className="container mx-auto px-4 py-12 max-w-2xl">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                    <div className="p-6">
                        {/* Type & Verified Badge */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                {item.type.replace('_', ' ')}
                            </span>
                            {item.is_verified && (
                                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                    ✓ Verified
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {item.title}
                        </h2>

                        {/* Description */}
                        {item.description && (
                            <p className="text-gray-600 mb-4">
                                {item.description}
                            </p>
                        )}

                        {/* Tech Stack */}
                        {item.item_metadata?.tech_stack && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {item.item_metadata.tech_stack.map((tech: string, idx: number) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Links */}
                        <div className="flex gap-2">
                            {item.file_url && (
                                <a
                                    href={item.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-semibold"
                                >
                                    View Project
                                </a>
                            )}
                            {item.item_metadata?.live_url && (
                                <a
                                    href={item.item_metadata.live_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 text-sm font-semibold"
                                >
                                    Live Demo
                                </a>
                            )}
                            {item.item_metadata?.github_url && (
                                <a
                                    href={item.item_metadata.github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-semibold"
                                >
                                    GitHub
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expiry notice */}
                {expires_at && (
                    <p className="text-center text-primary-300 text-sm mt-6">
                        Link expires: {new Date(expires_at).toLocaleDateString()}
                    </p>
                )}

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-primary-200 text-sm">
                        Powered by <strong>Jobsrow</strong> • Open-source job platform
                    </p>
                </div>
            </main>
        </div>
    );
}

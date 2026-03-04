/**
 * Add/Edit Vault Item Page
 * Supports two modes for adding files:
 *   1. File Upload  — uploads directly to MinIO via POST /api/vault/items/upload
 *   2. URL Entry   — saves a public URL / GitHub link as a vault item
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { vaultApi } from '../../api/vault';
import { UploadCloud, Link2, FileText, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

type AddMode = 'upload' | 'url';

const ITEM_TYPES = [
    { value: 'project', emoji: '💼', label: 'Project' },
    { value: 'verified_sample', emoji: '✅', label: 'Verified Sample' },
    { value: 'badge', emoji: '🏆', label: 'Badge' },
    { value: 'certificate', emoji: '📜', label: 'Certificate' },
    { value: 'other', emoji: '📄', label: 'Other' },
];

const MAX_MB = 50;

export default function VaultItemFormPage() {
    const { itemId } = useParams<{ itemId?: string }>();
    const navigate = useNavigate();
    const isEditMode = !!itemId;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [mode, setMode] = useState<AddMode>('upload');
    const [loading, setLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Upload mode state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // URL mode + shared metadata
    const [formData, setFormData] = useState({
        type: 'project',
        title: '',
        description: '',
        file_url: '',
        tech_stack: '',
        live_url: '',
    });

    useEffect(() => {
        if (isEditMode && itemId) loadItem();
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
            // Edit mode always shows URL tab (files are already stored)
            setMode('url');
        } catch {
            setError('Failed to load item.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        if (!f) return;
        if (f.size > MAX_MB * 1024 * 1024) {
            setError(`File too large. Max size is ${MAX_MB} MB.`);
            return;
        }
        setSelectedFile(f);
        setError('');
        // Auto-fill title from filename if empty
        if (!formData.title) {
            const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
            setFormData(prev => ({ ...prev, title: name }));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) {
            const fakeEvent = { target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileChange(fakeEvent);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) { setError('Title is required.'); return; }
        if (mode === 'upload' && !isEditMode && !selectedFile) { setError('Please select a file to upload.'); return; }
        if (mode === 'url' && !formData.file_url.trim()) { setError('Please enter a URL.'); return; }

        setSubmitting(true);
        setError('');
        setUploadProgress(0);

        try {
            if (mode === 'upload' && selectedFile && !isEditMode) {
                await vaultApi.uploadVaultFile({
                    file: selectedFile,
                    title: formData.title,
                    description: formData.description,
                    item_type: formData.type,
                });
                setUploadProgress(100);
                setSuccess(true);
                setTimeout(() => navigate('/vault'), 1200);
            } else {
                // URL mode: create / update
                const data = {
                    type: formData.type as 'project' | 'verified_sample' | 'badge' | 'certificate' | 'other',
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
                setSuccess(true);
                setTimeout(() => navigate('/vault'), 1200);
            }
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to save. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/vault" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors font-medium">
                        ← Back to Vault
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">
                        {isEditMode ? 'Edit Item' : 'Add to Vault'}
                    </h1>
                    <div className="w-24" />
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                        {/* Mode tabs (only in create mode) */}
                        {!isEditMode && (
                            <div className="flex border-b border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setMode('upload')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${mode === 'upload'
                                        ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <UploadCloud size={16} /> Upload File
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('url')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${mode === 'url'
                                        ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Link2 size={16} /> Add via URL
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Item Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                >
                                    {ITEM_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="E.g., E-commerce Platform"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Describe your work, what problem it solves, your role…"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>

                            {/* ── Upload mode ── */}
                            {mode === 'upload' && !isEditMode && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        File * <span className="text-gray-400 font-normal">(max {MAX_MB} MB)</span>
                                    </label>
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={e => e.preventDefault()}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${selectedFile
                                            ? 'border-primary-400 bg-primary-50'
                                            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                                            }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            accept=".pdf,.doc,.docx,.txt,.py,.js,.ts,.java,.cpp,.go,.zip,.png,.jpg,.jpeg,.webp"
                                        />
                                        {selectedFile ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <FileText size={20} className="text-primary-600" />
                                                <span className="text-sm font-medium text-primary-700">{selectedFile.name}</span>
                                                <span className="text-xs text-gray-500">
                                                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <UploadCloud size={28} className="mx-auto mb-2 text-gray-400" />
                                                <p className="text-sm text-gray-600 font-medium">
                                                    Drop a file here or <span className="text-primary-600">browse</span>
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    PDF, DOCX, code files, ZIP, images
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    {submitting && uploadProgress > 0 && (
                                        <div className="mt-2">
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Uploading…</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── URL mode ── */}
                            {(mode === 'url' || isEditMode) && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            File / Project URL *
                                        </label>
                                        <input
                                            type="url"
                                            name="file_url"
                                            value={formData.file_url}
                                            onChange={handleChange}
                                            required={mode === 'url'}
                                            placeholder="https://github.com/username/project"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        />
                                        <p className="mt-1 text-xs text-gray-400">
                                            This URL will be encrypted at rest for security.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tech Stack <span className="text-gray-400 font-normal">(comma-separated)</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="tech_stack"
                                            value={formData.tech_stack}
                                            onChange={handleChange}
                                            placeholder="React, Node.js, PostgreSQL"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Live Demo URL <span className="text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="url"
                                            name="live_url"
                                            value={formData.live_url}
                                            onChange={handleChange}
                                            placeholder="https://demo.example.com"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Error / Success */}
                            {error && (
                                <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-xl px-4 py-3 text-sm">
                                    <AlertCircle size={15} className="flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 text-sm">
                                    <CheckCircle size={15} className="flex-shrink-0" />
                                    Saved! Redirecting…
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting || success}
                                    className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-secondary-700 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {submitting
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'upload' ? 'Uploading…' : 'Saving…'}</>
                                        : isEditMode ? 'Update Item' : 'Add to Vault'
                                    }
                                </button>
                                <Link
                                    to="/vault"
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold text-sm flex items-center"
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

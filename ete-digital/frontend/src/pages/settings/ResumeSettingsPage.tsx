/**
 * Resume Settings — upload + JobsRow resume builder
 */
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../api/client';
import { preferencesApi } from '../../api/preferences';
import { SettingsCard, inputCls } from './settingsShared';
import { toastSuccess, toastError } from '../../utils/toast';
import { FileText, Upload, Download, Loader2, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ResumeBuilderData {
    headline: string;
    experience: string;
    skills: string;
}

export default function ResumeSettingsPage() {
    const { user, fetchUser } = useAuthStore();
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [fileName, setFileName] = useState('');
    const [builderStep, setBuilderStep] = useState(0);
    const [builder, setBuilder] = useState<ResumeBuilderData>({ headline: '', experience: '', skills: '' });
    const [savingBuilder, setSavingBuilder] = useState(false);
    const [showBuilder, setShowBuilder] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [meRes, prefs] = await Promise.all([
                    api.get('/api/users/me'),
                    preferencesApi.get(),
                ]);
                setResumeUrl(meRes.data.profile?.resume_url || null);
                const rb = prefs.resume_builder as Record<string, string> | undefined;
                setBuilder({
                    headline: rb?.headline || meRes.data.profile?.headline || '',
                    experience: rb?.experience || '',
                    skills: rb?.skills || (meRes.data.profile?.skills || []).join(', '),
                });
            } catch {
                setResumeUrl(user?.profile?.resume_url || null);
            }
        })();
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadError('');
        setFileName(file.name);
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/api/users/me/resume', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResumeUrl(res.data.resume_url);
            await fetchUser();
            toastSuccess('Resume uploaded');
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            const msg = detail || 'Upload failed. File storage may be unavailable.';
            setUploadError(msg);
            toastError(msg);
        } finally {
            setUploading(false);
        }
    };

    const saveBuilder = async () => {
        setSavingBuilder(true);
        try {
            await Promise.all([
                api.patch('/api/users/profile', { headline: builder.headline }),
                preferencesApi.patch({ resume_builder: builder as unknown as Record<string, unknown> }),
            ]);
            toastSuccess('Resume builder saved');
            setShowBuilder(false);
            await fetchUser();
        } catch {
            const msg = 'Failed to save resume builder data.';
            setUploadError(msg);
            toastError(msg);
        } finally {
            setSavingBuilder(false);
        }
    };

    const builderSteps = [
        { title: 'Professional Headline', field: 'headline' as const, placeholder: 'e.g. Senior Full-Stack Developer with 5+ years in React & Node.js' },
        { title: 'Experience Highlights', field: 'experience' as const, placeholder: 'List key achievements and roles (one per line)' },
        { title: 'Core Skills', field: 'skills' as const, placeholder: 'React, TypeScript, Node.js, AWS…' },
    ];

    return (
        <div className="space-y-6">
            <SettingsCard title="Resume / CV" description="Upload your resume or build a structured JobsRow profile.">
                {!resumeUrl && !uploading && !showBuilder && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center justify-center gap-2 px-4 py-4 border-2 border-primary-500 text-primary-600 rounded-xl text-sm font-semibold hover:bg-primary-50 transition-colors cursor-pointer">
                            <Upload className="w-4 h-4" />
                            Upload Resume
                            <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="sr-only" />
                        </label>
                        <button type="button" onClick={() => setShowBuilder(true)}
                            className="flex items-center justify-center gap-2 px-4 py-4 border-2 border-primary-500 text-primary-600 rounded-xl text-sm font-semibold hover:bg-primary-50 transition-colors">
                            <FileText className="w-4 h-4" />
                            Build a JobsRow Resume
                        </button>
                    </div>
                )}

                {uploading && (
                    <div className="flex items-center gap-3 border border-primary-200 bg-primary-50 rounded-xl px-4 py-3">
                        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                        <span className="text-sm text-primary-600">Uploading…</span>
                    </div>
                )}

                {resumeUrl && !showBuilder && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                            <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-emerald-800">Resume uploaded</p>
                                <p className="text-xs text-emerald-600 truncate">{fileName || resumeUrl.split('/').pop()}</p>
                            </div>
                            <div className="flex gap-2">
                                <a href={resumeUrl.startsWith('http') ? resumeUrl : `${API_BASE}${resumeUrl}`} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline">
                                    <Download className="w-3.5 h-3.5" /> Download
                                </a>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:underline cursor-pointer">
                                    <Upload className="w-3.5 h-3.5" /> Replace
                                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="sr-only" />
                                </label>
                            </div>
                        </div>
                        <button type="button" onClick={() => setShowBuilder(true)}
                            className="text-sm font-semibold text-primary-600 hover:underline">
                            Edit JobsRow Resume Builder →
                        </button>
                    </div>
                )}

                {uploadError && (
                    <p className="mt-3 text-sm text-error">{uploadError}</p>
                )}

                {/* 3-step builder */}
                {showBuilder && (
                    <div className="mt-4 border border-border rounded-xl p-5 bg-background">
                        <div className="flex items-center gap-2 mb-4">
                            {builderSteps.map((_, i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= builderStep ? 'bg-primary-600' : 'bg-border'}`} />
                            ))}
                        </div>
                        <h3 className="text-sm font-bold text-text-primary mb-1">
                            Step {builderStep + 1}: {builderSteps[builderStep].title}
                        </h3>
                        <p className="text-xs text-text-tertiary mb-3">Step {builderStep + 1} of 3</p>
                        <textarea
                            value={builder[builderSteps[builderStep].field]}
                            onChange={e => setBuilder(prev => ({ ...prev, [builderSteps[builderStep].field]: e.target.value }))}
                            rows={builderSteps[builderStep].field === 'experience' ? 5 : 3}
                            placeholder={builderSteps[builderStep].placeholder}
                            className={`${inputCls} resize-none mb-4`}
                        />
                        <div className="flex items-center justify-between">
                            <button type="button" disabled={builderStep === 0}
                                onClick={() => setBuilderStep(s => s - 1)}
                                className="flex items-center gap-1 text-sm font-medium text-text-secondary disabled:opacity-40 hover:text-text-primary">
                                <ChevronLeft className="w-4 h-4" /> Back
                            </button>
                            {builderStep < 2 ? (
                                <button type="button" onClick={() => setBuilderStep(s => s + 1)}
                                    className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button type="button" onClick={saveBuilder} disabled={savingBuilder}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60">
                                    {savingBuilder ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Save Resume
                                </button>
                            )}
                        </div>
                        <button type="button" onClick={() => setShowBuilder(false)}
                            className="mt-3 text-xs text-text-tertiary hover:text-text-secondary">
                            Cancel builder
                        </button>
                    </div>
                )}

                {!resumeUrl && !uploading && !showBuilder && (
                    <p className="text-xs text-text-tertiary mt-4">
                        No resume yet. Upload a PDF/DOCX or use the builder to create a structured profile employers can view.
                    </p>
                )}
            </SettingsCard>
        </div>
    );
}

/**
 * Account Settings Page — Profile / Password / Danger Zone
 * - Loads real data from API on mount (no stale auth-store snapshots)
 * - Refreshes auth store after save → sidebar name updates immediately
 * - Candidates see a Resume Upload section
 */
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../api/client';
import {
    User, Lock, Trash2, Camera, Loader2, CheckCircle, AlertCircle,
    Eye, EyeOff, FileText, Upload, Download, X
} from 'lucide-react';

type Tab = 'profile' | 'password' | 'danger';

export default function AccountSettingsPage() {
    const { user, fetchUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
        { key: 'profile', icon: <User className="w-4 h-4" />, label: 'Profile' },
        { key: 'password', icon: <Lock className="w-4 h-4" />, label: 'Password' },
        { key: 'danger', icon: <Trash2 className="w-4 h-4" />, label: 'Danger Zone' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h1>
                <p className="text-gray-500 text-sm mb-8">Manage your account information and preferences.</p>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-white rounded-xl p-1.5 border border-gray-200 w-fit shadow-sm">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'profile' && <ProfileTab user={user} fetchUser={fetchUser} />}
                {activeTab === 'password' && <PasswordTab />}
                {activeTab === 'danger' && <DangerZoneTab />}
            </div>
        </div>
    );
}


function ProfileTab({ user, fetchUser }: { user: any; fetchUser: () => Promise<void> }) {
    const [form, setForm] = useState({
        fullName: '',
        bio: '',
        location: '',
        phone: '',
        website: '',
        linkedin_url: '',
    });
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Load real profile data from API on mount
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/api/users/me');
                const data = res.data;
                const p = data.profile || {};
                setForm({
                    fullName: p.full_name || '',
                    bio: p.bio || '',
                    location: p.location || '',
                    phone: p.phone || '',
                    website: p.social_links?.website || '',
                    linkedin_url: p.social_links?.linkedin || '',
                });
            } catch {
                // fallback to auth store snapshot
                setForm({
                    fullName: user?.full_name || '',
                    bio: user?.profile?.bio || '',
                    location: user?.profile?.location || '',
                    phone: user?.profile?.phone || '',
                    website: user?.profile?.social_links?.website || '',
                    linkedin_url: user?.profile?.social_links?.linkedin || '',
                });
            } finally {
                setLoadingProfile(false);
            }
        })();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.patch('/api/users/profile', {
                full_name: form.fullName,
                bio: form.bio,
                location: form.location,
                phone: form.phone,
                social_links: {
                    website: form.website,
                    linkedin: form.linkedin_url,
                },
            });
            setSuccess(true);
            // Refresh auth store so sidebar name updates immediately
            await fetchUser();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loadingProfile) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        );
    }

    const displayName = form.fullName || user?.email?.split('@')[0] || 'User';

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-soft overflow-hidden">
            {/* Avatar Section */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                        {displayName[0]?.toUpperCase() || '?'}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border-2 border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <Camera className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">{displayName}</h3>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <span className="inline-block mt-1 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium capitalize">
                        {user?.role}
                    </span>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input type="text" name="fullName" value={form.fullName} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input type="text" name="location" value={form.location} onChange={handleChange}
                            placeholder="e.g. Bengaluru, India"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                            placeholder="+91 9876543210"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input type="url" name="website" value={form.website} onChange={handleChange}
                            placeholder="https://yourwebsite.com"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
                    <input type="url" name="linkedin_url" value={form.linkedin_url} onChange={handleChange}
                        placeholder="https://linkedin.com/in/yourusername"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                        placeholder="Tell employers a bit about yourself..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" />
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-xl px-3 py-2 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                    <button type="submit" disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-700 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
                    </button>
                    {success && (
                        <div className="flex items-center gap-1.5 text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Saved! Sidebar updated.
                        </div>
                    )}
                </div>
            </form>

            {/* Resume Upload — Candidate only */}
            {user?.role === 'candidate' && (
                <div className="px-6 pb-6">
                    <ResumeUploadSection fetchUser={fetchUser} />
                </div>
            )}
        </div>
    );
}


function ResumeUploadSection({ fetchUser }: { fetchUser: () => Promise<void> }) {
    const { user } = useAuthStore();
    const [uploading, setUploading] = useState(false);
    const [resumeUrl, setResumeUrl] = useState<string | null>(user?.profile?.resume_url || null);
    const [uploadError, setUploadError] = useState('');
    const [fileName, setFileName] = useState('');

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
        } catch (err: any) {
            setUploadError(err.response?.data?.detail || 'Upload failed. Try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Resume / CV
            </h3>
            <p className="text-xs text-gray-400 mb-4">PDF or DOCX — max 5 MB. Your resume is shared with employers when you apply.</p>

            {resumeUrl ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-green-800 truncate">Resume uploaded</p>
                        <p className="text-xs text-green-600 truncate">{fileName || resumeUrl.split('/').pop()}</p>
                    </div>
                    <div className="flex gap-2">
                        <a href={`${API_BASE}${resumeUrl}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:underline">
                            <Download className="w-3.5 h-3.5" /> Download
                        </a>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                            <Upload className="w-3.5 h-3.5" /> Replace
                            <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="sr-only" />
                        </label>
                    </div>
                </div>
            ) : (
                <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer transition-colors
                    ${uploading ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-primary-400 hover:bg-primary-50/50'}`}>
                    {uploading ? (
                        <><Loader2 className="w-7 h-7 text-primary-500 animate-spin" /><span className="text-sm text-primary-600">Uploading…</span></>
                    ) : (
                        <>
                            <Upload className="w-7 h-7 text-gray-400" />
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-700">Click to upload resume</p>
                                <p className="text-xs text-gray-400 mt-0.5">PDF or DOCX, up to 5 MB</p>
                            </div>
                        </>
                    )}
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} disabled={uploading} className="sr-only" />
                </label>
            )}

            {uploadError && (
                <div className="mt-2 flex items-center gap-2 text-red-700 bg-red-50 rounded-xl px-3 py-2 text-sm">
                    <X className="w-4 h-4 flex-shrink-0" />
                    {uploadError}
                </div>
            )}
        </div>
    );
}


function PasswordTab() {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [show, setShow] = useState({ current: false, new: false, confirm: false });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const passwordRules = [
        { label: 'At least 8 characters', met: form.newPassword.length >= 8 },
        { label: 'One uppercase letter', met: /[A-Z]/.test(form.newPassword) },
        { label: 'One number', met: /\d/.test(form.newPassword) },
        { label: 'One special character', met: /[!@#$%^&*]/.test(form.newPassword) },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match.'); return; }
        if (!passwordRules.every(r => r.met)) { setError('New password does not meet requirements.'); return; }

        setSaving(true);
        setError('');
        try {
            await api.post('/api/users/change-password', {
                current_password: form.currentPassword,
                new_password: form.newPassword,
            });
            setSuccess(true);
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to change password. Check your current password.');
        } finally {
            setSaving(false);
        }
    };

    const PasswordInput = ({ label, valueKey, showKey }: any) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="relative">
                <input
                    type={show[showKey as keyof typeof show] ? 'text' : 'password'}
                    value={form[valueKey as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [valueKey]: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <button type="button"
                    onClick={() => setShow(prev => ({ ...prev, [showKey]: !prev[showKey as keyof typeof show] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {show[showKey as keyof typeof show] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Change Password</h2>
            {success ? (
                <div className="flex items-center gap-3 bg-green-50 text-green-700 rounded-xl px-4 py-3">
                    <CheckCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">Password changed successfully!</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
                    <PasswordInput label="Current Password" valueKey="currentPassword" showKey="current" />
                    <PasswordInput label="New Password" valueKey="newPassword" showKey="new" />
                    {form.newPassword && (
                        <ul className="space-y-1">
                            {passwordRules.map(rule => (
                                <li key={rule.label} className={`flex items-center gap-2 text-xs ${rule.met ? 'text-green-600' : 'text-gray-400'}`}>
                                    <CheckCircle className={`w-3 h-3 ${rule.met ? 'text-green-500' : 'text-gray-300'}`} />
                                    {rule.label}
                                </li>
                            ))}
                        </ul>
                    )}
                    <PasswordInput label="Confirm New Password" valueKey="confirmPassword" showKey="confirm" />
                    {error && (
                        <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-xl px-3 py-2 text-sm">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}
                    <button type="submit" disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-700 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : 'Update Password'}
                    </button>
                </form>
            )}
        </div>
    );
}


function DangerZoneTab() {
    const [confirming, setConfirming] = useState(false);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        try {
            await api.delete('/api/users/account', { data: { reason } });
            window.location.href = '/';
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete account. Please contact support.');
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-soft p-6">
            <h2 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Danger Zone
            </h2>
            <p className="text-sm text-gray-600 mb-6">
                Deleting your account is permanent and cannot be undone. All your data, applications, and Talent Vault items will be permanently removed within 30 days.
            </p>

            {!confirming ? (
                <button onClick={() => setConfirming(true)}
                    className="px-6 py-2.5 border-2 border-red-500 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
                    Delete My Account
                </button>
            ) : (
                <div className="bg-red-50 rounded-xl p-5 space-y-4">
                    <p className="text-sm font-semibold text-red-700">Are you absolutely sure?</p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Help us improve: why are you leaving? (optional)
                        </label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                            placeholder="e.g. Found a job, moving to different platform..."
                            className="w-full px-4 py-2.5 border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-300 outline-none resize-none" />
                    </div>
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <div className="flex gap-3">
                        <button onClick={handleDelete} disabled={loading}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2">
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : 'Yes, Delete My Account'}
                        </button>
                        <button onClick={() => setConfirming(false)}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

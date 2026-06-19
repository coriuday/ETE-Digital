/**
 * Profile Settings — name, bio, links, visibility toggle
 */
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../api/client';
import { preferencesApi } from '../../api/preferences';
import { SettingsCard, SaveFeedback, inputCls, labelCls } from './settingsShared';
import { Camera, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function ProfileSettingsPage() {
    const { user, fetchUser } = useAuthStore();
    const [form, setForm] = useState({
        fullName: '', bio: '', location: '', phone: '', website: '', linkedin_url: '',
    });
    const [profileVisible, setProfileVisible] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const [meRes, prefs] = await Promise.all([
                    api.get('/api/users/me'),
                    preferencesApi.get(),
                ]);
                const p = meRes.data.profile || {};
                setForm({
                    fullName: p.full_name || '',
                    bio: p.bio || '',
                    location: p.location || '',
                    phone: p.phone || '',
                    website: p.social_links?.website || '',
                    linkedin_url: p.social_links?.linkedin || '',
                });
                setProfileVisible(prefs.profile_visible !== false);
            } catch {
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

    const toggleVisibility = async () => {
        const next = !profileVisible;
        setProfileVisible(next);
        try {
            await preferencesApi.patch({ profile_visible: next });
        } catch {
            setProfileVisible(!next);
        }
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
                social_links: { website: form.website, linkedin: form.linkedin_url },
            });
            setSuccess(true);
            await fetchUser();
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            setError(detail || 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    if (loadingProfile) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
        );
    }

    const displayName = form.fullName || user?.email?.split('@')[0] || 'User';

    return (
        <SettingsCard title="Profile" description="Your public profile information visible to employers.">
            {/* Visibility toggle */}
            <button
                type="button"
                onClick={toggleVisibility}
                className={`mb-6 w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    profileVisible
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-background border-border text-text-secondary'
                }`}
            >
                <div className="flex items-center gap-2">
                    {profileVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span className="text-sm font-semibold">
                        {profileVisible ? 'Employers can find you' : 'Hidden from employers'}
                    </span>
                </div>
                <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    profileVisible ? 'bg-emerald-500' : 'bg-border'
                }`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        profileVisible ? 'translate-x-4' : 'translate-x-1'
                    }`} />
                </div>
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
                <div className="relative">
                    <div className="w-20 h-20 bg-primary-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                        {displayName[0]?.toUpperCase() || '?'}
                    </div>
                    <button
                        type="button"
                        title="Avatar upload requires file storage (MinIO)"
                        className="absolute -bottom-1 -right-1 w-7 h-7 bg-surface border-2 border-border rounded-lg shadow-card flex items-center justify-center opacity-50 cursor-not-allowed"
                    >
                        <Camera className="w-3.5 h-3.5 text-text-secondary" />
                    </button>
                </div>
                <div>
                    <h3 className="font-semibold text-text-primary">{displayName}</h3>
                    <p className="text-sm text-text-secondary">{user?.email}</p>
                    <p className="text-xs text-text-tertiary mt-1">Photo upload available when storage is configured.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className={labelCls}>Full Name</label>
                        <input type="text" name="fullName" value={form.fullName} onChange={handleChange} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Location</label>
                        <input type="text" name="location" value={form.location} onChange={handleChange}
                            placeholder="e.g. Bengaluru, India" className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Phone</label>
                        <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                            placeholder="+91 9876543210" className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Website</label>
                        <input type="url" name="website" value={form.website} onChange={handleChange}
                            placeholder="https://yourwebsite.com" className={inputCls} />
                    </div>
                </div>
                <div>
                    <label className={labelCls}>LinkedIn URL</label>
                    <input type="url" name="linkedin_url" value={form.linkedin_url} onChange={handleChange}
                        placeholder="https://linkedin.com/in/yourusername" className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Bio</label>
                    <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                        placeholder="Tell employers a bit about yourself..." className={`${inputCls} resize-none`} />
                </div>
                <SaveFeedback saving={saving} success={success} error={error} />
            </form>
        </SettingsCard>
    );
}

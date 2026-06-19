/**
 * Password Settings — change password
 */
import { useState } from 'react';
import api from '../../api/client';
import { SettingsCard } from './settingsShared';
import { CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function PasswordSettingsPage() {
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
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            setError(detail || 'Failed to change password. Check your current password.');
        } finally {
            setSaving(false);
        }
    };

    const PasswordInput = ({ label, valueKey, showKey }: {
        label: string;
        valueKey: keyof typeof form;
        showKey: keyof typeof show;
    }) => (
        <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{label}</label>
            <div className="relative">
                <input
                    type={show[showKey] ? 'text' : 'password'}
                    value={form[valueKey]}
                    onChange={e => setForm(prev => ({ ...prev, [valueKey]: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 pr-12 border border-border rounded-lg text-sm text-text-primary bg-surface focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 outline-none"
                />
                <button type="button"
                    onClick={() => setShow(prev => ({ ...prev, [showKey]: !prev[showKey] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                    {show[showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );

    return (
        <SettingsCard title="Change Password" description="Update your account password.">
            {success ? (
                <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-3">
                    <CheckCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">Password changed successfully!</p>
                    <button type="button" onClick={() => setSuccess(false)}
                        className="ml-auto text-xs font-semibold text-emerald-600 hover:underline">
                        Change again
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
                    <PasswordInput label="Current Password" valueKey="currentPassword" showKey="current" />
                    <PasswordInput label="New Password" valueKey="newPassword" showKey="new" />
                    {form.newPassword && (
                        <ul className="space-y-1">
                            {passwordRules.map(rule => (
                                <li key={rule.label} className={`flex items-center gap-2 text-xs ${rule.met ? 'text-emerald-600' : 'text-text-tertiary'}`}>
                                    <CheckCircle className={`w-3 h-3 ${rule.met ? 'text-emerald-500' : 'text-border'}`} />
                                    {rule.label}
                                </li>
                            ))}
                        </ul>
                    )}
                    <PasswordInput label="Confirm New Password" valueKey="confirmPassword" showKey="confirm" />
                    {error && (
                        <div className="flex items-center gap-2 text-error bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}
                    <button type="submit" disabled={saving}
                        className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center gap-2 shadow-sm">
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : 'Update Password'}
                    </button>
                </form>
            )}
        </SettingsCard>
    );
}

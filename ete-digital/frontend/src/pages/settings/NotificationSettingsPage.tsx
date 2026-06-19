/**
 * Notification Settings Page
 */
import { useState, useEffect } from 'react';
import { Mail, Smartphone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import { SettingsCard } from './settingsShared';

type NotifPrefs = {
    email_applications: boolean;
    email_tryouts: boolean;
    email_messages: boolean;
    email_marketing: boolean;
    push_applications: boolean;
    push_tryouts: boolean;
    push_messages: boolean;
};

const defaultPrefs: NotifPrefs = {
    email_applications: true,
    email_tryouts: true,
    email_messages: true,
    email_marketing: false,
    push_applications: true,
    push_tryouts: true,
    push_messages: true,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                checked ? 'bg-primary-600' : 'bg-border'
            }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
}

export default function NotificationSettingsPage() {
    const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/api/users/me/preferences');
                const stored = res.data?.notifications;
                if (stored && typeof stored === 'object') {
                    setPrefs({ ...defaultPrefs, ...stored });
                }
            } catch {
                /* use defaults */
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const update = (key: keyof NotifPrefs, value: boolean) => {
        setPrefs(prev => ({ ...prev, [key]: value }));
        setSuccess(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await api.patch('/api/users/me/preferences', { notifications: prefs });
            setSuccess(true);
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            setError(detail || 'Failed to save preferences.');
        } finally {
            setSaving(false);
        }
    };

    const sections = [
        {
            icon: <Mail className="w-5 h-5 text-primary-600" />,
            title: 'Email Notifications',
            desc: 'Receive updates in your inbox',
            items: [
                { key: 'email_applications' as const, label: 'Application updates', desc: 'When your application status changes' },
                { key: 'email_tryouts' as const, label: 'Tryout updates', desc: 'New tryout invitations, results, and payments' },
                { key: 'email_messages' as const, label: 'Messages', desc: 'When employers send you messages' },
                { key: 'email_marketing' as const, label: 'Tips & newsletters', desc: 'Career advice, platform updates, and promotions' },
            ],
        },
        {
            icon: <Smartphone className="w-5 h-5 text-primary-600" />,
            title: 'In-App Notifications',
            desc: 'Real-time platform notifications',
            items: [
                { key: 'push_applications' as const, label: 'Application updates', desc: 'Status changes and employer actions' },
                { key: 'push_tryouts' as const, label: 'Tryout updates', desc: 'New invitations and payment releases' },
                { key: 'push_messages' as const, label: 'Messages', desc: 'New messages from employers' },
            ],
        },
    ];

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <SettingsCard title="Notifications" description="Choose what updates you want to receive.">
            <div className="space-y-6">
                {sections.map((section, si) => (
                    <div key={si} className="rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background">
                            <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                                {section.icon}
                            </div>
                            <div>
                                <h3 className="font-semibold text-text-primary text-sm">{section.title}</h3>
                                <p className="text-xs text-text-secondary">{section.desc}</p>
                            </div>
                        </div>
                        <div className="divide-y divide-border">
                            {section.items.map((item) => (
                                <div key={item.key} className="flex items-center justify-between px-5 py-4">
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">{item.label}</p>
                                        <p className="text-xs text-text-secondary">{item.desc}</p>
                                    </div>
                                    <Toggle
                                        checked={prefs[item.key]}
                                        onChange={(value) => update(item.key, value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {error && (
                    <div className="flex items-center gap-2 text-sm text-error bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Preferences'}
                    </button>
                    {success && (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Preferences saved!
                        </div>
                    )}
                </div>
            </div>
        </SettingsCard>
    );
}

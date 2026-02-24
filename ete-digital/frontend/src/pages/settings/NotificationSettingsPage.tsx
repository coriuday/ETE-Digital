/**
 * Notification Settings Page
 */
import { useState } from 'react';
import { Bell, Mail, Smartphone, Loader2, CheckCircle } from 'lucide-react';
import api from '../../api/client';

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
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${checked ? 'bg-primary-600' : 'bg-gray-200'
                }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
            />
        </button>
    );
}

export default function NotificationSettingsPage() {
    const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const update = (key: keyof NotifPrefs, value: boolean) => {
        setPrefs(prev => ({ ...prev, [key]: value }));
        setSuccess(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await api.patch('/api/users/notification-preferences', prefs);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save preferences.');
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

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <Bell className="w-6 h-6 text-primary-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
                </div>
                <p className="text-gray-500 text-sm mb-8">Choose what updates you want to receive.</p>

                <div className="space-y-6">
                    {sections.map((section, si) => (
                        <div key={si} className="bg-white rounded-2xl border border-gray-200 shadow-soft overflow-hidden">
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                                    {section.icon}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900 text-sm">{section.title}</h2>
                                    <p className="text-xs text-gray-500">{section.desc}</p>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {section.items.map((item) => (
                                    <div key={item.key} className="flex items-center justify-between px-6 py-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                                            <p className="text-xs text-gray-500">{item.desc}</p>
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
                </div>

                {error && (
                    <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
                )}

                <div className="mt-6 flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-700 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Preferences'}
                    </button>
                    {success && (
                        <div className="flex items-center gap-1.5 text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Preferences saved!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * EmployerOnboardingPage — Domain-verified employer setup
 * HR accounts must use a corporate work email and verify company domain ownership.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import { hrPageCls } from './hrShared';
import { useAuthStore } from '../../stores/authStore';
import { organizationsApi, Organization } from '../../api/organizations';
import {
    CheckCircle2, Loader2, AlertCircle,
    ShieldCheck, Clock,
} from 'lucide-react';

type Path = 'domain' | 'pending' | 'verified';

const FREE_DOMAINS = new Set([
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'hotmail.com', 'outlook.com', 'icloud.com',
    'protonmail.com', 'proton.me', 'rediffmail.com', 'ymail.com', 'live.com', 'msn.com', 'aol.com', 'zoho.com',
    'mail.com', 'gmx.com', 'me.com',
]);

function emailDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() ?? '';
}

export default function EmployerOnboardingPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [path, setPath] = useState<Path>('domain');
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const userDomain = useMemo(() => emailDomain(user?.email ?? ''), [user?.email]);
    const hasCorporateEmail = userDomain && !FREE_DOMAINS.has(userDomain);

    const [companyName, setCompanyName] = useState('');
    const [domain, setDomain] = useState(hasCorporateEmail ? userDomain : '');
    const [website, setWebsite] = useState(hasCorporateEmail ? `https://${userDomain}` : '');
    const [verificationMethod, setVerificationMethod] = useState<'dns_txt' | 'html_file' | 'meta_tag'>('dns_txt');

    useEffect(() => {
        (async () => {
            try {
                const existing = await organizationsApi.getMine();
                setOrg(existing);
                if (existing.is_verified) {
                    setPath('verified');
                } else if (existing.registration_path === 'standard') {
                    setPath('pending');
                } else {
                    navigate('/hr/domain-verify', { replace: true });
                }
            } catch (e: any) {
                if (e.response?.status !== 404) {
                    setError('Could not load organisation status.');
                }
                setPath('domain');
            } finally {
                setLoading(false);
            }
        })();
    }, [navigate]);

    const handleDomainSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await organizationsApi.initDomain({
                company_name: companyName,
                domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase(),
                website: website.startsWith('http') ? website : `https://${website}`,
                verification_method: verificationMethod,
            });
            navigate('/hr/domain-verify');
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Failed to register company domain.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-primary-500" size={32} />
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className={`${hrPageCls} max-w-3xl`}>
                <PageHeader
                    title="Set Up Your Company"
                    description="Verify your company domain with your corporate work email to start posting jobs"
                />

                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {!hasCorporateEmail && path === 'domain' && (
                    <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <p>
                            Your account must use a corporate work email (e.g. hr@yourcompany.com).
                            Personal emails like Gmail or Yahoo cannot be used for employer accounts.
                        </p>
                    </div>
                )}

                {path === 'domain' && (
                    <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
                        <h2 className="font-semibold text-text-primary mb-1">Register Company Domain</h2>
                        <p className="text-sm text-text-secondary mb-4">
                            Verify domain ownership via DNS, HTML file, or meta tag.
                            {hasCorporateEmail && (
                                <span className="ml-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                    <CheckCircle2 size={12} /> Detected: @{userDomain}
                                </span>
                            )}
                        </p>
                        <form onSubmit={handleDomainSubmit} className="space-y-4">
                            <Field label="Company Name" value={companyName} onChange={setCompanyName} placeholder="Acme Corp" required />
                            <Field label="Company Domain" value={domain} onChange={setDomain} placeholder="acme.com" required hint="Must match your work email domain" />
                            <Field label="Website URL" value={website} onChange={setWebsite} placeholder="https://acme.com" required />
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">Verification Method</label>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    {([
                                        ['dns_txt', 'DNS TXT', 'Most secure'],
                                        ['html_file', 'HTML File', 'Easy upload'],
                                        ['meta_tag', 'Meta Tag', 'Homepage tag'],
                                    ] as const).map(([value, label, sub]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setVerificationMethod(value)}
                                            className={`p-3 rounded-xl border text-left text-sm transition-colors ${
                                                verificationMethod === value
                                                    ? 'border-primary-500 bg-primary-50 text-primary-800'
                                                    : 'border-border hover:border-border'
                                            }`}
                                        >
                                            <span className="font-semibold block">{label}</span>
                                            <span className="text-xs text-text-secondary">{sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" disabled={submitting || !hasCorporateEmail}
                                className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                {submitting ? <><Loader2 size={15} className="animate-spin" /> Setting up...</> : 'Continue to Verification'}
                            </button>
                        </form>
                    </div>
                )}

                {path === 'pending' && org && (
                    <div className="bg-surface rounded-2xl border border-border shadow-sm p-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                            <Clock size={32} className="text-amber-600" />
                        </div>
                        <h2 className="text-xl font-bold text-text-primary">Under Review</h2>
                        <p className="text-text-secondary text-sm max-w-md mx-auto">
                            <strong>{org.company_name}</strong> was submitted under a legacy registration path and is pending review.
                            Contact support if you need help migrating to domain verification.
                        </p>
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-semibold">
                            Pending Verification
                        </span>
                        <button onClick={() => navigate('/hr/dashboard')}
                            className="block mx-auto mt-4 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">
                            Go to Dashboard
                        </button>
                    </div>
                )}

                {path === 'verified' && org && (
                    <div className="bg-surface rounded-2xl border border-border shadow-sm p-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                            <ShieldCheck size={32} className="text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-text-primary">Verified Employer</h2>
                        <p className="text-text-secondary text-sm">{org.company_name} is fully verified.</p>
                        <button onClick={() => navigate('/hr/dashboard')}
                            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </AppShell>
    );
}

function Field({ label, value, onChange, placeholder, required, hint }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; required?: boolean; hint?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
            <input value={value} onChange={(e) => onChange(e.target.value)} required={required}
                placeholder={placeholder}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            {hint && <p className="text-xs text-text-tertiary mt-1">{hint}</p>}
        </div>
    );
}

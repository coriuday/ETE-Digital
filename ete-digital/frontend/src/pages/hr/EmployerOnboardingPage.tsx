/**
 * EmployerOnboardingPage — Two-path employer setup
 * Path 1: Domain mail (corporate email + DNS/HTML/meta verification)
 * Path 2: Standard registration (personal email + admin review)
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { useAuthStore } from '../../stores/authStore';
import { organizationsApi, Organization } from '../../api/organizations';
import {
    Building2, Globe, Mail, CheckCircle2, Loader2, AlertCircle,
    ChevronRight, ShieldCheck, Clock,
} from 'lucide-react';

type Path = 'choose' | 'domain' | 'standard' | 'pending' | 'verified';

const FREE_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
    'protonmail.com', 'rediffmail.com', 'ymail.com', 'live.com', 'msn.com', 'aol.com', 'zoho.com',
]);

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

function emailDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() ?? '';
}

export default function EmployerOnboardingPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [path, setPath] = useState<Path>('choose');
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const userDomain = useMemo(() => emailDomain(user?.email ?? ''), [user?.email]);
    const hasCorporateEmail = userDomain && !FREE_DOMAINS.has(userDomain);

    // Domain path form
    const [companyName, setCompanyName] = useState('');
    const [domain, setDomain] = useState(hasCorporateEmail ? userDomain : '');
    const [website, setWebsite] = useState(hasCorporateEmail ? `https://${userDomain}` : '');
    const [verificationMethod, setVerificationMethod] = useState<'dns_txt' | 'html_file' | 'meta_tag'>('dns_txt');

    // Standard path form
    const [stdCompanyName, setStdCompanyName] = useState('');
    const [stdWebsite, setStdWebsite] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [companySize, setCompanySize] = useState('');
    const [industry, setIndustry] = useState('');
    const [gstNumber, setGstNumber] = useState('');

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
                setPath('choose');
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

    const handleStandardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const created = await organizationsApi.initStandard({
                company_name: stdCompanyName,
                website: stdWebsite.startsWith('http') ? stdWebsite : `https://${stdWebsite}`,
                linkedin_url: linkedinUrl || undefined,
                company_size: companySize || undefined,
                industry: industry || undefined,
                gst_number: gstNumber || undefined,
            });
            setOrg(created);
            setPath('pending');
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Failed to submit company profile.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-violet-500" size={32} />
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                        <Building2 size={20} className="text-violet-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Set Up Your Company</h1>
                        <p className="text-sm text-gray-500">Complete employer onboarding to start posting jobs</p>
                    </div>
                </div>

                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {path === 'choose' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => setPath('domain')}
                            className="text-left p-6 bg-white border-2 border-gray-100 hover:border-violet-400 rounded-2xl shadow-sm transition-all group"
                        >
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                                <Globe size={20} className="text-emerald-600" />
                            </div>
                            <h2 className="font-semibold text-gray-900 mb-2">Work Email / Company Domain</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                Use your corporate email (e.g. hr@acme.com) and verify domain ownership via DNS, HTML file, or meta tag.
                            </p>
                            {hasCorporateEmail && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                                    <CheckCircle2 size={12} /> Detected: @{userDomain}
                                </span>
                            )}
                            <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-violet-600 group-hover:gap-2 transition-all">
                                Continue <ChevronRight size={16} />
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPath('standard')}
                            className="text-left p-6 bg-white border-2 border-gray-100 hover:border-amber-400 rounded-2xl shadow-sm transition-all group"
                        >
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                                <Mail size={20} className="text-amber-600" />
                            </div>
                            <h2 className="font-semibold text-gray-900 mb-2">Personal / Free Email</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                Gmail, Yahoo, or other personal email? Submit company details for admin review — common for SMEs and agencies.
                            </p>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                                Up to 3 jobs while pending review
                            </span>
                            <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-amber-600 group-hover:gap-2 transition-all">
                                Continue <ChevronRight size={16} />
                            </span>
                        </button>
                    </div>
                )}

                {path === 'domain' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <button type="button" onClick={() => setPath('choose')} className="text-sm text-gray-500 hover:text-gray-800 mb-4">
                            ← Back
                        </button>
                        <h2 className="font-semibold text-gray-900 mb-4">Register Company Domain</h2>
                        <form onSubmit={handleDomainSubmit} className="space-y-4">
                            <Field label="Company Name" value={companyName} onChange={setCompanyName} placeholder="Acme Corp" required />
                            <Field label="Company Domain" value={domain} onChange={setDomain} placeholder="acme.com" required hint="Must match your work email domain" />
                            <Field label="Website URL" value={website} onChange={setWebsite} placeholder="https://acme.com" required />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Method</label>
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
                                                    ? 'border-violet-500 bg-violet-50 text-violet-800'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className="font-semibold block">{label}</span>
                                            <span className="text-xs text-gray-500">{sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" disabled={submitting}
                                className="w-full py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                {submitting ? <><Loader2 size={15} className="animate-spin" /> Setting up...</> : 'Continue to Verification'}
                            </button>
                        </form>
                    </div>
                )}

                {path === 'standard' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <button type="button" onClick={() => setPath('choose')} className="text-sm text-gray-500 hover:text-gray-800 mb-4">
                            ← Back
                        </button>
                        <h2 className="font-semibold text-gray-900 mb-4">Company Profile (Admin Review)</h2>
                        <form onSubmit={handleStandardSubmit} className="space-y-4">
                            <Field label="Company Name" value={stdCompanyName} onChange={setStdCompanyName} placeholder="Acme Recruiting Agency" required />
                            <Field label="Website URL" value={stdWebsite} onChange={setStdWebsite} placeholder="https://acme.com" required />
                            <Field label="LinkedIn Company Page (optional)" value={linkedinUrl} onChange={setLinkedinUrl} placeholder="https://linkedin.com/company/acme" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                                <select value={companySize} onChange={(e) => setCompanySize(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none">
                                    <option value="">Select size</option>
                                    {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
                                </select>
                            </div>
                            <Field label="Industry (optional)" value={industry} onChange={setIndustry} placeholder="IT Services, Staffing, etc." />
                            <Field label="GST / Business Reg. No. (optional)" value={gstNumber} onChange={setGstNumber} placeholder="For Indian businesses" />
                            <button type="submit" disabled={submitting}
                                className="w-full py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : 'Submit for Review'}
                            </button>
                        </form>
                    </div>
                )}

                {path === 'pending' && org && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                            <Clock size={32} className="text-amber-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Under Review</h2>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                            <strong>{org.company_name}</strong> has been submitted for verification.
                            You can post up to 3 jobs while our team reviews your profile.
                        </p>
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-semibold">
                            🟡 Pending Verification
                        </span>
                        <button onClick={() => navigate('/hr/dashboard')}
                            className="block mx-auto mt-4 px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700">
                            Go to Dashboard
                        </button>
                    </div>
                )}

                {path === 'verified' && org && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                            <ShieldCheck size={32} className="text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Verified Employer</h2>
                        <p className="text-gray-500 text-sm">{org.company_name} is fully verified.</p>
                        <button onClick={() => navigate('/hr/dashboard')}
                            className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input value={value} onChange={(e) => onChange(e.target.value)} required={required}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
            {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

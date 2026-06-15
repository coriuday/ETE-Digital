/**
 * DomainVerificationPage — HR employers verify their company domain via DNS TXT
 *
 * Flow:
 *   1. Enter company name, domain, website → POST /api/organizations/init
 *   2. Copy the DNS TXT record shown
 *   3. Click "Verify Now" → POST /api/organizations/verify-dns
 *   4. Success screen with verified badge
 */
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import api from '../../api/client';
import {
    Globe, CheckCircle2, Copy, RefreshCw, AlertCircle,
    ShieldCheck, Loader2, ChevronRight, ExternalLink,
} from 'lucide-react';

interface OrgData {
    id: string;
    company_name: string;
    domain: string;
    website: string;
    is_verified: boolean;
    verification_token: string | null;
    dns_txt_record: string | null;
    verified_at: string | null;
}

type Step = 'loading' | 'init' | 'pending' | 'verified';

export default function DomainVerificationPage() {
    const [step, setStep] = useState<Step>('loading');
    const [org, setOrg] = useState<OrgData | null>(null);

    // Init form
    const [companyName, setCompanyName] = useState('');
    const [domain, setDomain] = useState('');
    const [website, setWebsite] = useState('');

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    };

    // On mount: check if org already exists
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/organizations/me');
                setOrg(res.data);
                setStep(res.data.is_verified ? 'verified' : 'pending');
            } catch (e: any) {
                if (e.response?.status === 404) {
                    setStep('init');
                } else {
                    setError('Failed to load organization data.');
                    setStep('init');
                }
            }
        })();
    }, []);

    const handleInit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName || !domain || !website) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await api.post('/organizations/init', {
                company_name: companyName,
                domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase(),
                website: website.startsWith('http') ? website : `https://${website}`,
            });
            setOrg(res.data);
            setStep('pending');
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Failed to initialise. Try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerify = async () => {
        setVerifying(true);
        setError('');
        try {
            const res = await api.post('/organizations/verify-dns');
            setOrg(res.data);
            if (res.data.is_verified) {
                setStep('verified');
                showToast('🎉 Domain verified successfully!');
            }
        } catch (e: any) {
            setError(e.response?.data?.detail || 'DNS verification failed. Check your record and try again.');
        } finally {
            setVerifying(false);
        }
    };

    const copyRecord = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (step === 'loading') {
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
            {toast && (
                <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 size={16} /> {toast}
                </div>
            )}

            <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                        <Globe size={20} className="text-violet-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Domain Verification</h1>
                        <p className="text-sm text-gray-500">Verify your company domain to unlock full employer features</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-2 text-sm">
                    {['Set Up', 'Add DNS Record', 'Verified'].map((label, i) => {
                        const active = (step === 'init' && i === 0) || (step === 'pending' && i === 1) || (step === 'verified' && i === 2);
                        const done = (step === 'pending' && i === 0) || (step === 'verified' && i <= 1);
                        return (
                            <div key={label} className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    done ? 'bg-emerald-500 text-white' : active ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                    {done ? '✓' : i + 1}
                                </div>
                                <span className={active ? 'text-gray-900 font-semibold' : done ? 'text-emerald-600' : 'text-gray-400'}>{label}</span>
                                {i < 2 && <ChevronRight size={14} className="text-gray-300" />}
                            </div>
                        );
                    })}
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {/* ── STEP 1: Init form ── */}
                {step === 'init' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <h2 className="font-semibold text-gray-900">Register Your Company Domain</h2>
                        <form onSubmit={handleInit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input value={companyName} onChange={e => setCompanyName(e.target.value)} required
                                    placeholder="Acme Corp" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Domain</label>
                                <input value={domain} onChange={e => setDomain(e.target.value)} required
                                    placeholder="acme.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
                                <p className="text-xs text-gray-400 mt-1">Just the domain, e.g. acme.com (no https://)</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                                <input value={website} onChange={e => setWebsite(e.target.value)} required
                                    placeholder="https://acme.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
                            </div>
                            <button type="submit" disabled={submitting}
                                className="w-full py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {submitting ? <><Loader2 size={15} className="animate-spin" /> Setting up...</> : 'Get Verification Record'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ── STEP 2: Pending DNS ── */}
                {step === 'pending' && org && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <h2 className="font-semibold text-gray-900">Add This DNS TXT Record</h2>
                            <p className="text-sm text-gray-500">
                                Log in to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.) and add the following TXT record for <strong>{org.domain}</strong>:
                            </p>

                            <div className="space-y-3">
                                <DnsField label="Type" value="TXT" />
                                <DnsField label="Name / Host" value="@" help="Some registrars use @ to represent the root domain" />
                                <DnsField
                                    label="Value"
                                    value={org.dns_txt_record ?? ''}
                                    copyable
                                    copied={copied}
                                    onCopy={() => copyRecord(org.dns_txt_record ?? '')}
                                />
                                <DnsField label="TTL" value="Auto / 3600" />
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                DNS changes can take up to 48 hours to propagate. If verification fails, wait a few minutes and try again.
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-semibold text-gray-900 mb-1">Step-by-step guides</h3>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {['Cloudflare', 'GoDaddy', 'Namecheap', 'Google Domains'].map(r => (
                                    <a key={r} href={`https://google.com/search?q=add+dns+txt+record+${r.toLowerCase()}`}
                                        target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                        {r} <ExternalLink size={11} />
                                    </a>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleVerify} disabled={verifying}
                            className="w-full py-3.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-200">
                            {verifying
                                ? <><Loader2 size={16} className="animate-spin" /> Checking DNS...</>
                                : <><RefreshCw size={16} /> Verify Domain Now</>}
                        </button>
                    </div>
                )}

                {/* ── STEP 3: Verified ── */}
                {step === 'verified' && org && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                            <ShieldCheck size={32} className="text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Domain Verified! 🎉</h2>
                        <p className="text-gray-500 text-sm">
                            <strong>{org.domain}</strong> has been verified for <strong>{org.company_name}</strong>.
                            Your verified badge is now active across all job listings.
                        </p>
                        {org.verified_at && (
                            <p className="text-xs text-gray-400">
                                Verified on {new Date(org.verified_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                            </p>
                        )}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold">
                            <CheckCircle2 size={15} /> Verified Employer
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}

function DnsField({ label, value, copyable, copied, onCopy, help }: {
    label: string; value: string; copyable?: boolean;
    copied?: boolean; onCopy?: () => void; help?: string;
}) {
    return (
        <div>
            <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
            <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 break-all">
                    {value}
                </code>
                {copyable && onCopy && (
                    <button onClick={onCopy}
                        className={`p-2 rounded-lg border transition-colors flex-shrink-0 ${
                            copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                        title="Copy to clipboard">
                        {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                    </button>
                )}
            </div>
            {help && <p className="text-xs text-gray-400 mt-1">{help}</p>}
        </div>
    );
}

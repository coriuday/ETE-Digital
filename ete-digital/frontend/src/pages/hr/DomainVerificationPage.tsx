/**
 * DomainVerificationPage — Verify company domain (DNS / HTML / meta tag)
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { organizationsApi, Organization } from '../../api/organizations';
import {
    Globe, CheckCircle2, Copy, RefreshCw, AlertCircle,
    ShieldCheck, Loader2, ChevronRight, ExternalLink,
} from 'lucide-react';

type Step = 'loading' | 'pending' | 'verified';

export default function DomainVerificationPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('loading');
    const [org, setOrg] = useState<Organization | null>(null);
    const [error, setError] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        (async () => {
            try {
                const data = await organizationsApi.getMine();
                if (data.registration_path === 'standard') {
                    navigate('/hr/onboarding', { replace: true });
                    return;
                }
                setOrg(data);
                setStep(data.is_verified ? 'verified' : 'pending');
            } catch (e: any) {
                if (e.response?.status === 404) {
                    navigate('/hr/onboarding', { replace: true });
                } else {
                    setError('Failed to load organization data.');
                }
            }
        })();
    }, [navigate]);

    const handleVerify = async () => {
        setVerifying(true);
        setError('');
        try {
            const res = await organizationsApi.verify();
            setOrg(res);
            if (res.is_verified) {
                setStep('verified');
                showToast('Domain verified successfully!');
            }
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Verification failed. Check your setup and try again.');
        } finally {
            setVerifying(false);
        }
    };

    const copyText = (text: string) => {
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

    const method = org?.verification_method ?? 'dns_txt';

    return (
        <AppShell>
            {toast && (
                <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 size={16} /> {toast}
                </div>
            )}

            <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                        <Globe size={20} className="text-violet-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Domain Verification</h1>
                        <p className="text-sm text-gray-500">{org?.company_name} · {org?.domain}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                    {['Instructions', 'Verify'].map((label, i) => {
                        const active = (step === 'pending' && i === 0) || (step === 'verified' && i === 1);
                        const done = step === 'verified' && i === 0;
                        return (
                            <div key={label} className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    done ? 'bg-emerald-500 text-white' : active ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                    {done ? '✓' : i + 1}
                                </div>
                                <span className={active ? 'text-gray-900 font-semibold' : done ? 'text-emerald-600' : 'text-gray-400'}>{label}</span>
                                {i < 1 && <ChevronRight size={14} className="text-gray-300" />}
                            </div>
                        );
                    })}
                </div>

                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {step === 'pending' && org && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                            {method === 'dns_txt' && (
                                <>
                                    <h2 className="font-semibold text-gray-900">Add This DNS TXT Record</h2>
                                    <p className="text-sm text-gray-500">
                                        Add the following TXT record for <strong>{org.domain}</strong> at your DNS provider:
                                    </p>
                                    <div className="space-y-3">
                                        <DnsField label="Type" value="TXT" />
                                        <DnsField label="Name / Host" value="@" help="Some registrars use @ for the root domain" />
                                        <DnsField label="Value" value={org.dns_txt_record ?? ''} copyable copied={copied} onCopy={() => copyText(org.dns_txt_record ?? '')} />
                                        <DnsField label="TTL" value="Auto / 3600" />
                                    </div>
                                </>
                            )}

                            {method === 'html_file' && (
                                <>
                                    <h2 className="font-semibold text-gray-900">Upload Verification File</h2>
                                    <p className="text-sm text-gray-500">
                                        Upload a file named <strong>{org.html_file_name}</strong> to your website root so it is accessible at:
                                    </p>
                                    <DnsField
                                        label="File URL"
                                        value={`${org.website.replace(/\/$/, '')}/${org.html_file_name}`}
                                        copyable copied={copied}
                                        onCopy={() => copyText(`${org.website.replace(/\/$/, '')}/${org.html_file_name}`)}
                                    />
                                    <DnsField
                                        label="File contents"
                                        value={org.verification_token ?? ''}
                                        copyable copied={copied}
                                        onCopy={() => copyText(org.verification_token ?? '')}
                                    />
                                </>
                            )}

                            {method === 'meta_tag' && (
                                <>
                                    <h2 className="font-semibold text-gray-900">Add Meta Tag to Homepage</h2>
                                    <p className="text-sm text-gray-500">
                                        Paste this tag inside the <code>&lt;head&gt;</code> of <strong>{org.website}</strong>:
                                    </p>
                                    <DnsField
                                        label="Meta tag"
                                        value={org.meta_tag_snippet ?? ''}
                                        copyable copied={copied}
                                        onCopy={() => copyText(org.meta_tag_snippet ?? '')}
                                    />
                                </>
                            )}

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                DNS changes can take up to 48 hours. We also check automatically every 5 minutes.
                            </div>
                        </div>

                        {method === 'dns_txt' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h3 className="font-semibold text-gray-900 mb-1">Step-by-step guides</h3>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {['Cloudflare', 'GoDaddy', 'Namecheap'].map((r) => (
                                        <a key={r} href={`https://google.com/search?q=add+dns+txt+record+${r.toLowerCase()}`}
                                            target="_blank" rel="noreferrer"
                                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                                            {r} <ExternalLink size={11} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button onClick={handleVerify} disabled={verifying}
                            className="w-full py-3.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-200">
                            {verifying
                                ? <><Loader2 size={16} className="animate-spin" /> Checking...</>
                                : <><RefreshCw size={16} /> Verify Now</>}
                        </button>
                    </div>
                )}

                {step === 'verified' && org && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                            <ShieldCheck size={32} className="text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Domain Verified!</h2>
                        <p className="text-gray-500 text-sm">
                            <strong>{org.domain}</strong> is verified for <strong>{org.company_name}</strong>.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold">
                            <CheckCircle2 size={15} /> Verified Employer
                        </div>
                        <button onClick={() => navigate('/hr/dashboard')}
                            className="block mx-auto mt-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700">
                            Go to Dashboard
                        </button>
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

/**
 * Company Settings — inline company profile inside /settings/company
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { organizationsApi, Organization } from '../../api/organizations';
import { SettingsCard, SaveFeedback, inputCls, labelCls } from './settingsShared';
import { toastSuccess, toastError } from '../../utils/toast';
import {
    Building2, Globe, Loader2, AlertCircle, CheckCircle2, Clock, ShieldCheck, ExternalLink,
} from 'lucide-react';

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

export default function CompanySettingsPage() {
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [form, setForm] = useState({
        company_name: '',
        website: '',
        linkedin_url: '',
        company_size: '',
        industry: '',
    });

    useEffect(() => {
        (async () => {
            try {
                const existing = await organizationsApi.getMine();
                setOrg(existing);
                setForm({
                    company_name: existing.company_name || '',
                    website: existing.website || '',
                    linkedin_url: existing.linkedin_url || '',
                    company_size: existing.company_size || '',
                    industry: existing.industry || '',
                });
            } catch (e: unknown) {
                if ((e as { response?: { status?: number } })?.response?.status === 404) {
                    setNotFound(true);
                } else {
                    toastError('Could not load company profile.');
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await organizationsApi.updateMine({
                company_name: form.company_name,
                website: form.website.startsWith('http') ? form.website : `https://${form.website}`,
                linkedin_url: form.linkedin_url || undefined,
                company_size: form.company_size || undefined,
                industry: form.industry || undefined,
            });
            setOrg(updated);
            toastSuccess('Company profile saved');
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toastError(typeof detail === 'string' ? detail : 'Failed to save company profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
        );
    }

    if (notFound) {
        return (
            <SettingsCard title="Company Profile" description="Set up your employer organisation.">
                <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
                    <p className="text-sm text-text-secondary mb-6">No company profile found yet. Complete onboarding to create one.</p>
                    <Link to="/hr/onboarding"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700">
                        Set Up Company <ExternalLink size={14} />
                    </Link>
                </div>
            </SettingsCard>
        );
    }

    const trustBadge = org?.is_verified ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
            <ShieldCheck size={12} /> Verified
        </span>
    ) : org?.trust_tier === 'pending' ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">
            <Clock size={12} /> Pending Review
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-background border border-border text-text-secondary text-xs font-semibold rounded-full">
            Unverified
        </span>
    );

    return (
        <SettingsCard title="Company Profile" description="Your organisation details visible to candidates.">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-text-primary">{org?.company_name}</h3>
                        {trustBadge}
                    </div>
                    {org?.domain && (
                        <p className="text-sm text-text-secondary flex items-center gap-1 mt-0.5">
                            <Globe size={12} /> {org.domain}
                        </p>
                    )}
                </div>
            </div>

            {!org?.is_verified && org?.registration_path === 'domain' && (
                <div className="mb-6 flex items-start gap-3 p-4 bg-primary-50 border border-primary-100 rounded-xl text-sm text-primary-800">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">Domain verification required</p>
                        <Link to="/hr/domain-verify" className="text-primary-600 font-semibold hover:underline">
                            Complete domain verification →
                        </Link>
                    </div>
                </div>
            )}

            {org?.is_verified && (
                <div className="mb-6 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                    <CheckCircle2 size={16} />
                    Your company is verified and trusted on JobsRow.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className={labelCls}>Company Name</label>
                    <input type="text" name="company_name" value={form.company_name} onChange={handleChange} required className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Website</label>
                    <input type="url" name="website" value={form.website} onChange={handleChange} required
                        placeholder="https://company.com" className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>LinkedIn URL</label>
                    <input type="url" name="linkedin_url" value={form.linkedin_url} onChange={handleChange}
                        placeholder="https://linkedin.com/company/…" className={inputCls} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className={labelCls}>Company Size</label>
                        <select name="company_size" value={form.company_size} onChange={handleChange} className={inputCls}>
                            <option value="">Select size</option>
                            {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Industry</label>
                        <input type="text" name="industry" value={form.industry} onChange={handleChange}
                            placeholder="e.g. Technology, Finance" className={inputCls} />
                    </div>
                </div>
                <SaveFeedback saving={saving} />
            </form>
        </SettingsCard>
    );
}

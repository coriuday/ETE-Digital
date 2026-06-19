/**
 * Job Filters — hide companies, job types, salary floor
 */
import { useState, useEffect } from 'react';
import { preferencesApi } from '../../api/preferences';
import { SettingsCard, SaveFeedback, inputCls, labelCls } from './settingsShared';
import { Loader2 } from 'lucide-react';

const JOB_TYPES = [
    { value: 'full_time', label: 'Full-time' },
    { value: 'part_time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'freelance', label: 'Freelance' },
];

export default function JobFiltersPage() {
    const [hiddenCompanies, setHiddenCompanies] = useState<string[]>([]);
    const [hiddenJobTypes, setHiddenJobTypes] = useState<string[]>([]);
    const [companyInput, setCompanyInput] = useState('');
    const [salaryMin, setSalaryMin] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const prefs = await preferencesApi.get();
                setHiddenCompanies(prefs.hidden_companies ?? []);
                setHiddenJobTypes(prefs.hidden_job_types ?? []);
                setSalaryMin(prefs.salary_min != null ? String(prefs.salary_min) : '');
            } catch {
                setError('Failed to load job filters.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const addCompany = () => {
        const c = companyInput.trim();
        if (c && !hiddenCompanies.includes(c)) {
            setHiddenCompanies(prev => [...prev, c]);
            setCompanyInput('');
        }
    };

    const toggleHiddenType = (type: string) => {
        setHiddenJobTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await preferencesApi.patch({
                hidden_companies: hiddenCompanies,
                hidden_job_types: hiddenJobTypes,
                salary_min: salaryMin ? parseInt(salaryMin, 10) : null,
            });
            setSuccess(true);
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            setError(detail || 'Failed to save job filters.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>;
    }

    return (
        <SettingsCard title="Job Filters" description="Hide jobs that don't match your criteria from search results.">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className={labelCls}>Hide Jobs from These Companies</label>
                    <div className="flex gap-2 mb-2">
                        <input type="text" value={companyInput} onChange={e => setCompanyInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCompany(); } }}
                            placeholder="Company name" className={inputCls} />
                        <button type="button" onClick={addCompany}
                            className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">
                            Add
                        </button>
                    </div>
                    {hiddenCompanies.length === 0 ? (
                        <p className="text-sm text-text-tertiary">No companies hidden.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {hiddenCompanies.map(c => (
                                <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">
                                    {c}
                                    <button type="button" onClick={() => setHiddenCompanies(prev => prev.filter(x => x !== c))}>×</button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label className={labelCls}>Hide These Job Types</label>
                    <div className="flex flex-wrap gap-2">
                        {JOB_TYPES.map(jt => (
                            <button
                                key={jt.value}
                                type="button"
                                onClick={() => toggleHiddenType(jt.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                    hiddenJobTypes.includes(jt.value)
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : 'bg-surface text-text-secondary border-border hover:border-red-200'
                                }`}
                            >
                                {jt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className={labelCls}>Minimum Salary Filter (INR / year)</label>
                    <input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)}
                        placeholder="Jobs below this salary will be hidden" className={inputCls} min="0" />
                </div>

                <SaveFeedback saving={saving} success={success} error={error} />
            </form>
        </SettingsCard>
    );
}

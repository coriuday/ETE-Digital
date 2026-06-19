/**
 * Job Preferences — remote, salary, locations, job types
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

export default function JobPreferencesPage() {
    const [remotePreferred, setRemotePreferred] = useState(false);
    const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>([]);
    const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
    const [locationInput, setLocationInput] = useState('');
    const [salaryMin, setSalaryMin] = useState('');
    const [salaryMax, setSalaryMax] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const prefs = await preferencesApi.get();
                setRemotePreferred(prefs.remote_preferred ?? false);
                setPreferredJobTypes(prefs.preferred_job_types ?? []);
                setPreferredLocations(prefs.preferred_locations ?? []);
                setSalaryMin(prefs.salary_min != null ? String(prefs.salary_min) : '');
                setSalaryMax(prefs.salary_max != null ? String(prefs.salary_max) : '');
            } catch {
                setError('Failed to load job preferences.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleJobType = (type: string) => {
        setPreferredJobTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const addLocation = () => {
        const loc = locationInput.trim();
        if (loc && !preferredLocations.includes(loc)) {
            setPreferredLocations(prev => [...prev, loc]);
            setLocationInput('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await preferencesApi.patch({
                remote_preferred: remotePreferred,
                preferred_job_types: preferredJobTypes,
                preferred_locations: preferredLocations,
                salary_min: salaryMin ? parseInt(salaryMin, 10) : null,
                salary_max: salaryMax ? parseInt(salaryMax, 10) : null,
            });
            setSuccess(true);
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            setError(detail || 'Failed to save job preferences.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>;
    }

    return (
        <SettingsCard title="Job Preferences" description="Tell us what roles and conditions you're looking for.">
            <form onSubmit={handleSubmit} className="space-y-6">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={remotePreferred}
                        onChange={e => setRemotePreferred(e.target.checked)}
                        className="w-4 h-4 accent-primary-600" />
                    <span className="text-sm font-medium text-text-primary">Prefer remote / hybrid roles</span>
                </label>

                <div>
                    <label className={labelCls}>Preferred Job Types</label>
                    <div className="flex flex-wrap gap-2">
                        {JOB_TYPES.map(jt => (
                            <button
                                key={jt.value}
                                type="button"
                                onClick={() => toggleJobType(jt.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                    preferredJobTypes.includes(jt.value)
                                        ? 'bg-primary-600 text-white border-primary-600'
                                        : 'bg-surface text-text-secondary border-border hover:border-primary-300'
                                }`}
                            >
                                {jt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className={labelCls}>Preferred Locations</label>
                    <div className="flex gap-2 mb-2">
                        <input type="text" value={locationInput} onChange={e => setLocationInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLocation(); } }}
                            placeholder="e.g. Mumbai, Bengaluru" className={inputCls} />
                        <button type="button" onClick={addLocation}
                            className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {preferredLocations.map(loc => (
                            <span key={loc} className="inline-flex items-center gap-1 px-2.5 py-1 bg-background rounded-full text-xs font-medium border border-border">
                                {loc}
                                <button type="button" onClick={() => setPreferredLocations(prev => prev.filter(l => l !== loc))}
                                    className="text-text-tertiary hover:text-error">×</button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Minimum Salary (INR / year)</label>
                        <input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)}
                            placeholder="e.g. 800000" className={inputCls} min="0" />
                    </div>
                    <div>
                        <label className={labelCls}>Maximum Salary (INR / year)</label>
                        <input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)}
                            placeholder="e.g. 1500000" className={inputCls} min="0" />
                    </div>
                </div>

                <SaveFeedback saving={saving} success={success} error={error} />
            </form>
        </SettingsCard>
    );
}

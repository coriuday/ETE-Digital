/**
 * Qualifications Settings — skills, experience, education, certifications
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import { preferencesApi, QualificationsData } from '../../api/preferences';
import { SettingsCard, SaveFeedback, inputCls, labelCls } from './settingsShared';
import { toastSuccess, toastError } from '../../utils/toast';
import { Loader2, Plus, X } from 'lucide-react';

const EXPERIENCE_OPTIONS = [
    { value: '', label: 'Select experience' },
    { value: '0-1', label: '0–1 years' },
    { value: '1-3', label: '1–3 years' },
    { value: '3-5', label: '3–5 years' },
    { value: '5-10', label: '5–10 years' },
    { value: '10+', label: '10+ years' },
];

export default function QualificationsPage() {
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [experienceYears, setExperienceYears] = useState('');
    const [education, setEducation] = useState<QualificationsData['education']>([]);
    const [certifications, setCertifications] = useState<QualificationsData['certifications']>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [meRes, prefs] = await Promise.all([
                    api.get('/api/users/me'),
                    preferencesApi.get(),
                ]);
                const p = meRes.data.profile || {};
                setSkills(p.skills || []);
                setExperienceYears(p.experience_years || '');
                const quals = prefs.qualifications || { education: [], certifications: [] };
                setEducation(quals.education?.length ? quals.education : [{ school: '', degree: '', year: '' }]);
                setCertifications(quals.certifications?.length ? quals.certifications : []);
            } catch {
                toastError('Failed to load qualifications.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const addSkill = () => {
        const s = skillInput.trim();
        if (s && !skills.includes(s)) {
            setSkills(prev => [...prev, s]);
            setSkillInput('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await Promise.all([
                api.patch('/api/users/profile', {
                    skills,
                    experience_years: experienceYears || null,
                }),
                preferencesApi.patch({
                    qualifications: {
                        education: education.filter(e => e.school || e.degree),
                        certifications: certifications.filter(c => c.name),
                    },
                }),
            ]);
            toastSuccess('Qualifications saved');
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toastError(typeof detail === 'string' ? detail : 'Failed to save qualifications.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>;
    }

    return (
        <SettingsCard title="Qualifications" description="Highlight your skills, experience, and credentials.">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Skills */}
                <div>
                    <label className={labelCls}>Skills</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={skillInput}
                            onChange={e => setSkillInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                            placeholder="Add a skill and press Enter"
                            className={inputCls}
                        />
                        <button type="button" onClick={addSkill}
                            className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {skills.map(s => (
                            <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium border border-primary-200">
                                {s}
                                <button type="button" onClick={() => setSkills(prev => prev.filter(x => x !== s))}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Experience */}
                <div>
                    <label className={labelCls}>Years of Experience</label>
                    <select value={experienceYears} onChange={e => setExperienceYears(e.target.value)} className={inputCls}>
                        {EXPERIENCE_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                {/* Education */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className={labelCls + ' mb-0'}>Education</label>
                        <button type="button" onClick={() => setEducation(prev => [...prev, { school: '', degree: '', year: '' }])}
                            className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add
                        </button>
                    </div>
                    <div className="space-y-3">
                        {education.map((row, i) => (
                            <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-background rounded-lg border border-border">
                                <input placeholder="School / University" value={row.school}
                                    onChange={e => { const n = [...education]; n[i] = { ...n[i], school: e.target.value }; setEducation(n); }}
                                    className={inputCls} />
                                <input placeholder="Degree" value={row.degree}
                                    onChange={e => { const n = [...education]; n[i] = { ...n[i], degree: e.target.value }; setEducation(n); }}
                                    className={inputCls} />
                                <input placeholder="Year" value={row.year}
                                    onChange={e => { const n = [...education]; n[i] = { ...n[i], year: e.target.value }; setEducation(n); }}
                                    className={inputCls} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Certifications */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className={labelCls + ' mb-0'}>Certifications</label>
                        <button type="button" onClick={() => setCertifications(prev => [...prev, { name: '', issuer: '', year: '' }])}
                            className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add
                        </button>
                    </div>
                    {certifications.length === 0 ? (
                        <p className="text-sm text-text-tertiary">No certifications added yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {certifications.map((row, i) => (
                                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-background rounded-lg border border-border">
                                    <input placeholder="Certification name" value={row.name}
                                        onChange={e => { const n = [...certifications]; n[i] = { ...n[i], name: e.target.value }; setCertifications(n); }}
                                        className={inputCls} />
                                    <input placeholder="Issuer" value={row.issuer}
                                        onChange={e => { const n = [...certifications]; n[i] = { ...n[i], issuer: e.target.value }; setCertifications(n); }}
                                        className={inputCls} />
                                    <input placeholder="Year" value={row.year}
                                        onChange={e => { const n = [...certifications]; n[i] = { ...n[i], year: e.target.value }; setCertifications(n); }}
                                        className={inputCls} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <SaveFeedback saving={saving} />
            </form>
        </SettingsCard>
    );
}

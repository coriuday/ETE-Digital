/**
 * Create Job Page — Premium multi-section form with AppShell sidebar
 * Employer-facing: post a new job with salary validation + dark-mode support
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toastError } from '../../utils/toast';
import { jobsApi } from '../../api/jobs';

import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import { hrPageCls } from './hrShared';
import {
    Briefcase, MapPin, DollarSign, Code, Users,
    CheckCircle2, AlertCircle, Loader2, ChevronRight,
    Zap, Globe, X, Plus, ExternalLink,
} from 'lucide-react';

const JOB_TYPES = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
];

const CURRENCIES = [
    { value: 'INR', label: '₹ INR' },
    { value: 'USD', label: '$ USD' },
    { value: 'EUR', label: '€ EUR' },
    { value: 'GBP', label: '£ GBP' },
];

const EXPERIENCE_LEVELS = [
    'Entry Level (0-1 years)',
    'Junior Level (1-3 years)',
    'Mid Level (3-5 years)',
    'Senior Level (4-7 years)',
    'Staff / Lead (7-10 years)',
    'Principal / Architect (10+ years)',
];

export default function CreateJobPage() {
    const navigate = useNavigate();
    const { jobId } = useParams<{ jobId?: string }>();
    const isEditMode = Boolean(jobId);

    const [loading, setLoading] = useState(false);
    const [loadingJob, setLoadingJob] = useState(isEditMode);
    const [error, setError] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [skills, setSkills] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        company: '',
        description: '',
        requirements: '',
        job_type: 'full_time',
        location: '',
        remote_ok: false,
        salary_min: '',
        salary_max: '',
        salary_currency: 'INR',
        experience_required: '',
        has_tryout: false,
        external_apply_url: '',
    });

    const inputCls = `w-full px-3 py-2.5 border border-border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500 focus:border-primary-400 bg-surface text-text-primary placeholder:text-text-tertiary`;
    const labelCls = `block text-sm font-medium mb-1.5 text-text-primary`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        setError('');
    };

    const addSkill = () => {
        const trimmed = skillInput.trim();
        if (trimmed && !skills.includes(trimmed)) {
            setSkills(prev => [...prev, trimmed]);
        }
        setSkillInput('');
    };

    const removeSkill = (skill: string) => setSkills(prev => prev.filter(s => s !== skill));

    const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addSkill();
        }
    };

    useEffect(() => {
        if (!jobId) return;
        let cancelled = false;
        (async () => {
            setLoadingJob(true);
            try {
                const job = await jobsApi.getJob(jobId);
                if (cancelled) return;
                setFormData({
                    title: job.title,
                    company: job.company,
                    description: job.description,
                    requirements: job.requirements,
                    job_type: job.job_type,
                    location: job.location ?? '',
                    remote_ok: job.remote_ok,
                    salary_min: job.salary_min != null ? String(job.salary_min) : '',
                    salary_max: job.salary_max != null ? String(job.salary_max) : '',
                    salary_currency: job.salary_currency || 'INR',
                    experience_required: job.experience_required ?? '',
                    has_tryout: job.has_tryout,
                    external_apply_url: job.external_apply_url ?? '',
                });
                setSkills(job.skills_required ?? []);
            } catch {
                if (!cancelled) {
                    toastError('Job not found or you do not have access.');
                    navigate('/hr/jobs');
                }
            } finally {
                if (!cancelled) setLoadingJob(false);
            }
        })();
        return () => { cancelled = true; };
    }, [jobId, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const salaryMin = formData.salary_min ? parseInt(formData.salary_min) : null;
        const salaryMax = formData.salary_max ? parseInt(formData.salary_max) : null;

        // Client-side salary validation
        if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
            setError('Minimum salary cannot be greater than maximum salary. Please check your salary range.');
            return;
        }

        setLoading(true);
        try {
            const jobData: Record<string, unknown> = {
                title: formData.title,
                company: formData.company,
                description: formData.description,
                requirements: formData.requirements,
                job_type: formData.job_type,
                remote_ok: formData.remote_ok,
                salary_currency: formData.salary_currency,
                has_tryout: formData.has_tryout,
                skills_required: skills,
            };

            // Only include optional fields if they have values
            if (formData.location.trim()) jobData.location = formData.location.trim();
            if (salaryMin !== null) jobData.salary_min = salaryMin;
            if (salaryMax !== null) jobData.salary_max = salaryMax;
            if (isEditMode && salaryMin === null && salaryMax === null) {
                jobData.salary_min = null;
                jobData.salary_max = null;
            }
            if (formData.experience_required) jobData.experience_required = formData.experience_required;
            if (formData.external_apply_url.trim()) jobData.external_apply_url = formData.external_apply_url.trim();

            if (isEditMode && jobId) {
                await jobsApi.updateJob(jobId, jobData);
            } else {
                await jobsApi.createJob(jobData);
            }
            navigate('/hr/jobs');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const msg = Array.isArray(detail)
                ? detail.map((d: any) => d.msg || d).join(', ')
                : detail || err.message || (isEditMode ? 'Failed to update job. Please try again.' : 'Failed to post job. Please try again.');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppShell>
            <div className={`${hrPageCls} max-w-4xl`}>
                <PageHeader
                    title={isEditMode ? 'Edit Job' : 'Post a New Job'}
                    description={isEditMode ? 'Update job details and save changes' : 'Fill in the details to attract the right candidates'}
                />

                {loadingJob ? (
                    <div className="flex items-center justify-center py-24 text-text-secondary">
                        <Loader2 size={24} className="animate-spin mr-2" /> Loading job…
                    </div>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Error Banner */}
                        {error && (
                            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Section 1 — Basic Info */}
                        <SectionCard title="Basic Information" icon={<Briefcase size={16} />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Job Title <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" name="title" value={formData.title} onChange={handleChange} required
                                        className={inputCls} placeholder="e.g. Senior Frontend Developer"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Company Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" name="company" value={formData.company} onChange={handleChange} required
                                        className={inputCls} placeholder="e.g. TechCorp Inc."
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Job Type <span className="text-red-500">*</span></label>
                                    <select name="job_type" value={formData.job_type} onChange={handleChange} className={inputCls}>
                                        {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Experience Level</label>
                                    <select name="experience_required" value={formData.experience_required} onChange={handleChange} className={inputCls}>
                                        <option value="">Select experience level</option>
                                        {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Location row */}
                            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                                <div>
                                    <label className={labelCls}><MapPin size={13} className="inline mr-1" />Location</label>
                                    <input
                                        type="text" name="location" value={formData.location} onChange={handleChange}
                                        className={inputCls} placeholder="e.g. Bengaluru, India"
                                    />
                                </div>
                                <div className="flex items-center gap-4 pt-5">
                                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                        <div
                                            onClick={() => setFormData(p => ({ ...p, remote_ok: !p.remote_ok }))}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${formData.remote_ok ? 'bg-primary-600' : 'bg-gray-300'}`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-surface shadow transition-transform ${formData.remote_ok ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </div>
                                        <span className="text-sm font-medium text-text-primary">
                                            <Globe size={13} className="inline mr-1" />Remote OK
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Section 2 — Description */}
                        <SectionCard title="Job Description" icon={<Code size={16} />}>
                            <div className="space-y-5">
                                <div>
                                    <label className={labelCls}>Description <span className="text-red-500">*</span></label>
                                    <textarea
                                        name="description" value={formData.description} onChange={handleChange} required rows={6}
                                        className={inputCls} placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Requirements <span className="text-red-500">*</span></label>
                                    <textarea
                                        name="requirements" value={formData.requirements} onChange={handleChange} required rows={5}
                                        className={inputCls} placeholder="List required qualifications, skills, experience, and educational background..."
                                    />
                                </div>
                            </div>
                        </SectionCard>

                        {/* Section 3 — Skills */}
                        <SectionCard title="Required Skills" icon={<Users size={16} />}>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text" value={skillInput}
                                    onChange={e => setSkillInput(e.target.value)}
                                    onKeyDown={handleSkillKeyDown}
                                    className={inputCls}
                                    placeholder="Type a skill and press Enter or comma (e.g. React, TypeScript)"
                                />
                                <button
                                    type="button" onClick={addSkill}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors flex-shrink-0"
                                >
                                    <Plus size={15} /> Add
                                </button>
                            </div>
                            {skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {skills.map(skill => (
                                        <span key={skill} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium border ${
                                            'bg-primary-50 border-primary-200 text-primary-700'
                                        }`}>
                                            {skill}
                                            <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                                                <X size={13} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            {skills.length === 0 && (
                                <p className="text-xs mt-2 text-text-tertiary">No skills added yet. Add skills to help match better candidates.</p>
                            )}
                        </SectionCard>

                        {/* Section 4 — Compensation */}
                        <SectionCard title="Salary" icon={<DollarSign size={16} />}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className={labelCls}>Currency</label>
                                    <select name="salary_currency" value={formData.salary_currency} onChange={handleChange} className={inputCls}>
                                        {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Min Salary <span className="text-xs font-normal text-text-tertiary">(per year)</span></label>
                                    <input
                                        type="number" name="salary_min" value={formData.salary_min} onChange={handleChange}
                                        className={inputCls} placeholder="e.g. 500000" min="0"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Max Salary <span className="text-xs font-normal text-text-tertiary">(per year)</span></label>
                                    <input
                                        type="number" name="salary_max" value={formData.salary_max} onChange={handleChange}
                                        className={inputCls} placeholder="e.g. 1200000" min="0"
                                    />
                                </div>
                            </div>
                            {formData.salary_min && formData.salary_max && parseInt(formData.salary_min) > parseInt(formData.salary_max) && (
                                <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5">
                                    <AlertCircle size={13} /> Min salary cannot be greater than max salary
                                </p>
                            )}
                            <p className="text-xs mt-3 text-text-tertiary">
                                Leave both fields empty to post as &quot;Salary not disclosed&quot;. Transparent salaries attract 3× more applicants.
                            </p>
                        </SectionCard>

                        {/* Section 5.5 — External Application URL */}
                        <SectionCard title="External Application Link" icon={<ExternalLink size={16} />}>
                            <div className="space-y-3">
                                <div>
                                    <label className={labelCls}>Company Application URL <span className="text-xs font-normal text-text-tertiary">(optional)</span></label>
                                    <input
                                        type="url" name="external_apply_url" value={formData.external_apply_url} onChange={handleChange}
                                        className={inputCls} placeholder="https://careers.yourcompany.com/apply/job-id"
                                    />
                                </div>
                                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
                                    <ExternalLink size={14} className="mt-0.5 flex-shrink-0 text-amber-600" />
                                    <p className="text-xs leading-relaxed text-amber-700">
                                        If provided, candidates clicking "Apply" will be redirected to your company's application page instead of applying through Jobsrow. Leave empty to use Jobsrow's built-in application form.
                                    </p>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Section 6 — Trial Task */}
                        <SectionCard title="Trial Task (Tryout)" icon={<Zap size={16} />}>
                            <div className="flex items-start gap-4">
                                <div
                                    onClick={() => setFormData(p => ({ ...p, has_tryout: !p.has_tryout }))}
                                    className={`relative inline-flex h-6 w-11 mt-0.5 items-center rounded-full transition-colors cursor-pointer flex-shrink-0 ${formData.has_tryout ? 'bg-primary-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-surface shadow transition-transform ${formData.has_tryout ? 'translate-x-6' : 'translate-x-1'}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">
                                        Include a paid trial task
                                    </p>
                                    <p className="text-xs mt-1 text-text-tertiary">
                                        Candidates complete a real work sample before the interview. You'll set up the tryout details after posting the job.
                                    </p>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Actions */}
                        <div className={`flex items-center justify-between gap-4 pt-2`}>
                            <button
                                type="button" onClick={() => navigate('/hr/jobs')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                    'bg-gray-100 text-text-primary hover:bg-gray-200'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit" disabled={loading}
                                className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-primary-600 to-primary-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary-500/20"
                            >
                                {loading
                                    ? <><Loader2 size={16} className="animate-spin" /> {isEditMode ? 'Saving…' : 'Posting…'}</>
                                    : <><CheckCircle2 size={16} /> {isEditMode ? 'Save Changes' : 'Post Job'}</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </AppShell>
    );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    const cardBg = 'bg-surface border-border';
    return (
        <div className={`rounded-2xl border p-6 ${cardBg}`}>
            <div className="flex items-center gap-2 mb-5">
                <span className="text-primary-600">{icon}</span>
                <h2 className="text-base font-bold text-text-primary">{title}</h2>
                <ChevronRight size={14} className="text-gray-300" />
            </div>
            {children}
        </div>
    );
}

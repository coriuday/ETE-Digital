/**
 * OnboardingWizard — Task 1.3
 * 5-step profile wizard shown to new users after first login.
 *
 * Steps:
 *  1. Name + Headline
 *  2. Location + Bio
 *  3. Skills (tag input, ≥ 1 required)
 *  4. Years of Experience
 *  5. Resume Upload  (optional — can skip)
 *
 * On completion: calls POST /api/users/me/onboarding-complete then
 * navigates to /dashboard (candidates) or /hr/dashboard (HR).
 */
import { useState, useRef, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import api from '../../api/client';
import {
    User, MapPin, Zap, Briefcase, FileText,
    ArrowRight, ArrowLeft, CheckCircle2, X,
    Loader2, UploadCloud, Sparkles,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface WizardData {
    full_name: string;
    headline: string;
    location: string;
    bio: string;
    skills: string[];
    experience_years: string;
    resume_file: File | null;
}

// ── Step definitions ───────────────────────────────────────────────────────────
const STEPS = [
    { icon: <User size={20} />,      title: 'Your Identity',      sub: 'How should we introduce you?' },
    { icon: <MapPin size={20} />,    title: 'Where You Are',      sub: 'Location and a quick bio' },
    { icon: <Zap size={20} />,       title: 'Your Skills',        sub: 'Add at least 1 skill' },
    { icon: <Briefcase size={20} />, title: 'Experience',         sub: 'Your professional journey' },
    { icon: <FileText size={20} />,  title: 'Resume',             sub: 'Upload to auto-fill future applications' },
];

const EXPERIENCE_OPTIONS = [
    'Student / Fresher',
    '< 1 year',
    '1–2 years',
    '3–5 years',
    '6–9 years',
    '10+ years',
];

// ── Input helpers ──────────────────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all placeholder:text-gray-400';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1.5';

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                        i <= current ? 'bg-violet-600' : 'bg-gray-200'
                    }`}
                />
            ))}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function OnboardingWizard() {
    const navigate = useNavigate();
    const { user, fetchUser } = useAuthStore();

    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const skillRef = useRef<HTMLInputElement>(null);

    const [data, setData] = useState<WizardData>({
        full_name:        user?.profile?.full_name ?? user?.full_name ?? '',
        headline:         user?.profile?.headline ?? '',
        location:         user?.profile?.location ?? '',
        bio:              user?.profile?.bio ?? '',
        skills:           user?.profile?.skills ?? [],
        experience_years: user?.profile?.experience_years ?? '',
        resume_file:      null,
    });

    // ── Field helpers ──────────────────────────────────────────────────────────
    const set = (field: keyof WizardData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setData(prev => ({ ...prev, [field]: e.target.value }));

    // ── Skill tag helpers ──────────────────────────────────────────────────────
    const addSkill = () => {
        const s = skillInput.trim();
        if (s && !data.skills.includes(s)) {
            setData(prev => ({ ...prev, skills: [...prev.skills, s] }));
        }
        setSkillInput('');
    };

    const removeSkill = (skill: string) =>
        setData(prev => ({ ...prev, skills: prev.skills.filter(sk => sk !== skill) }));

    const onSkillKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); }
        if (e.key === 'Backspace' && !skillInput && data.skills.length)
            removeSkill(data.skills[data.skills.length - 1]);
    };

    // ── Validation per step ────────────────────────────────────────────────────
    const validate = (): boolean => {
        setError('');
        if (step === 0 && !data.full_name.trim()) { setError('Full name is required.'); return false; }
        if (step === 2 && data.skills.length === 0) { setError('Add at least one skill.'); return false; }
        return true;
    };

    const next = () => { if (validate()) setStep(s => Math.min(s + 1, STEPS.length - 1)); };
    const prev = () => { setError(''); setStep(s => Math.max(s - 1, 0)); };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleFinish = async () => {
        if (!validate()) return;
        setSaving(true);
        setError('');
        try {
            // 1. Upload resume if provided
            if (data.resume_file) {
                const form = new FormData();
                form.append('file', data.resume_file);
                await api.post('/api/users/me/resume', form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            // 2. Mark onboarding complete + save profile data
            await api.post('/api/users/me/onboarding-complete', {
                full_name:        data.full_name,
                headline:         data.headline,
                location:         data.location,
                bio:              data.bio,
                skills:           data.skills,
                experience_years: data.experience_years,
            });

            // 3. Refresh user in store so the gate doesn't re-trigger
            await fetchUser();

            // 4. Navigate to role home
            const role = user?.role;
            navigate(role === 'employer' ? '/hr/dashboard' : '/dashboard', { replace: true });
        } catch (err: any) {
            setError(err?.response?.data?.detail ?? 'Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ── Skip (for resume step only) ────────────────────────────────────────────
    const handleSkip = () => handleFinish();

    // ── Step content ───────────────────────────────────────────────────────────
    const stepContent = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-5">
                        <div>
                            <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                            <input
                                id="onboarding-name"
                                type="text"
                                value={data.full_name}
                                onChange={set('full_name')}
                                className={inputCls}
                                placeholder="e.g. Priya Mehta"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Professional Headline</label>
                            <input
                                id="onboarding-headline"
                                type="text"
                                value={data.headline}
                                onChange={set('headline')}
                                className={inputCls}
                                placeholder="e.g. Full Stack Developer · Open to Work"
                                maxLength={150}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {data.headline.length}/150 — this appears below your name everywhere
                            </p>
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-5">
                        <div>
                            <label className={labelCls}>Location</label>
                            <input
                                id="onboarding-location"
                                type="text"
                                value={data.location}
                                onChange={set('location')}
                                className={inputCls}
                                placeholder="e.g. Mumbai, India"
                            />
                        </div>
                        <div>
                            <label className={labelCls}>About You</label>
                            <textarea
                                id="onboarding-bio"
                                value={data.bio}
                                onChange={set('bio')}
                                rows={4}
                                className={inputCls + ' resize-none'}
                                placeholder="A brief description of who you are, what you do, and what you're looking for..."
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-400 mt-1">{data.bio.length}/500</p>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Skills <span className="text-red-500">*</span></label>
                            {/* Tag container */}
                            <div
                                className="min-h-[52px] w-full px-3 py-2 rounded-xl border border-gray-200 bg-white flex flex-wrap gap-2 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all cursor-text"
                                onClick={() => skillRef.current?.focus()}
                            >
                                {data.skills.map(sk => (
                                    <span key={sk} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">
                                        {sk}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeSkill(sk); }}
                                            className="ml-0.5 hover:text-red-500 transition-colors"
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    ref={skillRef}
                                    id="onboarding-skill-input"
                                    type="text"
                                    value={skillInput}
                                    onChange={e => setSkillInput(e.target.value)}
                                    onKeyDown={onSkillKey}
                                    onBlur={addSkill}
                                    className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder:text-gray-400"
                                    placeholder={data.skills.length === 0 ? 'Type a skill and press Enter…' : 'Add more…'}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Enter</kbd> or <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">,</kbd> to add · Backspace to remove
                            </p>
                        </div>

                        {/* Popular suggestions */}
                        {data.skills.length < 5 && (
                            <div>
                                <p className="text-xs text-gray-400 mb-2">Popular skills:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {['Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Java', 'AWS', 'Docker', 'Communication', 'Leadership']
                                        .filter(s => !data.skills.includes(s))
                                        .map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setData(prev => ({ ...prev, skills: [...prev.skills, s] }))}
                                                className="px-2.5 py-1 text-xs bg-gray-50 border border-gray-200 text-gray-600 rounded-full hover:border-violet-400 hover:text-violet-600 transition-colors"
                                            >
                                                + {s}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Years of Experience</label>
                            <div className="grid grid-cols-2 gap-2">
                                {EXPERIENCE_OPTIONS.map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setData(prev => ({ ...prev, experience_years: opt }))}
                                        className={`py-3 px-4 rounded-xl text-sm font-semibold border text-left transition-all ${
                                            data.experience_years === opt
                                                ? 'bg-violet-50 border-violet-500 text-violet-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-4">
                        <label
                            htmlFor="onboarding-resume"
                            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${
                                data.resume_file
                                    ? 'border-violet-400 bg-violet-50'
                                    : 'border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/30'
                            }`}
                        >
                            {data.resume_file ? (
                                <>
                                    <CheckCircle2 size={32} className="text-violet-600" />
                                    <p className="text-sm font-semibold text-violet-700">{data.resume_file.name}</p>
                                    <p className="text-xs text-gray-400">{(data.resume_file.size / 1024).toFixed(0)} KB · Click to change</p>
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={32} className="text-gray-300" />
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-gray-600">Drop your resume here</p>
                                        <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, DOCX — max 5 MB</p>
                                    </div>
                                </>
                            )}
                            <input
                                id="onboarding-resume"
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                                onChange={e => setData(prev => ({ ...prev, resume_file: e.target.files?.[0] ?? null }))}
                            />
                        </label>
                        <p className="text-xs text-center text-gray-400">
                            You can always upload later from your settings. Tap <strong>Skip</strong> to continue.
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
            {/* Background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

            <div className="relative w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5 border border-white/10">
                        <Sparkles size={13} className="text-violet-300" />
                        <span className="text-xs font-semibold text-violet-200">Setting up your profile</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
                        Welcome to JobsRow
                    </h1>
                    <p className="text-violet-300 text-sm mt-2">Takes less than 2 minutes. You can update everything later.</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Progress bar */}
                    <div className="px-8 pt-6 pb-0">
                        <ProgressBar current={step} total={STEPS.length} />
                    </div>

                    {/* Step header */}
                    <div className="px-8 pt-5 pb-1 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0">
                            {STEPS[step].icon}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest">
                                Step {step + 1} of {STEPS.length}
                            </p>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">{STEPS[step].title}</h2>
                            <p className="text-sm text-gray-400">{STEPS[step].sub}</p>
                        </div>
                    </div>

                    {/* Step body */}
                    <div className="px-8 py-6">
                        {stepContent()}

                        {/* Error */}
                        {error && (
                            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Footer actions */}
                    <div className="px-8 pb-7 flex items-center justify-between gap-3">
                        {step > 0 ? (
                            <button
                                type="button"
                                onClick={prev}
                                className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <ArrowLeft size={15} /> Back
                            </button>
                        ) : (
                            <span />
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                            {/* Skip (resume step only) */}
                            {step === STEPS.length - 1 && (
                                <button
                                    type="button"
                                    onClick={handleSkip}
                                    disabled={saving}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    Skip for now
                                </button>
                            )}

                            {/* Next / Finish */}
                            {step < STEPS.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={next}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}
                                >
                                    Continue <ArrowRight size={15} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleFinish}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}
                                >
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><CheckCircle2 size={15} /> Finish Setup</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Step dots */}
                <div className="flex justify-center gap-2 mt-6">
                    {STEPS.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === step ? 'bg-white scale-125' : 'bg-white/30'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

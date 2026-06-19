/**
 * Application Details Page — HR reviews a single candidate application
 */
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import { hrPageCls, cardCls } from './hrShared';
import { jobsApi, ApplicationDetail } from '../../api/jobs';
import { toastSuccess, toastError } from '../../utils/toast';
import {
    ACTION_CONFIG,
    ACTION_STYLES,
    buildTimelineFromHistory,
    stageLabel,
    StatusHistoryEntry,
} from '../../constants/applicationPipeline';
import {
    Mail, MapPin, FileText,
    CheckCircle2, XCircle, Clock, Star, Copy,
    ExternalLink, Loader2, ChevronRight, MessageSquare,
    Sparkles, TrendingUp, AlertCircle, Info, User,
} from 'lucide-react';

function buildMailtoUrl(email: string, jobTitle: string): string {
    const subject = encodeURIComponent(`Re: Your application for ${jobTitle}`);
    const body = encodeURIComponent(
        `Hi,\n\nThank you for applying for the ${jobTitle} position via JobsRow.\n\n\nBest regards,`
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
}

function MatchGauge({ score }: { score: number }) {
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : '#f59e0b';
    const r = 42, cx = 52, cy = 52, circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <div className="flex items-center gap-4">
            <div className="relative w-[104px] h-[104px] flex-shrink-0">
                <svg viewBox="0 0 104 104" className="w-full h-full -rotate-90">
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border, #e5e7eb)" strokeWidth={10} />
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
                        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-extrabold" style={{ color }}>{score}<span className="text-sm font-semibold">%</span></span>
                </div>
            </div>
            <div>
                <p className="font-bold text-text-primary">Match Score</p>
                <p className="text-xs text-text-tertiary mt-0.5">{score >= 80 ? 'Excellent fit' : score >= 60 ? 'Good match' : 'Partial match'}</p>
                <div className="flex gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} className={i < Math.round(score / 20) ? 'fill-amber-400 text-amber-400' : 'text-border'} />
                    ))}
                </div>
            </div>
        </div>
    );
}

const STATUS_CLS: Record<string, string> = {
    pending: 'bg-blue-50 text-blue-700 border-blue-200',
    reviewed: 'bg-amber-50 text-amber-700 border-amber-200',
    shortlisted: 'bg-violet-50 text-violet-700 border-violet-200',
    hired: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    withdrawn: 'bg-background text-text-tertiary border-border',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
    shortlisted: <Star size={15} className="fill-violet-400 text-violet-400" />,
    reviewed: <Clock size={15} />,
    hired: <CheckCircle2 size={15} />,
    rejected: <XCircle size={15} />,
};

function TimelineStep({ label, date, active, last }: { label: string; date?: string; active: boolean; last?: boolean }) {
    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'bg-primary-600 border-primary-600' : 'bg-surface border-border'}`}>
                    {active && <CheckCircle2 size={14} className="text-white" />}
                </div>
                {!last && <div className="w-0.5 flex-1 bg-border my-1" />}
            </div>
            <div className="pb-5">
                <p className={`text-sm font-semibold ${active ? 'text-text-primary' : 'text-text-tertiary'}`}>{label}</p>
                {date && <p className="text-xs text-text-tertiary mt-0.5">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>}
            </div>
        </div>
    );
}

export default function ApplicationDetailsPage() {
    const { applicationId } = useParams<{ applicationId: string }>();
    const navigate = useNavigate();
    const [notes, setNotes] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);
    const [appData, setAppData] = useState<ApplicationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!applicationId) return;
        (async () => {
            try {
                const data = await jobsApi.getApplicationDetail(applicationId);
                setAppData(data);
                setNotes(data.employer_notes || '');
            } catch {
                setError('Failed to load application details.');
            } finally {
                setLoading(false);
            }
        })();
    }, [applicationId]);

    const mailtoUrl = useMemo(() => {
        if (!appData?.candidate_email) return '';
        return buildMailtoUrl(appData.candidate_email, appData.job_title || 'this role');
    }, [appData?.candidate_email, appData?.job_title]);

    const handleAction = async (newStatus: string) => {
        if (!applicationId || appData?.is_locked) return;
        setUpdating(newStatus);
        try {
            const data = await jobsApi.updateApplicationStatus(applicationId, newStatus, notes);
            setAppData(data);
            setNotes(data.employer_notes || notes);
            toastSuccess(`Moved to ${stageLabel(newStatus)}`);
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toastError(typeof detail === 'string' ? detail : 'Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    const handleCopyEmail = async () => {
        if (!appData?.candidate_email) return;
        try {
            await navigator.clipboard.writeText(appData.candidate_email);
            toastSuccess('Email copied to clipboard');
        } catch {
            toastError('Could not copy email');
        }
    };

    if (loading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center py-32">
                    <Loader2 size={32} className="animate-spin text-primary-500" />
                </div>
            </AppShell>
        );
    }

    if (error || !appData) {
        return (
            <AppShell>
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <p className="text-text-secondary">{error || 'Application not found.'}</p>
                    <button onClick={() => navigate(-1)} className="text-primary-600 underline text-sm">Go back</button>
                </div>
            </AppShell>
        );
    }

    const app = appData;
    const currentStatus = app.status?.toLowerCase?.() ?? 'pending';
    const availableActions: string[] = app.available_actions ?? [];
    const timelineSteps = buildTimelineFromHistory((app.status_history ?? []) as StatusHistoryEntry[]);
    const skills: string[] = app.candidate_skills ?? [];
    const matchExplanation = app.match_explanation as Record<string, unknown> | null;

    return (
        <AppShell>
            <div className="bg-background min-h-full">
                <div className={`${hrPageCls} pb-4`}>
                    <PageHeader
                        title={app.candidate_name || 'Application'}
                        description={`Applied for ${app.job_title} · ${new Date(app.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                        breadcrumbs={[
                            { label: 'Applications', href: '/hr/applications' },
                            { label: app.candidate_name || 'Details' },
                        ]}
                    />
                    <div className={`${cardCls} p-5 flex flex-wrap items-center justify-between gap-4`}>
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${STATUS_CLS[currentStatus] ?? 'bg-background text-text-secondary border-border'}`}>
                                {stageLabel(currentStatus)}
                            </span>
                        </div>
                        <MatchGauge score={app.match_score ?? 0} />
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 pb-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        {/* Profile card */}
                        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                            <h2 className="font-bold text-text-primary text-lg mb-4">Candidate Profile</h2>
                            <div className="flex flex-wrap items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center text-2xl font-extrabold text-primary-700 flex-shrink-0">
                                    {(app.candidate_name || 'U')[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-text-primary">{app.candidate_name}</p>
                                    {app.candidate_headline && (
                                        <p className="text-sm text-text-secondary mt-0.5">{app.candidate_headline}</p>
                                    )}
                                    <p className="text-sm text-text-tertiary mt-1 flex items-center gap-1.5">
                                        <Mail size={12} /> {app.candidate_email}
                                    </p>
                                    {app.candidate_location && (
                                        <p className="text-sm text-text-tertiary mt-0.5 flex items-center gap-1.5">
                                            <MapPin size={12} /> {app.candidate_location}
                                        </p>
                                    )}
                                    {skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {skills.slice(0, 6).map(skill => (
                                                <span key={skill} className="px-2 py-0.5 text-xs font-medium bg-primary-50 text-primary-700 rounded-md border border-primary-100">
                                                    {skill}
                                                </span>
                                            ))}
                                            {skills.length > 6 && (
                                                <span className="text-xs text-text-tertiary self-center">+{skills.length - 6} more</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2 ml-auto">
                                    <Link
                                        to={`/hr/applications/${applicationId}/candidate`}
                                        className="text-xs font-semibold text-primary-600 flex items-center gap-1 border border-primary-100 bg-primary-50 px-3 py-1.5 rounded-xl hover:bg-primary-100 transition-colors"
                                    >
                                        <User size={12} /> View Profile
                                    </Link>
                                    {app.vault_share_token && (
                                        <a
                                            href={`/shared/${app.vault_share_token}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-semibold text-violet-600 flex items-center gap-1 border border-violet-100 bg-violet-50 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition-colors"
                                        >
                                            Portfolio <ExternalLink size={11} />
                                        </a>
                                    )}
                                    {app.candidate_resume_url && (
                                        <a
                                            href={app.candidate_resume_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-semibold text-emerald-700 flex items-center gap-1 border border-emerald-100 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                                        >
                                            <FileText size={12} /> Resume
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Cover Letter */}
                        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                            <h2 className="font-bold text-text-primary text-lg mb-4 flex items-center gap-2">
                                <MessageSquare size={18} className="text-text-tertiary" /> Cover Letter
                            </h2>
                            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                                {app.cover_letter || <span className="text-text-tertiary italic">No cover letter provided.</span>}
                            </p>
                        </div>

                        {matchExplanation && (
                            <div className="bg-gradient-to-br from-violet-50 via-white to-blue-50 rounded-2xl border border-violet-100 p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                        <Sparkles size={16} className="text-violet-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-text-primary text-base leading-tight">AI Match Analysis</h2>
                                        <p className="text-xs text-text-tertiary">Powered by Gemini Flash</p>
                                    </div>
                                    <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                                        {app.match_score ?? 0}% match
                                    </span>
                                </div>

                                {typeof matchExplanation.llm_summary === 'string' && matchExplanation.llm_summary && (
                                    <div className="mb-5 p-4 bg-white/80 rounded-xl border border-violet-100 text-sm text-text-secondary leading-relaxed">
                                        <Info size={13} className="inline-block text-violet-400 mr-1.5 -mt-0.5" />
                                        {matchExplanation.llm_summary}
                                    </div>
                                )}

                                {(() => {
                                    const scores = [
                                        { label: 'Skills', value: matchExplanation.skill_score as number | undefined, color: 'bg-violet-500' },
                                        { label: 'Experience', value: matchExplanation.experience_score as number | undefined, color: 'bg-blue-500' },
                                        { label: 'Location', value: matchExplanation.location_score as number | undefined, color: 'bg-emerald-500' },
                                        { label: 'Salary Fit', value: matchExplanation.salary_score as number | undefined, color: 'bg-amber-500' },
                                    ].filter(s => s.value != null);
                                    if (!scores.length) return null;
                                    return (
                                        <div className="space-y-2.5 mb-5">
                                            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide flex items-center gap-1.5">
                                                <TrendingUp size={11} /> Score Breakdown
                                            </p>
                                            {scores.map(({ label, value, color }) => (
                                                <div key={label}>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-text-secondary font-medium">{label}</span>
                                                        <span className="font-bold text-text-primary">{Math.round(value as number)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {Array.isArray(matchExplanation.matched_skills) && matchExplanation.matched_skills.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                                            <CheckCircle2 size={11} /> Matched Skills
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(matchExplanation.matched_skills as string[]).map(skill => (
                                                <span key={skill} className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {Array.isArray(matchExplanation.missing_skills) && matchExplanation.missing_skills.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                            <AlertCircle size={11} /> Skill Gaps
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(matchExplanation.missing_skills as string[]).map(skill => (
                                                <span key={skill} className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 rounded-md border border-red-100">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                            <h2 className="font-bold text-text-primary text-lg mb-3">Reviewer Notes</h2>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
                                placeholder="Add private notes about this candidate…"
                                className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-background text-text-primary" />
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-surface rounded-2xl border border-border p-6 space-y-3 shadow-sm">
                            <h2 className="font-bold text-text-primary mb-1">Pipeline</h2>
                            <p className="text-sm text-text-secondary mb-4">
                                Current stage:{' '}
                                <span className="font-semibold text-text-primary">{stageLabel(currentStatus)}</span>
                            </p>

                            {app.is_locked ? (
                                <div className="p-4 bg-background border border-border rounded-xl text-sm text-text-secondary">
                                    This application is locked — no further actions available.
                                </div>
                            ) : availableActions.length === 0 ? (
                                <p className="text-sm text-text-tertiary">No actions available.</p>
                            ) : (
                                <>
                                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Available actions</p>
                                    {availableActions.map(actionKey => {
                                        const cfg = ACTION_CONFIG[actionKey];
                                        if (!cfg) return null;
                                        const cls = ACTION_STYLES[actionKey] ?? 'bg-background border-border text-text-secondary';
                                        return (
                                            <button
                                                key={actionKey}
                                                onClick={() => handleAction(cfg.targetStatus)}
                                                disabled={!!updating}
                                                className={`w-full flex items-center justify-between px-4 py-3.5 border rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${cls}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {ACTION_ICONS[actionKey]} {cfg.label}
                                                </span>
                                                {updating === cfg.targetStatus
                                                    ? <Loader2 size={14} className="animate-spin" />
                                                    : <ChevronRight size={14} />}
                                            </button>
                                        );
                                    })}
                                </>
                            )}
                        </div>

                        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                            <h2 className="font-bold text-text-primary mb-4">Application Timeline</h2>
                            {timelineSteps.map((step, i) => (
                                <TimelineStep
                                    key={step.label}
                                    label={step.label}
                                    date={step.date}
                                    active={step.active}
                                    last={i === timelineSteps.length - 1}
                                />
                            ))}
                        </div>

                        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                            <h2 className="font-bold text-text-primary mb-3">Contact</h2>
                            <div className="space-y-2">
                                <a
                                    href={mailtoUrl}
                                    className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-xl text-sm font-medium text-text-primary hover:bg-background transition-colors"
                                >
                                    <Mail size={15} /> Open in mail app
                                </a>
                                <button
                                    onClick={handleCopyEmail}
                                    className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-background transition-colors"
                                >
                                    <Copy size={15} /> Copy email
                                </button>
                                <p className="text-xs text-text-tertiary text-center pt-1">
                                    Opens your device&apos;s default email application.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

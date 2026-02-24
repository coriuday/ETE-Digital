/**
 * Application Details Page — Employer reviews a single candidate application
 */
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobsApi } from '../api/jobs';
import {
    ArrowLeft, Mail, Briefcase, CalendarDays,
    CheckCircle2, XCircle, Clock, Star,
    Trophy, ExternalLink, Loader2, ChevronRight, MessageSquare
} from 'lucide-react';

function MatchGauge({ score }: { score: number }) {
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : '#f59e0b';
    const r = 42, cx = 52, cy = 52, circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <div className="flex items-center gap-4">
            <div className="relative w-[104px] h-[104px] flex-shrink-0">
                <svg viewBox="0 0 104 104" className="w-full h-full -rotate-90">
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={10} />
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
                        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-extrabold" style={{ color }}>{score}<span className="text-sm font-semibold">%</span></span>
                </div>
            </div>
            <div>
                <p className="font-bold text-gray-900">Match Score</p>
                <p className="text-xs text-gray-400 mt-0.5">{score >= 80 ? 'Excellent fit' : score >= 60 ? 'Good match' : 'Partial match'}</p>
                <div className="flex gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} className={i < Math.round(score / 20) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                    ))}
                </div>
            </div>
        </div>
    );
}

const STATUS_CLS: Record<string, string> = {
    applied: 'bg-blue-50 text-blue-700 border-blue-200',
    reviewed: 'bg-amber-50 text-amber-700 border-amber-200',
    shortlisted: 'bg-violet-50 text-violet-700 border-violet-200',
    hired: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
};

function TimelineStep({ label, date, active, last }: { label: string; date?: string; active: boolean; last?: boolean }) {
    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}>
                    {active && <CheckCircle2 size={14} className="text-white" />}
                </div>
                {!last && <div className="w-0.5 flex-1 bg-gray-100 my-1" />}
            </div>
            <div className="pb-5">
                <p className={`text-sm font-semibold ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
                {date && <p className="text-xs text-gray-400 mt-0.5">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>}
            </div>
        </div>
    );
}

export default function ApplicationDetailsPage() {
    const { applicationId } = useParams<{ applicationId: string }>();
    const navigate = useNavigate();
    const [notes, setNotes] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);
    const [currentStatus, setCurrentStatus] = useState('applied');

    const handleAction = async (newStatus: string) => {
        if (!applicationId) return;
        setUpdating(newStatus);
        try {
            await jobsApi.updateApplicationStatus(applicationId, newStatus, notes);
            setCurrentStatus(newStatus);
        } catch {
            alert('Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    // Placeholder data until API exposes GET /api/jobs/applications/:id
    const app = {
        id: applicationId ?? '',
        status: currentStatus,
        cover_letter: 'I am excited about this opportunity and believe my skills align well with the role requirements. I have over 5 years of experience in similar positions and am passionate about contributing to your team.',
        match_score: 82,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        candidate_name: 'Alex Johnson',
        candidate_email: 'alex.johnson@example.com',
        candidate_id: 'placeholder',
        job_title: 'Senior Developer',
        tryout_score: 87,
    };

    const statuses = ['applied', 'reviewed', 'shortlisted', 'hired'];
    const currentIdx = statuses.indexOf(app.status);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
                <div className="relative max-w-6xl mx-auto px-6 py-10">
                    <button onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-sm font-medium mb-6 transition-colors">
                        <ArrowLeft size={15} /> Back to applications
                    </button>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h1 className="text-2xl md:text-3xl font-extrabold text-white">{app.candidate_name}</h1>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border capitalize ${STATUS_CLS[app.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    {app.status}
                                </span>
                            </div>
                            <p className="text-blue-200 text-sm flex items-center gap-2 flex-wrap">
                                <Briefcase size={13} /> Applied for <strong className="text-white">{app.job_title}</strong>
                                <span className="text-blue-400">·</span>
                                <CalendarDays size={13} />
                                {new Date(app.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <MatchGauge score={app.match_score} />
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left 60% */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Profile card */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h2 className="font-bold text-gray-900 text-lg mb-4">Candidate Profile</h2>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center text-2xl font-extrabold text-blue-700">
                                {app.candidate_name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{app.candidate_name}</p>
                                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5"><Mail size={12} /> {app.candidate_email}</p>
                            </div>
                            <Link to={`/vault/candidate/${app.candidate_id}`}
                                className="ml-auto text-xs font-semibold text-blue-600 flex items-center gap-1 border border-blue-100 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors">
                                Portfolio <ExternalLink size={11} />
                            </Link>
                        </div>
                    </div>

                    {/* Cover Letter */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                            <MessageSquare size={18} className="text-gray-400" /> Cover Letter
                        </h2>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{app.cover_letter}</p>
                    </div>

                    {/* Tryout score */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Trophy size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900">Tryout Results</h2>
                                <p className="text-xs text-amber-700">Completed skill assessment</p>
                            </div>
                            <div className="ml-auto text-2xl font-extrabold text-amber-700">{app.tryout_score}%</div>
                        </div>
                        <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{ width: `${app.tryout_score}%` }} />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h2 className="font-bold text-gray-900 text-lg mb-3">Reviewer Notes</h2>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
                            placeholder="Add private notes about this candidate…"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>
                </div>

                {/* Right 40% */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Actions */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
                        <h2 className="font-bold text-gray-900 mb-4">Decision</h2>
                        {[
                            { status: 'shortlisted', label: 'Shortlist', icon: <Star size={15} className="fill-violet-400 text-violet-400" />, cls: 'bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700' },
                            { status: 'hired', label: 'Hire Candidate', icon: <CheckCircle2 size={15} />, cls: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700' },
                            { status: 'reviewed', label: 'Mark Reviewed', icon: <Clock size={15} />, cls: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700' },
                            { status: 'rejected', label: 'Reject', icon: <XCircle size={15} />, cls: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700' },
                        ].map(({ status, label, icon, cls }) => (
                            <button key={status} onClick={() => handleAction(status)} disabled={!!updating}
                                className={`w-full flex items-center justify-between px-4 py-3.5 border rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${cls}`}>
                                <span className="flex items-center gap-2">{icon} {label}</span>
                                {updating === status ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                            </button>
                        ))}
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h2 className="font-bold text-gray-900 mb-4">Application Timeline</h2>
                        {statuses.map((s, i) => (
                            <TimelineStep key={s} label={s.charAt(0).toUpperCase() + s.slice(1)}
                                date={i <= currentIdx ? app.updated_at : undefined}
                                active={i <= currentIdx} last={i === statuses.length - 1} />
                        ))}
                    </div>

                    {/* Contact */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h2 className="font-bold text-gray-900 mb-3">Contact</h2>
                        <a href={`mailto:${app.candidate_email}`}
                            className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            <Mail size={15} /> Send Email
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

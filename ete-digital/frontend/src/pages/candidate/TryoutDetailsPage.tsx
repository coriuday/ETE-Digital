/**
 * Tryout Details Page — Countdown timer · Rubric sidebar · Multi-format submission
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tryoutsApi, Tryout } from '../../api/tryouts';
import { jobsApi, Job } from '../../api/jobs';
import { useAuthStore } from '../../stores/authStore';
import {
    ArrowLeft, Clock, DollarSign, Star, Upload, Link2,
    Code2, FileText, CheckCircle2, AlertCircle, Loader2,
    Trophy, ChevronRight, X, File
} from 'lucide-react';

// ── Countdown Timer ───────────────────────────────────────────────────────────

function CountdownTimer({ hours }: { hours: number }) {
    const total = hours * 3600;
    const [remaining, setRemaining] = useState(total);

    useEffect(() => {
        const id = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
        return () => clearInterval(id);
    }, []);

    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    const pct = (remaining / total) * 100;
    const urgent = pct < 20;

    return (
        <div className={`rounded-2xl p-5 border ${urgent ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${urgent ? 'text-red-600' : 'text-blue-600'}`}>
                <Clock size={11} className="inline mr-1" /> Time Remaining
            </p>
            <div className="flex gap-2 justify-center mb-3">
                {[
                    { v: h, label: 'hrs' },
                    { v: m, label: 'min' },
                    { v: s, label: 'sec' },
                ].map(({ v, label }) => (
                    <div key={label} className="text-center">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-extrabold ${urgent ? 'bg-red-100 text-red-700' : 'bg-white text-blue-900'} shadow-sm`}>
                            {String(v).padStart(2, '0')}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{label}</p>
                    </div>
                ))}
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${urgent ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ── Rubric Row ────────────────────────────────────────────────────────────────

function RubricRow({ label, weight, passing }: { label: string; weight: number; passing?: boolean }) {
    return (
        <div className="flex items-center gap-3 py-2.5">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 capitalize">{label.replace(/_/g, ' ')}</p>
            </div>
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" style={{ width: `${weight}%` }} />
            </div>
            <span className={`text-sm font-bold w-10 text-right ${passing ? 'text-emerald-600' : 'text-gray-700'}`}>
                {weight}%
            </span>
        </div>
    );
}

// ── File Drop Zone ────────────────────────────────────────────────────────────

function FileDropZone({ onFile }: { onFile: (f: File) => void }) {
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) { setFile(f); onFile(f); }
    }, [onFile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) { setFile(f); onFile(f); }
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
                ${dragging ? 'border-blue-400 bg-blue-50' : file ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
        >
            <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
            {file ? (
                <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <File size={20} className="text-emerald-600" />
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-sm text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="ml-2 p-1 hover:bg-emerald-100 rounded-lg transition-colors">
                        <X size={14} className="text-emerald-600" />
                    </button>
                </div>
            ) : (
                <>
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Upload size={22} className="text-gray-400" />
                    </div>
                    <p className="font-semibold text-gray-700 mb-1">Drop your file here</p>
                    <p className="text-xs text-gray-400">or <span className="text-blue-600 font-medium">browse</span> to upload</p>
                </>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TryoutDetailsPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const [tryout, setTryout] = useState<Tryout | null>(null);
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [activeTab, setActiveTab] = useState<'description' | 'rubric'>('description');

    // Submission form state
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [submissionCode, setSubmissionCode] = useState('');
    const [submissionText, setSubmissionText] = useState('');
    const [notes, setNotes] = useState('');
    const [_file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (!jobId) return;
        Promise.all([tryoutsApi.getTryoutByJob(jobId), jobsApi.getJob(jobId)])
            .then(([t, j]) => { setTryout(t); setJob(j); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [jobId]);

    const handleStart = () => {
        if (!isAuthenticated) { navigate('/login', { state: { returnTo: `/tryouts/job/${jobId}` } }); return; }
        if (user?.role !== 'candidate') { alert('Only candidates can submit tryouts'); return; }
        setStarted(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tryout) return;
        setSubmitting(true);
        try {
            const payload: any = { notes };
            if (tryout.submission_format === 'URL') payload.submission_url = submissionUrl;
            else if (tryout.submission_format === 'CODE') payload.submission_code = submissionCode;
            else if (tryout.submission_format === 'TEXT') payload.submission_text = submissionText;
            await tryoutsApi.submitSolution(tryout.id, payload);
            setSubmitted(true);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 size={36} className="animate-spin text-blue-600" />
        </div>
    );

    if (!tryout || !job) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
            <div>
                <AlertCircle size={48} className="text-gray-200 mx-auto mb-3" />
                <p className="font-bold text-gray-700 mb-2">Tryout not found</p>
                <Link to="/jobs" className="text-blue-600 text-sm">← Back to jobs</Link>
            </div>
        </div>
    );

    if (submitted) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center px-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-12 max-w-md mx-auto">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Trophy size={38} className="text-emerald-600" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Submission Sent!</h1>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                    Your tryout submission for <strong>{job.title}</strong> is under review. You'll be notified of results within 48 hours.
                </p>
                <div className="flex gap-3">
                    <Link to="/dashboard" className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl text-sm text-center">
                        Go to Dashboard
                    </Link>
                    <Link to="/jobs" className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl text-sm text-center hover:bg-gray-50">
                        Browse Jobs
                    </Link>
                </div>
            </div>
        </div>
    );

    const rubricEntries = Object.entries(tryout.scoring_rubric ?? {});

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Hero banner */}
            <div className="bg-gradient-to-br from-slate-900 via-violet-950 to-blue-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
                <div className="relative max-w-6xl mx-auto px-6 py-10">
                    <Link to={`/jobs/${jobId}`} className="inline-flex items-center gap-2 text-violet-300 hover:text-white text-sm font-medium mb-6 transition-colors">
                        <ArrowLeft size={15} /> Back to job
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1">
                            <Star size={11} className="fill-amber-400 text-amber-400" /> Trial Task
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs">
                            {tryout.submission_format}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1">{tryout.title}</h1>
                    <p className="text-blue-200 text-sm">
                        For{' '}
                        <Link to={`/jobs/${jobId}`} className="underline underline-offset-2 hover:text-white">
                            {job.title}
                        </Link>
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">

                {/* ── Left: Content 60% ── */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Tab nav */}
                    <div className="flex gap-1 bg-white border border-gray-100 p-1 rounded-xl shadow-sm w-fit">
                        {(['description', 'rubric'] as const).map((t) => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-colors
                                    ${activeTab === t ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                                {t === 'description' ? 'Task Brief' : 'Scoring Rubric'}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'description' && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 text-lg mb-4">Task Description</h2>
                            <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{tryout.description}</div>
                        </div>
                    )}

                    {activeTab === 'rubric' && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 text-lg mb-1">Scoring Rubric</h2>
                            <p className="text-xs text-gray-400 mb-4">How your submission will be evaluated</p>
                            <div className="divide-y divide-gray-100">
                                {rubricEntries.map(([label, weight]) => (
                                    <RubricRow key={label} label={label} weight={Number(weight)} />
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-sm text-gray-500">Passing Score</span>
                                <span className="text-lg font-extrabold text-emerald-600">{tryout.passing_score}%</span>
                            </div>
                        </div>
                    )}

                    {/* Submission form (only after started) */}
                    {started && (
                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    {tryout.submission_format === 'URL' ? <Link2 size={16} className="text-blue-600" />
                                        : tryout.submission_format === 'CODE' ? <Code2 size={16} className="text-blue-600" />
                                            : tryout.submission_format === 'FILE' ? <Upload size={16} className="text-blue-600" />
                                                : <FileText size={16} className="text-blue-600" />}
                                </div>
                                <h3 className="font-bold text-gray-900">Your Submission</h3>
                            </div>

                            {tryout.submission_format === 'URL' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Solution URL *</label>
                                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                                        <span className="px-3 py-3 bg-gray-50 border-r border-gray-200 text-gray-400">
                                            <Link2 size={15} />
                                        </span>
                                        <input required type="url" value={submissionUrl}
                                            onChange={e => setSubmissionUrl(e.target.value)}
                                            placeholder="https://github.com/your-repo"
                                            className="flex-1 px-3 py-3 text-sm outline-none" />
                                    </div>
                                </div>
                            )}

                            {tryout.submission_format === 'FILE' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload File *</label>
                                    <FileDropZone onFile={setFile} />
                                </div>
                            )}

                            {tryout.submission_format === 'CODE' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Code *</label>
                                    <textarea required rows={14} value={submissionCode}
                                        onChange={e => setSubmissionCode(e.target.value)}
                                        placeholder="// Paste your code here..."
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                </div>
                            )}

                            {tryout.submission_format === 'TEXT' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Solution *</label>
                                    <textarea required rows={10} value={submissionText}
                                        onChange={e => setSubmissionText(e.target.value)}
                                        placeholder="Describe your solution in detail..."
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes for Reviewer <span className="text-gray-400 font-normal">(optional)</span></label>
                                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                                    placeholder="Any additional context or comments..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                            </div>

                            {/* Sticky submit bar */}
                            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4 z-40">
                                <div className="max-w-6xl mx-auto flex items-center gap-4">
                                    <button type="button" onClick={() => setStarted(false)}
                                        className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                        Save Draft
                                    </button>
                                    <button type="submit" disabled={submitting}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-violet-700 disabled:opacity-60 transition-all shadow-lg shadow-blue-500/20 text-sm">
                                        {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <><CheckCircle2 size={16} /> Submit Solution</>}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* ── Right: Sidebar 40% ── */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Countdown */}
                    {started && <CountdownTimer hours={tryout.estimated_duration_hours} />}

                    {/* Payment */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                                <DollarSign size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Compensation</p>
                                <p className="text-2xl font-extrabold text-emerald-700">${tryout.payment_amount.toLocaleString()}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400">Paid upon successful completion (score ≥ {tryout.passing_score}%)</p>
                    </div>

                    {/* Meta */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3 text-sm">
                        {[
                            { label: 'Est. Duration', value: `${tryout.estimated_duration_hours}h` },
                            { label: 'Max Attempts', value: `${tryout.max_submissions_per_candidate}` },
                            { label: 'Format', value: tryout.submission_format },
                            { label: 'Passing Score', value: `${tryout.passing_score}%` },
                        ].map(r => (
                            <div key={r.label} className="flex justify-between items-center">
                                <span className="text-gray-500">{r.label}</span>
                                <span className="font-semibold text-gray-800">{r.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Start CTA */}
                    {!started && (
                        <button onClick={handleStart}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/20 text-sm">
                            Begin Tryout <ChevronRight size={16} />
                        </button>
                    )}

                    {/* Tip */}
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                        <p className="text-xs text-amber-800 leading-relaxed">
                            <span className="font-bold">💡 Tip:</span> Read the full task brief and all rubric criteria before starting the timer. Quality beats speed—take your time.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

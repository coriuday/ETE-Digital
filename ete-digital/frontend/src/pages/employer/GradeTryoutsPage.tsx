/**
 * Grade Tryouts Page — Employer reviews and grades candidate submissions.
 * Fetches real submissions from the backend via tryoutsApi.
 */
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, Star, GitBranch, Calendar, ChevronRight, RefreshCw } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { tryoutsApi } from '../../api/tryouts';

interface Submission {
    id: string;
    tryout_id: string;
    candidate_id: string;
    submission_url?: string;
    notes?: string;
    status: string;
    auto_score?: number;
    manual_score?: number;
    final_score?: number;
    feedback?: string;
    created_at: string;
    reviewed_at?: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    submitted: { color: 'bg-amber-100 text-amber-700', label: 'Pending Review' },
    auto_graded: { color: 'bg-blue-100 text-blue-700', label: 'Auto-Graded' },
    passed: { color: 'bg-emerald-100 text-emerald-700', label: 'Passed ✓' },
    failed: { color: 'bg-red-100 text-red-600', label: 'Failed' },
};

export default function GradeTryoutsPage() {
    const [searchParams] = useSearchParams();
    const tryoutId = searchParams.get('tryoutId');

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        loadSubmissions();
    }, [tryoutId]);

    const loadSubmissions = async () => {
        setLoading(true);
        setError('');
        try {
            if (tryoutId) {
                // Load submissions for a specific tryout
                const res = await tryoutsApi.getTryoutSubmissions(tryoutId);
                setSubmissions(res.submissions ?? []);
            } else {
                // No specific tryout selected — show empty state with guidance
                setSubmissions([]);
            }
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to load submissions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filtered = submissions.filter(sub =>
        filter === 'all' || sub.status === filter
    );

    const counts: Record<string, number> = { all: submissions.length };
    submissions.forEach(s => { counts[s.status] = (counts[s.status] || 0) + 1; });

    const getScore = (sub: Submission) => sub.final_score ?? sub.auto_score ?? sub.manual_score;

    return (
        <AppShell>
            <div className="p-6 lg:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Grade Tryouts</h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            {tryoutId
                                ? `Showing submissions for tryout ${tryoutId.slice(0, 8)}…`
                                : 'Select a tryout from your jobs page to view submissions'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadSubmissions}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <Link
                            to="/employer/dashboard"
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>

                {/* Filter tabs */}
                {submissions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {['all', 'submitted', 'auto_graded', 'passed', 'failed'].map(f => {
                            const n = counts[f] ?? 0;
                            if (f !== 'all' && n === 0) return null;
                            const cfg = STATUS_CONFIG[f];
                            return (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${filter === f
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                        }`}
                                >
                                    {cfg?.label ?? 'All'} ({n})
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                        <p className="text-red-600 text-sm font-medium">{error}</p>
                        <button
                            onClick={loadSubmissions}
                            className="mt-3 px-4 py-2 bg-white border border-red-200 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : !tryoutId ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
                        <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ClipboardList size={28} className="text-violet-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No tryout selected</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Go to your jobs, open a job with a tryout, and click "View Submissions".
                        </p>
                        <Link
                            to="/employer/jobs"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
                        >
                            View My Jobs <ChevronRight size={15} />
                        </Link>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
                        <div className="text-5xl mb-4">📝</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No submissions yet</h3>
                        <p className="text-gray-500 text-sm">
                            {submissions.length === 0
                                ? 'No candidates have submitted to this tryout yet.'
                                : `No submissions match the "${filter}" filter.`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(sub => {
                            const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.submitted;
                            const score = getScore(sub);
                            return (
                                <div key={sub.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                                                {sub.candidate_id.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        Candidate {sub.candidate_id.slice(0, 8)}…
                                                    </p>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                    {score !== undefined && score !== null && (
                                                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                                            <Star size={10} /> {score}/100
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={11} />
                                                        Submitted {new Date(sub.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    {sub.submission_url && (
                                                        <a
                                                            href={sub.submission_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-violet-600 hover:text-violet-700 font-medium"
                                                        >
                                                            <GitBranch size={11} /> View Submission
                                                        </a>
                                                    )}
                                                    {sub.notes && (
                                                        <span className="text-gray-400 truncate max-w-xs" title={sub.notes}>
                                                            "{sub.notes.slice(0, 60)}{sub.notes.length > 60 ? '…' : ''}"
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/employer/tryouts/grade/${sub.id}`}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-sm font-semibold flex-shrink-0"
                                        >
                                            {sub.status === 'submitted' ? 'Grade Now' : 'View Details'}
                                            <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppShell>
    );
}

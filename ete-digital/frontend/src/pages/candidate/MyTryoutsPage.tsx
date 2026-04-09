/**
 * My Tryouts Page — Candidate view of their tryout submissions
 * Premium redesign with AppShell, dark mode, match score display
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { tryoutsApi, Submission } from '../../api/tryouts';
import { useTheme } from '../../contexts/ThemeContext';
import {
    Trophy, AlertCircle, Briefcase, Clock,
    CheckCircle, XCircle, Hourglass, DollarSign, Star, ArrowRight,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    SUBMITTED: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: <Clock size={13} /> },
    GRADING: { label: 'Being Graded', color: 'bg-amber-100 text-amber-700', icon: <Hourglass size={13} /> },
    PASSED: { label: 'Passed ✓', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={13} /> },
    FAILED: { label: 'Not Passed', color: 'bg-red-100 text-red-600', icon: <XCircle size={13} /> },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Payment Pending', color: 'bg-gray-100 text-gray-600' },
    ESCROWED: { label: 'Payment Held', color: 'bg-amber-100 text-amber-700' },
    RELEASED: { label: 'Paid 💰', color: 'bg-emerald-100 text-emerald-700' },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-500' },
};

export default function MyTryoutsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => { loadSubmissions(); }, []);

    const loadSubmissions = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await tryoutsApi.getMySubmissions(1);
            setSubmissions(res.submissions);
        } catch {
            setError('Failed to load your tryout submissions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const bg = isDark ? 'bg-gray-900' : 'bg-gray-50';
    const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

    return (
        <AppShell>
            <div className={`min-h-full ${bg}`}>
                {/* Header */}
                <div className={`border-b px-6 py-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                <Trophy size={18} className="text-white" />
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold ${textPrimary}`}>My Tryouts</h1>
                                <p className={`text-sm ${textMuted}`}>Track your paid trial task submissions</p>
                            </div>
                        </div>
                        <Link to="/jobs?has_tryout=true"
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                        >
                            <Briefcase size={15} /> Find Tryouts
                        </Link>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-6 py-8">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-40 rounded-2xl animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                            ))}
                        </div>
                    ) : error ? (
                        <div className={`flex flex-col items-center justify-center py-16 text-center ${textMuted}`}>
                            <AlertCircle size={40} className="mb-3 opacity-60" />
                            <p className="text-sm">{error}</p>
                            <button onClick={loadSubmissions}
                                className={`mt-4 px-5 py-2 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                            <Trophy size={48} className="mb-4 opacity-20" />
                            <h3 className={`font-bold text-lg mb-1 ${textPrimary}`}>No tryout submissions yet</h3>
                            <p className={`text-sm mb-6 max-w-xs ${textMuted}`}>
                                Apply to jobs that include a paid trial task and complete the task to see your submissions here.
                            </p>
                            <Link to="/jobs?has_tryout=true"
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                            >
                                Browse Jobs with Tryouts <ArrowRight size={15} />
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {submissions.map(sub => {
                                const statusCfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.SUBMITTED;
                                const paymentCfg = PAYMENT_CONFIG[sub.payment_status] ?? PAYMENT_CONFIG.PENDING;
                                return (
                                    <div key={sub.id} className={`rounded-2xl border overflow-hidden transition-all hover:shadow-md ${cardBg}`}>
                                        {/* Top stripe */}
                                        <div className={`h-1 w-full ${
                                            sub.status === 'PASSED' ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                            : sub.status === 'GRADING' ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                            : sub.status === 'FAILED' ? 'bg-gradient-to-r from-red-400 to-rose-500'
                                            : 'bg-gradient-to-r from-blue-400 to-violet-500'
                                        }`} />
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div>
                                                    <h3 className={`font-bold text-base leading-tight ${textPrimary}`}>Tryout Submission</h3>
                                                    <p className={`text-xs mt-0.5 ${textMuted}`}>
                                                        Submitted {new Date(sub.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                                                        {statusCfg.icon}
                                                        {statusCfg.label}
                                                    </span>
                                                    <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentCfg.color}`}>
                                                        <DollarSign size={10} />{paymentCfg.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Scores */}
                                            {(sub.auto_score !== undefined || sub.manual_score !== undefined || sub.final_score !== undefined) && (
                                                <div className={`grid grid-cols-3 gap-3 p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                                    {sub.auto_score !== undefined && (
                                                        <div className="text-center">
                                                            <p className={`text-xs mb-1 ${textMuted}`}>Auto Score</p>
                                                            <p className="text-2xl font-extrabold text-blue-500">{sub.auto_score}%</p>
                                                        </div>
                                                    )}
                                                    {sub.manual_score !== undefined && (
                                                        <div className="text-center">
                                                            <p className={`text-xs mb-1 ${textMuted}`}>Manual Score</p>
                                                            <p className="text-2xl font-extrabold text-violet-500">{sub.manual_score}%</p>
                                                        </div>
                                                    )}
                                                    {sub.final_score !== undefined && (
                                                        <div className="text-center">
                                                            <p className={`text-xs mb-1 ${textMuted}`}>Final Score</p>
                                                            <p className={`text-2xl font-extrabold ${
                                                                sub.status === 'PASSED' ? 'text-emerald-500' : 'text-red-500'
                                                            }`}>{sub.final_score}%</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Feedback */}
                                            {sub.feedback && (
                                                <div className={`p-4 rounded-xl border-l-4 ${
                                                    isDark ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-400'
                                                }`}>
                                                    <p className={`text-xs font-bold mb-1 flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                                        <Star size={12} /> Reviewer Feedback
                                                    </p>
                                                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{sub.feedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}

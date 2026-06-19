/**
 * GradeSubmissionPage — Review, score, and manage payment for a tryout submission
 * Now wired to real API: /api/tryouts/submissions/{id}/review + /api/payments/tryout/{id}/...
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import {
    CheckCircle2, XCircle, Lock, Unlock, AlertCircle,
    Loader2, ExternalLink, DollarSign, Star
} from 'lucide-react';
import api from '../../api/client';

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
    payment_status: string;
    payment_escrowed_at?: string;
    payment_released_at?: string;
}

const paymentBadge: Record<string, { label: string; cls: string }> = {
    pending:  { label: 'No Escrow', cls: 'bg-gray-100 text-text-secondary' },
    escrowed: { label: 'Escrowed 🔒', cls: 'bg-violet-100 text-violet-700' },
    released: { label: 'Released ✓', cls: 'bg-emerald-100 text-emerald-700' },
    refunded: { label: 'Refunded', cls: 'bg-red-100 text-red-700' },
    failed:   { label: 'Failed', cls: 'bg-orange-100 text-orange-700' },
};

export default function GradeSubmissionPage() {
    const { submissionId } = useParams<{ submissionId: string }>();
    const navigate = useNavigate();

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loadingSub, setLoadingSub] = useState(true);
    const [scores, setScores] = useState<number[]>([0, 0, 0, 0]);
    const [feedback, setFeedback] = useState('');
    const [decision, setDecision] = useState<'pass' | 'fail' | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState<'escrow' | 'release' | 'refund' | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const rubric = [
        { criterion: 'Code Quality', maxPoints: 25 },
        { criterion: 'Functionality', maxPoints: 25 },
        { criterion: 'Design', maxPoints: 25 },
        { criterion: 'Documentation', maxPoints: 25 },
    ];

    const totalScore = scores.reduce((a, b) => a + b, 0);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        if (!submissionId) return;
        (async () => {
            try {
                const res = await api.get(`/tryouts/submissions/${submissionId}`);
                setSubmission(res.data);
                if (res.data.manual_score != null) {
                    // Distribute existing manual_score evenly across rubric
                    const per = Math.floor(res.data.manual_score / rubric.length);
                    setScores(rubric.map((_, i) => i < rubric.length - 1 ? per : res.data.manual_score - per * (rubric.length - 1)));
                }
                if (res.data.feedback) setFeedback(res.data.feedback);
                if (res.data.status === 'passed') setDecision('pass');
                if (res.data.status === 'failed') setDecision('fail');
            } catch {
                // Use placeholder if submission not loadable (page still functional)
            } finally {
                setLoadingSub(false);
            }
        })();
    }, [submissionId]);

    const handleGrade = async () => {
        if (!decision) { showToast('error', 'Please select Pass or Fail before submitting.'); return; }
        setSubmitting(true);
        try {
            const res = await api.post(`/tryouts/submissions/${submissionId}/review`, {
                manual_score: totalScore,
                feedback,
                approved: decision === 'pass',
            });
            setSubmission(res.data);
            showToast('success', 'Submission graded successfully!');
        } catch (e: any) {
            showToast('error', e.response?.data?.detail || 'Failed to grade submission');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEscrow = async () => {
        setPaymentLoading('escrow');
        try {
            const res = await api.post(`/payments/tryout/${submissionId}/escrow`, { currency: 'inr' });
            setSubmission(prev => prev ? { ...prev, payment_status: res.data.payment_status } : prev);
            showToast('success', 'Payment escrowed! Funds are now held securely.');
        } catch (e: any) {
            showToast('error', e.response?.data?.detail || 'Escrow failed');
        } finally {
            setPaymentLoading(null);
        }
    };

    const handleRelease = async () => {
        if (!confirm('Release payment to the candidate? This cannot be undone.')) return;
        setPaymentLoading('release');
        try {
            const res = await api.post(`/payments/tryout/${submissionId}/release`);
            setSubmission(prev => prev ? { ...prev, payment_status: res.data.payment_status } : prev);
            showToast('success', 'Payment released to candidate! 🎉');
        } catch (e: any) {
            showToast('error', e.response?.data?.detail || 'Release failed');
        } finally {
            setPaymentLoading(null);
        }
    };

    const handleRefund = async () => {
        if (!confirm('Refund the escrowed payment? The candidate will be notified.')) return;
        setPaymentLoading('refund');
        try {
            const res = await api.post(`/payments/tryout/${submissionId}/refund`);
            setSubmission(prev => prev ? { ...prev, payment_status: res.data.payment_status } : prev);
            showToast('success', 'Payment refunded to your account.');
        } catch (e: any) {
            showToast('error', e.response?.data?.detail || 'Refund failed');
        } finally {
            setPaymentLoading(null);
        }
    };

    const pmStatus = submission?.payment_status ?? 'pending';
    const pmBadge = paymentBadge[pmStatus] ?? paymentBadge.pending;

    return (
        <AppShell>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-medium transition-all
                    ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            <div className="p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary">Grade Submission</h1>
                            <p className="text-text-secondary mt-0.5">Review and score this tryout submission</p>
                        </div>
                        <button onClick={() => navigate(-1)} className="text-sm text-text-secondary hover:text-text-primary border border-border rounded-xl px-4 py-2">
                            ← Back
                        </button>
                    </div>

                    {/* Submission Info + Payment Status */}
                    <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-text-primary">Submission Details</h2>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${pmBadge.cls}`}>{pmBadge.label}</span>
                        </div>
                        {loadingSub ? (
                            <div className="h-16 bg-background rounded-xl animate-pulse" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {submission?.submission_url && (
                                    <div>
                                        <p className="text-text-secondary mb-1">Submission Link</p>
                                        <a href={submission.submission_url} target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-violet-600 font-medium hover:underline">
                                            View Work <ExternalLink size={12} />
                                        </a>
                                    </div>
                                )}
                                {submission?.auto_score != null && (
                                    <div>
                                        <p className="text-text-secondary mb-1">AI Auto-Score</p>
                                        <span className="font-bold text-text-primary">{submission.auto_score}/100</span>
                                    </div>
                                )}
                                {submission?.notes && (
                                    <div className="md:col-span-2">
                                        <p className="text-text-secondary mb-1">Candidate Notes</p>
                                        <p className="text-text-primary bg-background rounded-xl p-3">{submission.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Payment Actions */}
                    <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign size={18} className="text-violet-600" />
                            <h2 className="text-base font-semibold text-text-primary">Payment Management</h2>
                        </div>
                        <p className="text-sm text-text-secondary mb-5">
                            Manage the escrow payment for this tryout. Escrow funds before grading, then release or refund after your decision.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {pmStatus === 'pending' && (
                                <button onClick={handleEscrow} disabled={!!paymentLoading}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors">
                                    {paymentLoading === 'escrow' ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                                    Escrow Payment
                                </button>
                            )}
                            {pmStatus === 'escrowed' && (
                                <>
                                    <button onClick={handleRelease} disabled={!!paymentLoading}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors">
                                        {paymentLoading === 'release' ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />}
                                        Release to Candidate
                                    </button>
                                    <button onClick={handleRefund} disabled={!!paymentLoading}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                                        {paymentLoading === 'refund' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                        Refund to Me
                                    </button>
                                </>
                            )}
                            {(pmStatus === 'released' || pmStatus === 'refunded') && (
                                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                                    ${pmStatus === 'released' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                    {pmStatus === 'released' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                    {pmStatus === 'released' ? 'Payment successfully released' : 'Payment refunded'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Scoring Rubric */}
                    <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <Star size={18} className="text-amber-500" />
                                <h2 className="text-base font-semibold text-text-primary">Scoring Rubric</h2>
                            </div>
                            <div className={`text-2xl font-extrabold ${totalScore >= 70 ? 'text-emerald-600' : totalScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                {totalScore} / 100
                            </div>
                        </div>
                        <div className="space-y-5">
                            {rubric.map((item, index) => (
                                <div key={index}>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-medium text-text-primary">{item.criterion}</h3>
                                        <span className="text-xs text-text-secondary">Max {item.maxPoints} pts</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min={0} max={item.maxPoints} value={scores[index]}
                                            onChange={(e) => { const n = [...scores]; n[index] = +e.target.value; setScores(n); }}
                                            className="flex-1 accent-violet-600" />
                                        <input type="number" min={0} max={item.maxPoints} value={scores[index]}
                                            onChange={(e) => { const n = [...scores]; n[index] = Math.min(item.maxPoints, Math.max(0, +e.target.value || 0)); setScores(n); }}
                                            className="w-16 border border-border rounded-lg px-2 py-1.5 text-center text-sm font-semibold" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Feedback */}
                    <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
                        <h2 className="text-base font-semibold text-text-primary mb-3">Your Feedback</h2>
                        <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={5}
                            placeholder="Provide detailed, constructive feedback to the candidate..."
                            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none" />
                    </div>

                    {/* Decision */}
                    <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
                        <h2 className="text-base font-semibold text-text-primary mb-4">Final Decision</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setDecision('pass')}
                                className={`flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all border-2 ${
                                    decision === 'pass' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' : 'border-border text-text-secondary hover:border-emerald-300 hover:text-emerald-700'
                                }`}>
                                <CheckCircle2 size={18} /> Pass & Approve Payment
                            </button>
                            <button onClick={() => setDecision('fail')}
                                className={`flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all border-2 ${
                                    decision === 'fail' ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-200' : 'border-border text-text-secondary hover:border-red-300 hover:text-red-700'
                                }`}>
                                <XCircle size={18} /> Fail & Reject
                            </button>
                        </div>
                        {decision && (
                            <div className={`mt-4 text-sm px-4 py-3 rounded-xl ${decision === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {decision === 'pass'
                                    ? '✓ Candidate will be marked as passed and you can release the escrowed payment.'
                                    : '✗ Candidate will be notified of the rejection. You can refund the escrowed payment.'}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pb-6">
                        <button type="button" onClick={() => navigate(-1)}
                            className="px-6 py-2.5 text-text-primary bg-surface border border-border rounded-xl hover:bg-background transition font-medium text-sm">
                            Cancel
                        </button>
                        <button onClick={handleGrade} disabled={submitting || !decision}
                            className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            {submitting && <Loader2 size={14} className="animate-spin" />}
                            {submitting ? 'Submitting...' : 'Submit Grade'}
                        </button>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

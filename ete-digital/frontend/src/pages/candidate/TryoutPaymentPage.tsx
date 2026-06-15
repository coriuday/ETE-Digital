/**
 * TryoutPaymentPage — Candidate view of their tryout payment status
 * Shows the full escrow lifecycle: Pending → Escrowed → Released / Refunded
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import {
    DollarSign, Clock, CheckCircle2, XCircle,
    AlertCircle, ArrowRight, Loader2, Lock, Unlock
} from 'lucide-react';
import api from '../../api/client';

interface PaymentStatus {
    submission_id: string;
    payment_status: 'pending' | 'escrowed' | 'released' | 'refunded' | 'failed';
    payment_amount: number;
    payment_currency: string;
    payment_escrowed_at: string | null;
    payment_released_at: string | null;
    submission_status: string;
}

const statusConfig = {
    pending: {
        icon: Clock,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-700',
        title: 'Payment Pending',
        desc: 'The HR team has not yet set up escrow for this tryout payment.',
    },
    escrowed: {
        icon: Lock,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        badge: 'bg-violet-100 text-violet-700',
        title: 'Funds Held in Escrow 🔒',
        desc: 'Your payment is secured. Once HR reviews and approves your submission, funds will be released to you.',
    },
    released: {
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-700',
        title: 'Payment Released 🎉',
        desc: 'Congratulations! Your payment has been released. Check your bank account or payment method.',
    },
    refunded: {
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-700',
        title: 'Submission Not Approved',
        desc: 'Unfortunately your submission was not approved. The escrowed payment has been returned to the employer.',
    },
    failed: {
        icon: AlertCircle,
        color: 'text-gray-500',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        badge: 'bg-gray-100 text-gray-700',
        title: 'Payment Issue',
        desc: 'There was an issue with this payment. Please contact support.',
    },
};

const steps = [
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'escrowed', label: 'Escrowed', icon: Lock },
    { key: 'released', label: 'Released', icon: Unlock },
];

const stepOrder = ['pending', 'escrowed', 'released', 'refunded'];

export default function TryoutPaymentPage() {
    const { submissionId } = useParams<{ submissionId: string }>();
    const [data, setData] = useState<PaymentStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!submissionId) return;
        (async () => {
            try {
                const res = await api.get(`/payments/tryout/${submissionId}/status`);
                setData(res.data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load payment status');
            } finally {
                setLoading(false);
            }
        })();
    }, [submissionId]);

    const formatAmount = (amount: number, currency: string) => {
        const divisor = currency.toLowerCase() === 'inr' ? 100 : 100;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency.toUpperCase(),
            maximumFractionDigits: 0,
        }).format(amount / divisor);
    };

    const currentStep = data?.payment_status ?? 'pending';
    const config = statusConfig[currentStep] ?? statusConfig.pending;
    const StatusIcon = config.icon;
    const currentStepIndex = stepOrder.indexOf(currentStep);

    return (
        <AppShell>
            <div className="p-6 lg:p-8 max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/submissions"
                        className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1 mb-4"
                    >
                        ← My Submissions
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Tryout Payment</h1>
                    <p className="text-gray-500 mt-1">Track your payment status for this tryout submission</p>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-violet-600" size={32} />
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                        <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {data && !loading && (
                    <div className="space-y-6">
                        {/* Amount Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                                <DollarSign className="text-violet-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Tryout Prize Amount</p>
                                <p className="text-3xl font-extrabold text-gray-900">
                                    {formatAmount(data.payment_amount, data.payment_currency)}
                                </p>
                            </div>
                            <span className={`ml-auto text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide ${config.badge}`}>
                                {currentStep}
                            </span>
                        </div>

                        {/* Progress Steps (only for non-refunded) */}
                        {currentStep !== 'refunded' && currentStep !== 'failed' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-sm font-semibold text-gray-700 mb-5 uppercase tracking-wide">
                                    Payment Journey
                                </h2>
                                <div className="flex items-center">
                                    {steps.map((step, i) => {
                                        const isCompleted = stepOrder.indexOf(step.key) < currentStepIndex;
                                        const isCurrent = step.key === currentStep;
                                        const StepIcon = step.icon;
                                        return (
                                            <div key={step.key} className="flex items-center flex-1">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                                        isCompleted
                                                            ? 'bg-violet-600 border-violet-600'
                                                            : isCurrent
                                                            ? 'bg-violet-50 border-violet-500'
                                                            : 'bg-gray-50 border-gray-200'
                                                    }`}>
                                                        <StepIcon
                                                            size={16}
                                                            className={isCompleted ? 'text-white' : isCurrent ? 'text-violet-600' : 'text-gray-400'}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-medium ${isCurrent ? 'text-violet-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                                {i < steps.length - 1 && (
                                                    <div className={`flex-1 h-0.5 mx-2 mb-4 ${isCompleted ? 'bg-violet-500' : 'bg-gray-200'}`} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Status Card */}
                        <div className={`rounded-2xl border p-6 ${config.bg} ${config.border}`}>
                            <div className="flex items-start gap-4">
                                <StatusIcon className={config.color} size={24} />
                                <div>
                                    <h3 className="font-semibold text-gray-900">{config.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{config.desc}</p>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        {(data.payment_escrowed_at || data.payment_released_at) && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Timeline</h2>
                                <div className="space-y-3">
                                    {data.payment_escrowed_at && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                                            <span className="text-gray-600">Funds escrowed</span>
                                            <span className="ml-auto text-gray-400">
                                                {new Date(data.payment_escrowed_at).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {data.payment_released_at && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                            <span className="text-gray-600">Payment released</span>
                                            <span className="ml-auto text-gray-400">
                                                {new Date(data.payment_released_at).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* CTA */}
                        {currentStep === 'released' && (
                            <div className="bg-emerald-600 rounded-2xl p-6 text-white text-center">
                                <CheckCircle2 className="mx-auto mb-3" size={32} />
                                <h3 className="font-bold text-lg">Payment Complete!</h3>
                                <p className="text-emerald-100 text-sm mt-1 mb-4">
                                    Your payment has been released. Great work on completing the tryout!
                                </p>
                                <Link
                                    to="/jobs"
                                    className="inline-flex items-center gap-2 bg-white text-emerald-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-50 transition-colors"
                                >
                                    Browse More Jobs <ArrowRight size={14} />
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppShell>
    );
}

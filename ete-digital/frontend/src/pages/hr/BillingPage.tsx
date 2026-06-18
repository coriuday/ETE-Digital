/**
 * BillingPage — HR owners view their plan, usage, and upgrade options
 *
 * Plans:
 *   Free      — ₹0/mo    1 seat,  3 jobs
 *   Starter   — ₹1,999/mo 3 seats, 10 jobs
 *   Pro       — ₹4,999/mo 10 seats, unlimited jobs
 *   Enterprise — Custom
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import api from '../../api/client';
import {
    CreditCard, CheckCircle2, Zap, Building2, Crown,
    Users, Briefcase, Loader2, AlertCircle, ExternalLink,
    TrendingUp, Shield,
} from 'lucide-react';

interface PlanData {
    plan: string;
    status: string;
    seat_limit: number;
    job_limit: number;
    seats_used: number;
    jobs_active: number;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    stripe_customer_id: string | null;
}

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: '₹0',
        period: 'forever',
        icon: <Shield size={20} />,
        color: 'from-gray-400 to-gray-500',
        bgLight: 'bg-gray-50',
        border: 'border-gray-200',
        features: ['1 team seat', '3 active jobs', 'Basic analytics', 'Domain verification'],
    },
    {
        id: 'starter',
        name: 'Starter',
        price: '₹1,999',
        period: 'per month',
        icon: <Zap size={20} />,
        color: 'from-blue-500 to-indigo-500',
        bgLight: 'bg-blue-50',
        border: 'border-blue-200',
        popular: false,
        features: ['3 team seats', '10 active jobs', 'AI screening', 'Tryout payments', 'Audit logs'],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '₹4,999',
        period: 'per month',
        icon: <Crown size={20} />,
        color: 'from-violet-500 to-purple-600',
        bgLight: 'bg-violet-50',
        border: 'border-violet-200',
        popular: true,
        features: ['10 team seats', 'Unlimited jobs', 'Advanced AI', 'Priority support', 'Custom analytics'],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Custom',
        period: 'contact us',
        icon: <Building2 size={20} />,
        color: 'from-amber-500 to-orange-500',
        bgLight: 'bg-amber-50',
        border: 'border-amber-200',
        features: ['Unlimited seats', 'Unlimited jobs', 'SLA guarantee', 'Dedicated support', 'Custom integrations'],
    },
];

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
    const pct = limit >= 9999 ? 0 : Math.min((used / limit) * 100, 100);
    const isUnlimited = limit >= 9999;
    const isWarning = pct > 80;
    const isCritical = pct >= 100;

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
                <span>{label}</span>
                <span className={`font-semibold ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-700'}`}>
                    {used} / {isUnlimited ? '∞' : limit}
                </span>
            </div>
            {!isUnlimited && (
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            )}
        </div>
    );
}

export default function BillingPage() {
    const [planData, setPlanData] = useState<PlanData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [subscribing, setSubscribing] = useState<string | null>(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const [searchParams] = useSearchParams();

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        // Show success/cancel toasts from Stripe redirect
        if (searchParams.get('success')) showToast('🎉 Plan upgraded successfully!');
        if (searchParams.get('canceled')) showToast('Checkout cancelled.', 'error');
        if (searchParams.get('upgraded')) showToast(`✅ Upgraded to ${searchParams.get('upgraded')} (simulation)`);
    }, []);

    useEffect(() => {
        api.get('/billing/plan')
            .then(r => setPlanData(r.data))
            .catch(e => setError(e.response?.data?.detail ?? 'Failed to load billing info.'))
            .finally(() => setLoading(false));
    }, []);

    const handleSubscribe = async (planId: string) => {
        if (planId === 'free') return;
        if (planId === 'enterprise') {
            window.open('mailto:hello@jobsrow.com?subject=Enterprise Plan Inquiry', '_blank');
            return;
        }
        setSubscribing(planId);
        try {
            const res = await api.post('/billing/subscribe', { plan: planId });
            if (res.data.simulation) {
                // Simulation mode — reload plan data
                const updated = await api.get('/billing/plan');
                setPlanData(updated.data);
                showToast(`✅ Upgraded to ${planId} (simulation mode — add Stripe keys for real billing)`);
            } else {
                window.location.href = res.data.url;
            }
        } catch (e: any) {
            showToast(e.response?.data?.detail ?? 'Failed to start checkout.', 'error');
        } finally {
            setSubscribing(null);
        }
    };

    const handlePortal = async () => {
        setPortalLoading(true);
        try {
            const res = await api.post('/billing/portal');
            window.location.href = res.data.url;
        } catch {
            showToast('Failed to open billing portal.', 'error');
        } finally {
            setPortalLoading(false);
        }
    };

    const currentPlan = PLANS.find(p => p.id === planData?.plan) ?? PLANS[0];

    return (
        <AppShell>
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                            <CreditCard size={20} className="text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Billing & Plans</h1>
                            <p className="text-sm text-gray-500">Manage your subscription and usage</p>
                        </div>
                    </div>
                    {planData?.stripe_customer_id && (
                        <button onClick={handlePortal} disabled={portalLoading}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                            {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                            Manage Billing
                        </button>
                    )}
                </div>

                {/* Current Plan Card */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="animate-spin text-violet-500" size={28} />
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={18} />
                        <p>{error}</p>
                    </div>
                ) : planData && (
                    <div className={`${currentPlan.bgLight} border ${currentPlan.border} rounded-2xl p-6 space-y-5`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentPlan.color} flex items-center justify-center text-white`}>
                                    {currentPlan.icon}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-bold text-gray-900 text-lg">{currentPlan.name} Plan</h2>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                            planData.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                            planData.status === 'past_due' ? 'bg-red-100 text-red-600' :
                                            'bg-gray-100 text-gray-500'
                                        }`}>{planData.status}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {planData.current_period_end
                                            ? `Renews ${new Date(planData.current_period_end).toLocaleDateString('en-IN', { dateStyle: 'medium' })}`
                                            : currentPlan.price === '₹0' ? 'Free forever' : currentPlan.price + '/mo'}
                                    </p>
                                </div>
                            </div>
                            {planData.cancel_at_period_end && (
                                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg font-medium">
                                    Cancels at period end
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-white/60 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <Users size={12} /> Team Seats
                                </div>
                                <UsageBar used={planData.seats_used} limit={planData.seat_limit} label="Seats used" />
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-white/60 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <Briefcase size={12} /> Active Jobs
                                </div>
                                <UsageBar used={planData.jobs_active} limit={planData.job_limit} label="Jobs active" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Plan Comparison */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-violet-500" /> Upgrade Your Plan
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {PLANS.map(plan => {
                            const isCurrent = planData?.plan === plan.id;

                            return (
                                <div key={plan.id}
                                    className={`relative bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4 transition-all ${plan.popular ? 'border-violet-300 shadow-violet-100 shadow-md scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}

                                    {/* Plan header */}
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center text-white flex-shrink-0`}>
                                            {plan.icon}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{plan.name}</p>
                                            <p className="text-xs text-gray-400">{plan.period}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
                                        {plan.price !== 'Custom' && <span className="text-gray-400 text-sm">/mo</span>}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-1.5 flex-1">
                                        {plan.features.map(f => (
                                            <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                                                <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <button
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={isCurrent || subscribing === plan.id}
                                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                            isCurrent
                                                ? 'bg-gray-100 text-gray-400 cursor-default'
                                                : plan.popular
                                                    ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-200'
                                                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {subscribing === plan.id ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 size={14} className="animate-spin" /> Processing...
                                            </span>
                                        ) : isCurrent ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Us' : `Upgrade to ${plan.name}`}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <p className="text-xs text-center text-gray-400">
                    Prices are in INR. Billed monthly. Cancel anytime via the Manage Billing portal.
                    All payments are processed securely by Stripe.
                </p>
            </div>
        </AppShell>
    );
}

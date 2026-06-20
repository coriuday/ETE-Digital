/**
 * Shared HR panel UI — design system tokens and reusable blocks
 * Matches candidate dashboard / settings panel patterns.
 */
/* eslint-disable react-refresh/only-export-components -- shared tokens + components */
import { Loader2 } from 'lucide-react';

export const hrPageCls = 'p-6 lg:p-8 space-y-5 max-w-6xl mx-auto';

export const inputCls =
    'w-full px-3.5 py-2.5 border border-border rounded-lg text-sm text-text-primary bg-surface placeholder:text-text-tertiary focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 outline-none transition-colors';

export const selectCls = inputCls;

export const labelCls = 'block text-sm font-medium text-text-primary mb-1.5';

export const cardCls = 'bg-surface rounded-xl border border-border shadow-card';

export const btnPrimary =
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 shadow-sm';

export const btnSecondary =
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-text-secondary hover:bg-background hover:text-text-primary transition-colors disabled:opacity-60';

export const btnDanger =
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60';

/** Application pipeline status badges (HR applications list + detail) */
export const APPLICATION_STATUS: Record<string, { label: string; color: string; dot: string }> = {
    pending:     { label: 'Applied',      color: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-500' },
    shortlisted: { label: 'Shortlisted',  color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
    reviewed:    { label: 'Reviewed',     color: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500' },
    rejected:    { label: 'Rejected',     color: 'bg-red-50 text-red-600 border-red-200',          dot: 'bg-red-500' },
    reopened:    { label: 'Reopened',     color: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500' },
    hired:       { label: 'Hired',        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    withdrawn:   { label: 'Withdrawn',    color: 'bg-background text-text-tertiary border-border', dot: 'bg-text-tertiary' },
};

export function HrCard({
    title,
    description,
    children,
    className = '',
    noPadding,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}) {
    return (
        <div className={`${cardCls} overflow-hidden ${className}`}>
            {title && (
                <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-base font-bold text-text-primary">{title}</h2>
                    {description && <p className="text-sm text-text-secondary mt-0.5">{description}</p>}
                </div>
            )}
            <div className={noPadding ? '' : 'p-6'}>{children}</div>
        </div>
    );
}

export function HrLoading({ label = 'Loading…' }: { label?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={28} className="animate-spin text-primary-500" />
            <p className="text-sm text-text-secondary">{label}</p>
        </div>
    );
}

export function HrErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span className="flex-1">{message}</span>
            {onRetry && (
                <button onClick={onRetry} className="underline text-xs font-medium flex-shrink-0">
                    Retry
                </button>
            )}
        </div>
    );
}

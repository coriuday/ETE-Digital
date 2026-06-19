/**
 * Shared settings UI helpers
 */
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const inputCls =
    'w-full px-3.5 py-2.5 border border-border rounded-lg text-sm text-text-primary bg-surface placeholder:text-text-tertiary focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 outline-none transition-colors';

export const labelCls = 'block text-sm font-medium text-text-primary mb-1.5';

export function SettingsCard({ title, description, children }: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
                <h2 className="text-base font-bold text-text-primary">{title}</h2>
                {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

export function SaveFeedback({ saving, success, error }: {
    saving: boolean;
    success: boolean;
    error: string;
}) {
    return (
        <>
            {error && (
                <div className="flex items-center gap-2 text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm mb-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}
            <div className="flex items-center gap-3 pt-2">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center gap-2 shadow-sm"
                >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
                </button>
                {success && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Saved successfully
                    </div>
                )}
            </div>
        </>
    );
}

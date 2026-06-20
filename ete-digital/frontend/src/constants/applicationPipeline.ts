/**
 * ATS application pipeline — shared stage config (UI hints; backend is authoritative)
 */

export type ApplicationStatus =
    | 'pending'
    | 'shortlisted'
    | 'reviewed'
    | 'hired'
    | 'rejected'
    | 'reopened'
    | 'withdrawn';

export interface PipelineStage {
    key: ApplicationStatus;
    label: string;
}

export interface StatusHistoryEntry {
    old_status: ApplicationStatus | null;
    new_status: ApplicationStatus;
    changed_by: string;
    changed_at: string;
    notes?: string | null;
}

export interface PipelineProgressStage {
    key: string;
    label: string;
    state: 'completed' | 'current' | 'pending' | 'skipped';
}

export interface PipelineProgress {
    current_stage: string;
    current_label: string;
    is_terminal: boolean;
    is_rejected: boolean;
    is_hired: boolean;
    stages: PipelineProgressStage[];
}

export const PIPELINE_STAGES: PipelineStage[] = [
    { key: 'pending', label: 'Applied' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'reviewed', label: 'Reviewed' },
    { key: 'hired', label: 'Hired' },
];

export const STAGE_LABELS: Record<string, string> = {
    pending: 'Applied',
    shortlisted: 'Shortlisted',
    reviewed: 'Reviewed',
    hired: 'Hired',
    rejected: 'Rejected',
    reopened: 'Reopened',
    withdrawn: 'Withdrawn',
};

export const ACTION_CONFIG: Record<string, { label: string; targetStatus: ApplicationStatus }> = {
    shortlisted: { label: 'Shortlist', targetStatus: 'shortlisted' },
    reviewed: { label: 'Mark Reviewed', targetStatus: 'reviewed' },
    hired: { label: 'Hire Candidate', targetStatus: 'hired' },
    rejected: { label: 'Reject', targetStatus: 'rejected' },
};

export const ACTION_STYLES: Record<string, string> = {
    shortlisted: 'bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700',
    reviewed: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
    hired: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700',
    rejected: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700',
};

export function stageLabel(status: string): string {
    return STAGE_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
}

/** Build timeline steps from status history for HR detail view */
export function buildTimelineFromHistory(history: StatusHistoryEntry[]): { label: string; date?: string; active: boolean }[] {
    const reached = new Set<string>();
    for (const h of history) {
        if (h.new_status) reached.add(h.new_status);
    }

    const steps: { label: string; date?: string; active: boolean }[] = [];

    for (const stage of PIPELINE_STAGES) {
        const entry = history.find(h => h.new_status === stage.key);
        steps.push({
            label: stage.label,
            date: entry?.changed_at,
            active: reached.has(stage.key),
        });
    }

    if (reached.has('reopened')) {
        const entry = history.find(h => h.new_status === 'reopened');
        steps.push({ label: 'Reopened', date: entry?.changed_at, active: true });
    }

    if (reached.has('rejected')) {
        const rej = history.find(h => h.new_status === 'rejected');
        steps.push({
            label: 'Rejected',
            date: rej?.changed_at,
            active: true,
        });
    }

    return steps;
}

export function derivePipelineProgress(status: string): PipelineProgress {
    const order = ['pending', 'shortlisted', 'reviewed', 'hired'];
    const rank = order.indexOf(status);

    if (status === 'rejected') {
        return {
            current_stage: status,
            current_label: 'Rejected',
            is_terminal: false,
            is_rejected: true,
            is_hired: false,
            stages: PIPELINE_STAGES.map(s => ({
                key: s.key,
                label: s.label,
                state: s.key === 'pending' ? 'completed' : 'skipped',
            })),
        };
    }

    if (status === 'reopened') {
        return {
            current_stage: status,
            current_label: 'Reopened',
            is_terminal: false,
            is_rejected: false,
            is_hired: false,
            stages: PIPELINE_STAGES.map(s => ({
                key: s.key,
                label: s.label,
                state: s.key === 'pending' ? 'completed' : 'pending',
            })),
        };
    }

    if (status === 'withdrawn') {
        return {
            current_stage: status,
            current_label: 'Withdrawn',
            is_terminal: true,
            is_rejected: false,
            is_hired: false,
            stages: [],
        };
    }

    const stages = PIPELINE_STAGES.map(s => {
        const sRank = order.indexOf(s.key);
        if (status === 'hired') return { key: s.key, label: s.label, state: 'completed' as const };
        if (sRank < rank) return { key: s.key, label: s.label, state: 'completed' as const };
        if (sRank === rank) return { key: s.key, label: s.label, state: 'current' as const };
        return { key: s.key, label: s.label, state: 'pending' as const };
    });

    return {
        current_stage: status,
        current_label: stageLabel(status),
        is_terminal: status === 'hired',
        is_rejected: false,
        is_hired: status === 'hired',
        stages,
    };
}

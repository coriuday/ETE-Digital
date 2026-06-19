/**
 * ApplicationProgressTimeline — candidate-facing pipeline progress
 */
import { CheckCircle2, Clock, XCircle, PartyPopper } from 'lucide-react';
import { PipelineProgress, stageLabel } from '../../constants/applicationPipeline';

export default function ApplicationProgressTimeline({ progress }: { progress: PipelineProgress }) {
    if (progress.is_rejected) {
        return (
            <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Application Progress</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={12} /> Applied</span>
                    <span className="flex items-center gap-1 text-red-600"><XCircle size={12} /> Rejected</span>
                </div>
            </div>
        );
    }

    if (progress.is_hired) {
        return (
            <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Application Progress</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    {progress.stages.map((s: PipelineProgress['stages'][number]) => (
                        <span key={s.key} className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 size={12} /> {s.label}
                        </span>
                    ))}
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <PartyPopper size={12} /> Hired
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Application Progress</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {progress.stages.map(s => {
                    if (s.state === 'completed') {
                        return (
                            <span key={s.key} className="flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 size={12} /> {s.label}
                            </span>
                        );
                    }
                    if (s.state === 'current') {
                        return (
                            <span key={s.key} className="flex items-center gap-1 text-blue-600 font-medium">
                                <Clock size={12} /> {s.label}
                            </span>
                        );
                    }
                    return (
                        <span key={s.key} className="flex items-center gap-1 text-gray-400">
                            <span className="w-3 h-3 rounded-full border border-gray-300" /> {s.label}
                        </span>
                    );
                })}
                {!progress.is_terminal && (
                    <span className="flex items-center gap-1 text-gray-400">
                        <Clock size={12} /> Decision pending
                    </span>
                )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">Current: {stageLabel(progress.current_stage)}</p>
        </div>
    );
}

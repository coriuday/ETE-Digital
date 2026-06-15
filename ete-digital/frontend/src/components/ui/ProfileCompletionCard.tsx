/**
 * ProfileCompletionCard — Task 1.2
 *
 * Shows a candidate their profile completeness score (0-100) with
 * animated ring + itemised checklist. Clicking "Complete Profile"
 * navigates to /settings.
 */
import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, User } from 'lucide-react';

interface Profile {
    full_name?: string | null;
    headline?: string | null;
    bio?: string | null;
    location?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    resume_url?: string | null;
    skills?: string[];
    experience_years?: string | null;
    social_links?: Record<string, string>;
}

interface CheckItem {
    key: string;
    label: string;
    weight: number;   // % contribution
    done: boolean;
}

function buildItems(profile: Profile | null | undefined): CheckItem[] {
    const p = profile ?? {};
    return [
        { key: 'name',       label: 'Full name',           weight: 15, done: !!p.full_name },
        { key: 'headline',   label: 'Professional headline',weight: 15, done: !!p.headline },
        { key: 'bio',        label: 'About / Bio',          weight: 10, done: !!p.bio },
        { key: 'location',   label: 'Location',             weight: 10, done: !!p.location },
        { key: 'skills',     label: 'Skills (≥3)',          weight: 20, done: (p.skills?.length ?? 0) >= 3 },
        { key: 'experience', label: 'Years of experience',  weight: 10, done: !!p.experience_years },
        { key: 'resume',     label: 'Resume uploaded',      weight: 15, done: !!p.resume_url },
        { key: 'social',     label: 'LinkedIn / GitHub',    weight: 5,  done: Object.keys(p.social_links ?? {}).length > 0 },
    ];
}

/* Animated SVG ring */
function Ring({ score }: { score: number }) {
    const size = 80;
    const r = 32;
    const circ = 2 * Math.PI * r;
    const dash = (Math.min(score, 100) / 100) * circ;
    const color =
        score >= 80 ? '#10b981'  // emerald
        : score >= 50 ? '#3b82f6' // blue
        : '#f59e0b';              // amber

    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={7} />
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke={color} strokeWidth={7}
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold leading-none" style={{ color }}>{score}</span>
                <span className="text-[9px] font-semibold text-gray-400 leading-none mt-0.5">%</span>
            </div>
        </div>
    );
}

interface ProfileCompletionCardProps {
    /** The user's UserProfile object (may be null/undefined on first load). */
    profile: Profile | null | undefined;
}

const ProfileCompletionCard = memo(function ProfileCompletionCard({ profile }: ProfileCompletionCardProps) {
    const items = useMemo(() => buildItems(profile), [profile]);
    const score = useMemo(() => items.reduce((sum, it) => sum + (it.done ? it.weight : 0), 0), [items]);
    const incomplete = items.filter(it => !it.done);

    // Don't show if fully complete
    if (score === 100) return null;

    const label =
        score >= 80 ? 'Almost there!'
        : score >= 50 ? 'Good progress'
        : 'Get started';

    const labelColor =
        score >= 80 ? 'text-emerald-600'
        : score >= 50 ? 'text-blue-600'
        : 'text-amber-600';

    return (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">Profile Completion</p>
                    <p className={`text-xs font-semibold ${labelColor}`}>{label}</p>
                </div>
                <Ring score={score} />
            </div>

            {/* Checklist — show up to 4 incomplete items */}
            <ul className="divide-y divide-border">
                {incomplete.slice(0, 4).map(item => (
                    <li key={item.key} className="flex items-center gap-3 px-5 py-2.5">
                        <Circle size={14} className="text-gray-300 flex-shrink-0" />
                        <span className="text-xs text-text-secondary flex-1">{item.label}</span>
                        <span className="text-[10px] font-bold text-gray-400">+{item.weight}%</span>
                    </li>
                ))}
                {/* Completed items preview */}
                {items.filter(it => it.done).slice(0, 2).map(item => (
                    <li key={item.key} className="flex items-center gap-3 px-5 py-2.5 opacity-50">
                        <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-xs text-text-secondary flex-1 line-through">{item.label}</span>
                    </li>
                ))}
            </ul>

            {/* CTA */}
            <div className="px-5 py-3 border-t border-border bg-gray-50/50">
                <Link
                    to="/settings"
                    className="flex items-center justify-between text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                    Complete your profile
                    <ArrowRight size={13} />
                </Link>
            </div>
        </div>
    );
});

export default ProfileCompletionCard;

/**
 * SettingsLayout — two-column settings shell (candidate + HR + admin)
 */
import { useEffect, useState, useMemo } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import AppShell from './AppShell';
import api from '../../api/client';
import { preferencesApi } from '../../api/preferences';
import { useAuthStore } from '../../stores/authStore';
import {
    User, Award, SlidersHorizontal, Ban, FileText, Lock,
    Shield, Bell, KeyRound, Building2, Users, Globe,
    ExternalLink,
} from 'lucide-react';

interface NavSection {
    href: string;
    label: string;
    icon: React.ReactNode;
    completion?: number | null;
    external?: boolean;
}

function calcCompletion(profile: Record<string, unknown> | null, prefs: Record<string, unknown> | null): Record<string, number> {
    const p = profile ?? {};
    const pr = prefs ?? {};
    const quals = (pr.qualifications as Record<string, unknown>) ?? {};

    const profileFields = [p.full_name, p.bio, p.location, p.phone].filter(Boolean);
    const qualFields = [
        ...(Array.isArray(p.skills) ? p.skills : []),
        p.experience_years,
        ...((quals.education as unknown[]) ?? []),
    ].filter(Boolean);
    const prefFields = [
        ...(Array.isArray(pr.preferred_job_types) ? pr.preferred_job_types : []),
        ...(Array.isArray(pr.preferred_locations) ? pr.preferred_locations : []),
        pr.salary_min,
    ].filter(v => v !== null && v !== undefined && v !== '');
    const filterFields = [
        ...(Array.isArray(pr.hidden_companies) ? pr.hidden_companies : []),
        ...(Array.isArray(pr.hidden_job_types) ? pr.hidden_job_types : []),
    ].filter(Boolean);
    const resumeFields = [p.resume_url, ...(Object.keys((pr.resume_builder as object) ?? {}))].filter(Boolean);

    const pct = (filled: number, total: number) => (total ? Math.round((filled / total) * 100) : 0);

    return {
        profile: pct(profileFields.length, 4),
        qualifications: pct(qualFields.length, 3),
        'job-preferences': pct(prefFields.length, 3),
        'job-filters': filterFields.length > 0 ? 100 : 0,
        resume: pct(resumeFields.length, 1),
    };
}

function ProgressRing({ pct }: { pct: number }) {
    const r = 18;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (pct / 100) * circumference;

    return (
        <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-border">
            <div className="relative w-11 h-11 flex-shrink-0">
                <svg width="44" height="44" className="-rotate-90">
                    <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3.5" className="text-border" />
                    <circle
                        cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3.5"
                        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                        className="text-primary-600 transition-all duration-500"
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary-700">
                    {pct}%
                </span>
            </div>
            <div>
                <p className="text-sm font-bold text-text-primary">Profile {pct}% complete</p>
                <p className="text-xs text-text-secondary">Finish setting up your account</p>
            </div>
        </div>
    );
}

function NavItem({ section, navLinkClass }: { section: NavSection; navLinkClass: (props: { isActive: boolean }) => string }) {
    if (section.external) {
        return (
            <Link to={section.href} className={navLinkClass({ isActive: false })}>
                <span className="flex-shrink-0">{section.icon}</span>
                <span className="flex-1 truncate">{section.label}</span>
                <ExternalLink size={12} className="text-text-tertiary flex-shrink-0" />
            </Link>
        );
    }

    return (
        <NavLink to={section.href} className={navLinkClass}>
            <span className="flex-shrink-0">{section.icon}</span>
            <span className="flex-1 truncate">{section.label}</span>
            {section.completion !== null && section.completion !== undefined && section.completion < 100 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {section.completion}%
                </span>
            )}
        </NavLink>
    );
}

export default function SettingsLayout() {
    const location = useLocation();
    const { user } = useAuthStore();
    const [completion, setCompletion] = useState<Record<string, number>>({});

    const isEmployer = user?.role === 'employer';
    const isCandidate = user?.role === 'candidate' || !user?.role;

    useEffect(() => {
        (async () => {
            try {
                const [meRes, prefs] = await Promise.all([
                    api.get('/api/users/me'),
                    preferencesApi.get().catch(() => null),
                ]);
                setCompletion(calcCompletion(meRes.data?.profile ?? null, prefs as Record<string, unknown> | null));
            } catch {
                setCompletion({});
            }
        })();
    }, [location.pathname]);

    const accountSections: NavSection[] = [
        { href: '/settings/profile', label: 'Profile', icon: <User size={16} />, completion: completion.profile },
        ...(isCandidate ? [
            { href: '/settings/qualifications', label: 'Qualifications', icon: <Award size={16} />, completion: completion.qualifications },
            { href: '/settings/job-preferences', label: 'Job Preferences', icon: <SlidersHorizontal size={16} />, completion: completion['job-preferences'] },
            { href: '/settings/job-filters', label: 'Job Filters', icon: <Ban size={16} />, completion: completion['job-filters'] },
            { href: '/settings/resume', label: 'Resume', icon: <FileText size={16} />, completion: completion.resume },
        ] : []),
        { href: '/settings/password', label: 'Password', icon: <Lock size={16} />, completion: null },
    ];

    const hrSections: NavSection[] = isEmployer ? [
        { href: '/settings/company', label: 'Company Profile', icon: <Building2 size={16} /> },
        { href: '/hr/team', label: 'Team', icon: <Users size={16} />, external: true },
        { href: '/hr/domain-verify', label: 'Domain Verification', icon: <Globe size={16} />, external: true },
    ] : [];

    const securitySections: NavSection[] = [
        { href: '/settings/privacy', label: 'Privacy & Data', icon: <Shield size={16} />, completion: null },
        { href: '/settings/notifications', label: 'Notifications', icon: <Bell size={16} />, completion: null },
        { href: '/settings/2fa', label: 'Two-Factor Auth', icon: <KeyRound size={16} />, completion: null },
    ];

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : 'text-text-secondary hover:text-text-primary hover:bg-background border border-transparent'
        }`;

    const renderSection = (title: string, sections: NavSection[]) => (
        <div className="mb-4">
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">{title}</p>
            <nav className="space-y-0.5">
                {sections.map(s => (
                    <NavItem key={s.href + s.label} section={s} navLinkClass={navLinkClass} />
                ))}
            </nav>
        </div>
    );

    const subtitle = isEmployer
        ? 'Manage your account and company settings'
        : 'Manage your account and job search preferences';

    const overallPct = useMemo(() => {
        const vals = Object.values(completion);
        if (!vals.length) return 0;
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }, [completion]);

    return (
        <AppShell>
            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-60px)] bg-background">
                {/* Side nav — desktop */}
                <aside className="hidden lg:block w-60 flex-shrink-0 border-r border-border bg-surface p-4">
                    <ProgressRing pct={overallPct} />
                    <p className="px-3 mb-4 text-sm text-text-secondary">{subtitle}</p>
                    {renderSection('Account', accountSections)}
                    {hrSections.length > 0 && renderSection('Company', hrSections)}
                    {renderSection('Security', securitySections)}
                </aside>

                {/* Horizontal tabs — mobile */}
                <div className="lg:hidden border-b border-border bg-surface overflow-x-auto flex-shrink-0">
                    <nav className="flex gap-1 px-4 py-2 min-w-max">
                        {[...accountSections, ...hrSections, ...securitySections].map(s => (
                            s.external ? (
                                <Link
                                    key={s.href + s.label}
                                    to={s.href}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap text-text-secondary hover:bg-background"
                                >
                                    {s.icon}{s.label}
                                </Link>
                            ) : (
                                <NavLink
                                    key={s.href}
                                    to={s.href}
                                    className={({ isActive }) =>
                                        `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                                            isActive ? 'bg-primary-600 text-white' : 'text-text-secondary hover:bg-background'
                                        }`
                                    }
                                >
                                    {s.icon}{s.label}
                                </NavLink>
                            )
                        ))}
                    </nav>
                </div>

                {/* Content — fills remaining width, no empty canvas below */}
                <div className="flex-1 min-w-0">
                    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 lg:py-8">
                        <Outlet />
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

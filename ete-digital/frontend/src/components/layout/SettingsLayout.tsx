/**
 * SettingsLayout — two-column Indeed-style settings shell
 */
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import AppShell from './AppShell';
import api from '../../api/client';
import { preferencesApi } from '../../api/preferences';
import { useAuthStore } from '../../stores/authStore';
import {
    User, Award, SlidersHorizontal, Ban, FileText, Lock,
    Shield, Bell, KeyRound,
} from 'lucide-react';

interface NavSection {
    href: string;
    label: string;
    icon: React.ReactNode;
    completion?: number | null;
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

export default function SettingsLayout() {
    const location = useLocation();
    const { user } = useAuthStore();
    const [completion, setCompletion] = useState<Record<string, number>>({});

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

    const sections: NavSection[] = [
        { href: '/settings/profile', label: 'Profile', icon: <User size={16} />, completion: completion.profile },
        ...(user?.role === 'candidate' ? [
            { href: '/settings/qualifications', label: 'Qualifications', icon: <Award size={16} />, completion: completion.qualifications },
            { href: '/settings/job-preferences', label: 'Job Preferences', icon: <SlidersHorizontal size={16} />, completion: completion['job-preferences'] },
            { href: '/settings/job-filters', label: 'Job Filters', icon: <Ban size={16} />, completion: completion['job-filters'] },
            { href: '/settings/resume', label: 'Resume', icon: <FileText size={16} />, completion: completion.resume },
        ] : []),
        { href: '/settings/password', label: 'Password', icon: <Lock size={16} />, completion: null },
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

    return (
        <AppShell>
            <div className="min-h-full flex flex-col bg-background">
                <div className="border-b border-border bg-surface px-6 py-5">
                    <h1 className="text-xl font-bold text-text-primary">Settings</h1>
                    <p className="text-sm text-text-secondary mt-0.5">Manage your account and job search preferences</p>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row min-h-0">
                    {/* Side nav — desktop */}
                    <aside className="hidden lg:block w-56 flex-shrink-0 border-r border-border bg-surface p-4">
                        <nav className="space-y-0.5 sticky top-4">
                            {sections.map(s => (
                                <NavLink key={s.href} to={s.href} className={navLinkClass}>
                                    <span className="flex-shrink-0">{s.icon}</span>
                                    <span className="flex-1 truncate">{s.label}</span>
                                    {s.completion !== null && s.completion !== undefined && s.completion < 100 && (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                            {s.completion}%
                                        </span>
                                    )}
                                </NavLink>
                            ))}
                        </nav>
                    </aside>

                    {/* Horizontal tabs — mobile */}
                    <div className="lg:hidden border-b border-border bg-surface overflow-x-auto">
                        <nav className="flex gap-1 px-4 py-2 min-w-max">
                            {sections.map(s => (
                                <NavLink
                                    key={s.href}
                                    to={s.href}
                                    className={({ isActive }) =>
                                        `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                                            isActive
                                                ? 'bg-primary-600 text-white'
                                                : 'text-text-secondary hover:bg-background'
                                        }`
                                    }
                                >
                                    {s.icon}
                                    {s.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <main className="flex-1 overflow-y-auto">
                        <div className="max-w-2xl mx-auto w-full px-6 py-8">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </AppShell>
    );
}

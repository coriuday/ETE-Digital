/**
 * CandidateProfilePage — HR view of a candidate's full profile for an application
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { jobsApi, CandidateProfile } from '../../api/jobs';
import {
    ArrowLeft, Mail, MapPin, Briefcase, FileText, ExternalLink,
    Loader2, User, Link2, Trophy,
} from 'lucide-react';

export default function CandidateProfilePage() {
    const { applicationId } = useParams<{ applicationId: string }>();
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!applicationId) return;
        (async () => {
            try {
                const data = await jobsApi.getCandidateProfile(applicationId);
                setProfile(data);
            } catch {
                setError('Failed to load candidate profile.');
            } finally {
                setLoading(false);
            }
        })();
    }, [applicationId]);

    if (loading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center py-32">
                    <Loader2 size={32} className="animate-spin text-primary-500" />
                </div>
            </AppShell>
        );
    }

    if (error || !profile) {
        return (
            <AppShell>
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <p className="text-text-secondary">{error || 'Profile not found.'}</p>
                    <Link to={`/hr/applications/${applicationId}`} className="text-primary-600 text-sm font-medium hover:underline">
                        Back to application
                    </Link>
                </div>
            </AppShell>
        );
    }

    const socialEntries = profile.social_links
        ? Object.entries(profile.social_links).filter(([, v]) => v)
        : [];

    return (
        <AppShell>
            <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
                <Link
                    to={`/hr/applications/${applicationId}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                    <ArrowLeft size={15} /> Back to application
                </Link>

                <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center text-2xl font-extrabold text-primary-700 flex-shrink-0">
                            {(profile.full_name || 'U')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold text-text-primary">{profile.full_name || 'Unknown Candidate'}</h1>
                            {profile.headline && (
                                <p className="text-sm text-text-secondary mt-0.5">{profile.headline}</p>
                            )}
                            <p className="text-sm text-text-tertiary mt-2 flex items-center gap-1.5">
                                <Mail size={13} /> {profile.email}
                            </p>
                            {profile.location && (
                                <p className="text-sm text-text-tertiary mt-1 flex items-center gap-1.5">
                                    <MapPin size={13} /> {profile.location}
                                </p>
                            )}
                            {profile.experience_years && (
                                <p className="text-sm text-text-tertiary mt-1 flex items-center gap-1.5">
                                    <Briefcase size={13} /> {profile.experience_years} years experience
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-5">
                        {profile.resume_url && (
                            <a
                                href={profile.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-100 rounded-xl hover:bg-primary-100 transition-colors"
                            >
                                <FileText size={13} /> Download Resume
                            </a>
                        )}
                        {profile.has_shared_vault && profile.vault_share_token && (
                            <a
                                href={`/shared/${profile.vault_share_token}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded-xl hover:bg-violet-100 transition-colors"
                            >
                                <Trophy size={13} /> View Portfolio <ExternalLink size={11} />
                            </a>
                        )}
                    </div>
                </div>

                {profile.bio && (
                    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                        <h2 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                            <User size={16} className="text-text-tertiary" /> About
                        </h2>
                        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                )}

                {profile.skills.length > 0 && (
                    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                        <h2 className="font-bold text-text-primary mb-3">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map(skill => (
                                <span
                                    key={skill}
                                    className="px-2.5 py-1 text-xs font-medium bg-primary-50 text-primary-700 rounded-lg border border-primary-100"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {socialEntries.length > 0 && (
                    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                        <h2 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                            <Link2 size={16} className="text-text-tertiary" /> Links
                        </h2>
                        <ul className="space-y-2">
                            {socialEntries.map(([key, url]) => (
                                <li key={key}>
                                    <a
                                        href={url.startsWith('http') ? url : `https://${url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary-600 hover:underline capitalize flex items-center gap-1.5"
                                    >
                                        {key} <ExternalLink size={12} />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {!profile.bio && profile.skills.length === 0 && !profile.resume_url && !profile.has_shared_vault && (
                    <div className="bg-surface rounded-2xl border border-border p-8 text-center">
                        <p className="text-text-secondary text-sm">
                            This candidate has not completed their profile yet. Contact them via email for more details.
                        </p>
                    </div>
                )}
            </div>
        </AppShell>
    );
}

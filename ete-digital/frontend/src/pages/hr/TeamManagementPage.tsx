/**
 * TeamManagementPage — HR owners manage their organisation's team members
 *
 * Features:
 *  - List all members with role badges
 *  - Invite recruiter by email (copies invite link to clipboard)
 *  - Change member role (owner only)
 *  - Remove member (owner only)
 *  - Accept Invite flow handled via /hr/accept-invite?token=... route
 */
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import api from '../../api/client';
import {
    Users, UserPlus, Trash2, ChevronDown, Copy,
    CheckCircle2, Loader2, AlertCircle, ShieldCheck,
    Crown, UserCog, Eye, Briefcase,
} from 'lucide-react';

interface Member {
    user_id: string;
    email: string;
    full_name: string | null;
    role: string;
    joined_at: string;
    invited_by: string | null;
}

const ROLE_OPTIONS = ['recruiter', 'hiring_manager', 'admin', 'viewer'];

const roleConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    owner:          { label: 'Owner',          icon: <Crown size={13} />,    color: 'bg-amber-100 text-amber-700 border-amber-200' },
    admin:          { label: 'Admin',          icon: <ShieldCheck size={13} />, color: 'bg-violet-100 text-violet-700 border-violet-200' },
    hiring_manager: { label: 'Hiring Manager', icon: <UserCog size={13} />,  color: 'bg-blue-100 text-blue-700 border-blue-200' },
    recruiter:      { label: 'Recruiter',      icon: <Briefcase size={13} />, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    viewer:         { label: 'Viewer',         icon: <Eye size={13} />,      color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function RoleBadge({ role }: { role: string }) {
    const cfg = roleConfig[role] ?? roleConfig['viewer'];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86_400_000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 30) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

export default function TeamManagementPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Invite form
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('recruiter');
    const [inviting, setInviting] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);

    // Role change
    const [changingRole, setChangingRole] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const [toast, setToast] = useState<string | null>(null);
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

    const fetchMembers = async () => {
        try {
            const res = await api.get('/organizations/members');
            setMembers(res.data);
        } catch (e: any) {
            if (e.response?.status === 404) {
                setError("You don't have an organisation yet. Go to Domain Verify to set one up first.");
            } else {
                setError('Failed to load team members.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMembers(); }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        setError('');
        try {
            const res = await api.post('/organizations/invite', { email: inviteEmail, role: inviteRole });
            setInviteLink(res.data.invite_link);
            showToast(`Invite created for ${inviteEmail}`);
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Failed to create invite.');
        } finally {
            setInviting(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setChangingRole(userId);
        try {
            await api.patch(`/organizations/members/${userId}/role`, { role: newRole });
            setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
            showToast('Role updated.');
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Failed to update role.');
        } finally {
            setChangingRole(null);
        }
    };

    const handleRemove = async (userId: string, email: string) => {
        if (!window.confirm(`Remove ${email} from your team?`)) return;
        setRemovingId(userId);
        try {
            await api.delete(`/organizations/members/${userId}`);
            setMembers(prev => prev.filter(m => m.user_id !== userId));
            showToast('Member removed.');
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Failed to remove member.');
        } finally {
            setRemovingId(null);
        }
    };

    const isOwner = members.some(m => m.role === 'owner');

    return (
        <AppShell>
            {toast && (
                <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 size={16} /> {toast}
                </div>
            )}

            <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                            <Users size={20} className="text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Team Management</h1>
                            <p className="text-sm text-gray-500">{members.length} member{members.length !== 1 ? 's' : ''} in your organisation</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setShowInvite(v => !v); setInviteLink(''); }}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
                    >
                        <UserPlus size={16} /> Invite Recruiter
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Invite Panel */}
                {showInvite && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h2 className="font-semibold text-gray-900">Invite a Team Member</h2>
                        {!inviteLink ? (
                            <form onSubmit={handleInvite} className="space-y-3">
                                <div className="flex gap-3">
                                    <input
                                        type="email" required value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="recruiter@company.com"
                                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                    />
                                    <select
                                        value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                                        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white"
                                    >
                                        {ROLE_OPTIONS.map(r => (
                                            <option key={r} value={r}>{roleConfig[r]?.label ?? r}</option>
                                        ))}
                                    </select>
                                    <button type="submit" disabled={inviting}
                                        className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                                        {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                                        {inviting ? 'Creating...' : 'Send Invite'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">Share this invite link with <strong>{inviteEmail}</strong>:</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 break-all">
                                        {inviteLink}
                                    </code>
                                    <button onClick={copyLink}
                                        className={`p-2.5 rounded-xl border transition-colors flex-shrink-0 ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                        {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400">Link expires in 7 days. The invitee must be registered on JobsRow.</p>
                                <button onClick={() => { setInviteLink(''); setInviteEmail(''); }}
                                    className="text-sm text-violet-600 hover:underline">Invite another person</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Members Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-violet-500" size={28} />
                    </div>
                ) : members.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                        <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users size={24} className="text-violet-400" />
                        </div>
                        <p className="font-semibold text-gray-700">No team yet</p>
                        <p className="text-sm text-gray-400 mt-1">Invite your first recruiter to get started.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/60">
                            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                <div className="col-span-4">Member</div>
                                <div className="col-span-3">Role</div>
                                <div className="col-span-3">Joined</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {members.map(member => (
                                <div key={member.user_id} className="px-5 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50/50 transition-colors">
                                    {/* Member info */}
                                    <div className="col-span-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {member.email[0].toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {member.full_name ?? member.email.split('@')[0]}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">{member.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Role */}
                                    <div className="col-span-3">
                                        {member.role === 'owner' ? (
                                            <RoleBadge role="owner" />
                                        ) : isOwner ? (
                                            <div className="relative">
                                                <select
                                                    value={member.role}
                                                    disabled={changingRole === member.user_id}
                                                    onChange={e => handleRoleChange(member.user_id, e.target.value)}
                                                    className="appearance-none pl-2 pr-6 py-1 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:border-violet-300 focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
                                                >
                                                    {ROLE_OPTIONS.map(r => (
                                                        <option key={r} value={r}>{roleConfig[r]?.label ?? r}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                        ) : (
                                            <RoleBadge role={member.role} />
                                        )}
                                    </div>

                                    {/* Joined */}
                                    <div className="col-span-3">
                                        <p className="text-sm text-gray-500">{relativeTime(member.joined_at)}</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 flex justify-end">
                                        {member.role !== 'owner' && isOwner && (
                                            <button
                                                onClick={() => handleRemove(member.user_id, member.email)}
                                                disabled={removingId === member.user_id}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove member"
                                            >
                                                {removingId === member.user_id
                                                    ? <Loader2 size={15} className="animate-spin" />
                                                    : <Trash2 size={15} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info card */}
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-sm text-violet-700 flex items-start gap-3">
                    <ShieldCheck size={18} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">Role Permissions</p>
                        <ul className="space-y-0.5 text-xs text-violet-600">
                            <li><strong>Owner</strong> — full access, billing, invite &amp; remove members</li>
                            <li><strong>Admin</strong> — manage jobs, applications, invite members</li>
                            <li><strong>Hiring Manager</strong> — manage jobs &amp; grade tryouts</li>
                            <li><strong>Recruiter</strong> — view applications, post jobs</li>
                            <li><strong>Viewer</strong> — read-only access</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

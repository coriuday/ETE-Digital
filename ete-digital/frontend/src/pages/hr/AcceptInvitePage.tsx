/**
 * AcceptInvitePage — Invitee lands here via /hr/accept-invite?token=...
 * Automatically calls the backend to join the organisation.
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { organizationsApi } from '../../api/organizations';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function AcceptInvitePage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get('token');

    const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setState('error');
            setMessage('No invite token found in the link. Check the URL and try again.');
            return;
        }
        (async () => {
            try {
                const res = await organizationsApi.acceptInvite(token);
                setMessage(res.message);
                setState('success');
                // Redirect to team page after 3s
                setTimeout(() => navigate('/hr/team'), 3000);
            } catch (e: any) {
                setState('error');
                setMessage(e.response?.data?.detail ?? 'Failed to accept invite. The link may be expired or invalid.');
            }
        })();
    }, [token]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center space-y-5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
                    state === 'loading' ? 'bg-violet-100' :
                    state === 'success' ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                    {state === 'loading' && <Loader2 size={32} className="animate-spin text-violet-500" />}
                    {state === 'success' && <CheckCircle2 size={32} className="text-emerald-600" />}
                    {state === 'error' && <AlertCircle size={32} className="text-red-500" />}
                </div>

                <h1 className="text-xl font-bold text-gray-900">
                    {state === 'loading' && 'Accepting Invite...'}
                    {state === 'success' && 'Welcome to the team! 🎉'}
                    {state === 'error' && 'Invite Error'}
                </h1>

                <p className="text-gray-500 text-sm leading-relaxed">{message}</p>

                {state === 'success' && (
                    <p className="text-xs text-gray-400">Redirecting to Team page in 3 seconds...</p>
                )}
                {state === 'error' && (
                    <button onClick={() => navigate('/hr/dashboard')}
                        className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
                        Go to Dashboard
                    </button>
                )}
            </div>
        </div>
    );
}

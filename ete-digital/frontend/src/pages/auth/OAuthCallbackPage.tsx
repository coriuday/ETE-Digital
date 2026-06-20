/**
 * OAuth Callback Page
 * Handles the redirect from Google OAuth backend endpoint.
 * URL: /auth/callback#access_token=...&refresh_token=...&role=...
 *   or /auth/callback#partial_token=...&requires_2fa=1&role=... (MFA users)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Loader2, AlertCircle } from 'lucide-react';

export default function OAuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setTokensFromOAuth } = useAuthStore();
    const [error, setError] = useState('');

    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            const messages: Record<string, string> = {
                oauth_denied: 'You cancelled the sign-in. Please try again.',
                oauth_no_code: 'Sign-in failed: no authorization code received.',
                oauth_token_exchange_failed: 'Sign-in failed: could not verify with Google.',
                oauth_userinfo_failed: 'Sign-in failed: could not retrieve your Google profile.',
                oauth_missing_data: 'Sign-in failed: Google did not return required account data.',
            };
            setError(messages[errorParam] || 'Sign-in failed. Please try again.');
            return;
        }

        const hash = window.location.hash.slice(1);
        if (!hash) {
            setError('Invalid callback — no authentication data received.');
            return;
        }

        const params = new URLSearchParams(hash);
        const requires2fa = params.get('requires_2fa') === '1';
        const partialToken = params.get('partial_token');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const role = params.get('role') ?? 'candidate';

        window.history.replaceState(null, '', window.location.pathname);

        if (requires2fa && partialToken) {
            useAuthStore.setState({
                requiresTwoFactor: true,
                partialToken,
                isLoading: false,
                error: null,
            });
            navigate('/login', { replace: true, state: { oauthMfa: true, role } });
            return;
        }

        if (!accessToken || !refreshToken) {
            setError('Invalid callback — missing authentication tokens.');
            return;
        }

        setTokensFromOAuth(accessToken, refreshToken, role).then(() => {
            const dashboardMap: Record<string, string> = {
                employer: '/hr/dashboard',
                admin: '/admin',
                candidate: '/dashboard',
            };
            navigate(dashboardMap[role] ?? '/dashboard', { replace: true });
        });
    }, [searchParams, navigate, setTokensFromOAuth]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="text-red-500" size={28} />
                    </div>
                    <h1 className="text-lg font-bold text-gray-900 mb-2">Sign-in failed</h1>
                    <p className="text-gray-600 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700"
                    >
                        Back to login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
            <Loader2 className="animate-spin text-primary-600" size={36} />
            <p className="text-sm text-gray-600">Completing sign-in…</p>
        </div>
    );
}

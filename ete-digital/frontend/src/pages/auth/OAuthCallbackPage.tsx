/**
 * OAuth Callback Page
 * Handles the redirect from Google OAuth backend endpoint.
 * URL: /auth/callback?access_token=...&refresh_token=...&role=...
 *
 * This page:
 *  1. Reads tokens from URL query params
 *  2. Saves them to the authStore
 *  3. Redirects user to their role-appropriate dashboard
 *  4. Shows error state if something went wrong
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
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const role = searchParams.get('role') ?? 'candidate';
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

        if (!accessToken || !refreshToken) {
            setError('Invalid callback — missing authentication data.');
            return;
        }

        // Store tokens and hydrate user in authStore
        setTokensFromOAuth(accessToken, refreshToken, role).then(() => {
            const dashboardMap: Record<string, string> = {
                employer: '/employer/dashboard',
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
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Sign-In Failed</h1>
                    <p className="text-gray-500 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="animate-spin text-violet-600 mx-auto mb-3" size={36} />
                <p className="text-gray-600 font-medium">Signing you in with Google…</p>
            </div>
        </div>
    );
}

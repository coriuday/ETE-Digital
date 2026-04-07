/**
 * Email Verification Page
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Briefcase, Mail } from 'lucide-react';
import api from '../../api/client';

type VerifyState = 'loading' | 'success' | 'error' | 'no-token';

export default function EmailVerificationPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const [state, setState] = useState<VerifyState>(token ? 'loading' : 'no-token');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) { setState('no-token'); return; }
        const verify = async () => {
            try {
                await api.post('/api/auth/verify-email', { token });
                setState('success');
            } catch (err: any) {
                setErrorMsg(err.response?.data?.detail || 'Verification failed. The link may have expired.');
                setState('error');
            }
        };
        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-secondary-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">Jobsrow</span>
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                    {state === 'loading' && (
                        <>
                            <Loader2 className="w-14 h-14 text-primary-600 animate-spin mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email…</h2>
                            <p className="text-gray-500 text-sm">Please wait a moment.</p>
                        </>
                    )}
                    {state === 'success' && (
                        <>
                            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-7 h-7 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h2>
                            <p className="text-gray-500 text-sm mb-6">Your account is now active. You can log in and start using Jobsrow.</p>
                            <Link to="/login" className="inline-block px-8 py-3 bg-gradient-to-r from-primary-600 to-secondary-700 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity">
                                Go to Login
                            </Link>
                        </>
                    )}
                    {state === 'error' && (
                        <>
                            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <XCircle className="w-7 h-7 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification failed</h2>
                            <p className="text-gray-500 text-sm mb-4">{errorMsg}</p>
                            <div className="flex gap-3 justify-center">
                                <Link to="/register" className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:opacity-90">Register Again</Link>
                                <Link to="/contact" className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:border-primary-400">Contact Support</Link>
                            </div>
                        </>
                    )}
                    {state === 'no-token' && (
                        <>
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-7 h-7 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h2>
                            <p className="text-gray-500 text-sm mb-6">We sent a verification link to your email address. Click the link to activate your account. The link expires in 24 hours.</p>
                            <p className="text-xs text-gray-400">
                                Didn't receive it? Check your spam folder or{' '}
                                <Link to="/contact" className="text-primary-600 hover:underline">contact support</Link>.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

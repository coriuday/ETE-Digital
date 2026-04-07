/**
 * Reset Password Page - Reads token from URL search params
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, CheckCircle, Loader2, AlertCircle, Briefcase } from 'lucide-react';
import api from '../../api/client';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) setError('Invalid or missing reset token. Please request a new password reset.');
    }, [token]);

    const passwordRules = [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'One lowercase letter', met: /[a-z]/.test(password) },
        { label: 'One number', met: /\d/.test(password) },
        { label: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    const allRulesMet = passwordRules.every(r => r.met);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allRulesMet) { setError('Please meet all password requirements.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        setLoading(true);
        setError('');
        try {
            await api.post('/api/auth/reset-password', { token, new_password: password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Reset failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

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

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {success ? (
                        <div className="text-center">
                            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-7 h-7 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password reset!</h2>
                            <p className="text-gray-500 text-sm">Your password has been updated successfully. Redirecting to login…</p>
                            <Link to="/login" className="mt-4 inline-block text-primary-600 text-sm font-medium hover:underline">Go to Login now</Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <KeyRound className="w-7 h-7 text-primary-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Set new password</h1>
                                <p className="text-gray-500 text-sm">Choose a strong password for your account.</p>
                            </div>

                            {error && !token ? (
                                <div className="text-center">
                                    <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl p-4 mb-4">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                    <Link to="/forgot-password" className="text-primary-600 text-sm font-medium hover:underline">Request new reset link</Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                        <div className="relative">
                                            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                                placeholder="Enter new password" required
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" />
                                            <button type="button" onClick={() => setShowPw(!showPw)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {password && (
                                            <ul className="mt-2 space-y-1">
                                                {passwordRules.map((rule) => (
                                                    <li key={rule.label} className={`flex items-center gap-2 text-xs ${rule.met ? 'text-green-600' : 'text-gray-400'}`}>
                                                        <CheckCircle className={`w-3 h-3 ${rule.met ? 'text-green-500' : 'text-gray-300'}`} />
                                                        {rule.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password" required
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" />
                                            <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {confirmPassword && password !== confirmPassword && (
                                            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl p-3">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    )}

                                    <button type="submit" disabled={loading || !allRulesMet || password !== confirmPassword}
                                        className="w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-700 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</> : 'Reset Password'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <Link to="/login" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

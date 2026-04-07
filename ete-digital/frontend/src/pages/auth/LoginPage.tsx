/**
 * Login Page — Split 40/60 layout with brand panel left, clean form right
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Briefcase, Eye, EyeOff, ArrowRight, Star,
    Trophy, ShieldCheck, Loader2
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const brandPoints = [
    { icon: <Star size={18} className="text-amber-400" />, text: 'Skill-based Job Tryouts' },
    { icon: <Trophy size={18} className="text-violet-300" />, text: 'Talent Vault Portfolio' },
    { icon: <ShieldCheck size={18} className="text-emerald-400" />, text: 'Verified Skills, Zero Guesswork' },
];

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            // role is now in the store — read it from useAuthStore
            const role = useAuthStore.getState().user?.role;
            navigate(role === 'employer' ? '/employer/dashboard' : role === 'admin' ? '/admin' : '/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.detail ?? 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ── Left brand panel ──────────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-br from-slate-900 via-blue-950 to-violet-900 relative overflow-hidden">
                {/* Background orbs */}
                <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 right-0 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 flex items-center justify-center">
                            <Briefcase size={18} className="text-white" />
                        </div>
                        <span className="text-white font-extrabold text-xl tracking-tight">Jobsrow</span>
                    </div>

                    {/* Main copy */}
                    <div>
                        <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                            Hire on{' '}
                            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                                skills.
                            </span>
                            <br />Not just résumés.
                        </h2>
                        <p className="text-blue-200 text-base leading-relaxed mb-8 max-w-xs">
                            Join the platform where talent is proven through action, not claims.
                        </p>

                        <div className="space-y-3">
                            {brandPoints.map((p) => (
                                <div key={p.text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
                                    {p.icon}
                                    <span className="text-sm text-white font-medium">{p.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom quote */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                        <p className="text-blue-100 text-sm italic leading-relaxed">
                            "We hired our best engineer in 4 days — not weeks.
                            The tryout made the decision obvious."
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">SC</div>
                            <div>
                                <p className="text-white text-xs font-semibold">Sarah Chen</p>
                                <p className="text-blue-300 text-xs">CTO, NexaCloud</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right form panel ──────────────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                            <Briefcase size={16} className="text-white" />
                        </div>
                        <span className="font-extrabold text-gray-900 text-lg">Jobsrow</span>
                    </div>

                    <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Welcome back</h1>
                    <p className="text-gray-500 mb-8">Sign in to your account to continue</p>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all placeholder:text-gray-400"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-semibold text-gray-700">Password</label>
                                <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPw ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all placeholder:text-gray-400 pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/20 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                            ) : (
                                <>Sign In <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>

                    <div className="relative my-7 flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">OR</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <p className="text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                            Sign up free
                        </Link>
                    </p>

                    <p className="text-center text-xs text-gray-300 mt-6">
                        Jobsrow © 2025 · Building the future of hiring
                    </p>
                </div>
            </div>
        </div>
    );
}

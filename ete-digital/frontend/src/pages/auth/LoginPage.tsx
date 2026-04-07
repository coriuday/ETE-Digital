/**
 * LoginPage — Premium split-screen redesign
 * Design system: "Indigo Ether" (Stitch) — deep indigo/violet palette, glassmorphism, Inter + Noto Serif
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Star, Trophy, ShieldCheck, Loader2, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

const brandPoints = [
    { icon: <Star size={16} className="text-violet-300" />, text: 'Real Skill-Based Job Tryouts' },
    { icon: <Trophy size={16} className="text-amber-300" />, text: 'Verified Talent Portfolio Vault' },
    { icon: <ShieldCheck size={16} className="text-emerald-400" />, text: 'Top MNC Opportunities, Proven Fast' },
];

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

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
            const role = useAuthStore.getState().user?.role;
            navigate(role === 'employer' ? '/employer/dashboard' : role === 'admin' ? '/admin' : '/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.detail ?? 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-['Inter',sans-serif]">

            {/* ── LEFT BRAND PANEL ─────────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col"
                style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>

                {/* Decorative blurred orbs */}
                <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-30"
                    style={{ background: 'radial-gradient(circle, #7c4dff, transparent)' }} />
                <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #4a1dff, transparent)' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />

                {/* Dot grid texture */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full p-12">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 w-fit group">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                            <LayoutGrid size={18} className="text-white" />
                        </div>
                        <div className="flex items-baseline">
                            <span className="text-xl font-extrabold text-white tracking-tight">Jobs</span>
                            <span className="text-xl font-extrabold tracking-tight" style={{ backgroundImage: 'linear-gradient(90deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>row</span>
                        </div>
                    </Link>

                    {/* Hero copy */}
                    <div className="py-8">
                        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-4">India's #1 Outcome-Driven Platform</p>
                        <h1 className="text-4xl font-bold text-white leading-tight mb-5"
                            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
                            Your Skills.<br />
                            <span style={{ backgroundImage: 'linear-gradient(90deg, #a78bfa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Your Proof.</span><br />
                            Your Career.
                        </h1>
                        <p className="text-violet-200 text-base leading-relaxed max-w-xs mb-8">
                            Join India's platform where talent is proven through action — not just résumés.
                        </p>

                        {/* Feature callouts */}
                        <div className="space-y-3">
                            {brandPoints.map((p) => (
                                <div key={p.text}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
                                    {p.icon}
                                    <span className="text-sm text-white font-medium">{p.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Testimonial card */}
                    <div className="rounded-2xl p-5"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>
                        <p className="text-violet-100 text-sm italic leading-relaxed mb-4">
                            "We found our best backend engineer in 4 days — not weeks. The tryout format made the decision obvious."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ background: 'linear-gradient(135deg, #7c4dff, #4f46e5)' }}>SC</div>
                            <div>
                                <p className="text-white text-xs font-semibold">Sarah Chen</p>
                                <p className="text-violet-300 text-xs">CTO, NexaCloud</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT FORM PANEL ─────────────────────────────────────────── */}
            <div className={`flex-1 flex items-center justify-center px-6 py-12 transition-colors duration-200
                ${isDark ? 'bg-[#0d0b1e]' : 'bg-gray-50'}`}>
                <div className="w-full max-w-md">

                    {/* Mobile logo */}
                    <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden w-fit">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c4dff)' }}>
                            <LayoutGrid size={15} className="text-white" />
                        </div>
                        <span className={`font-extrabold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Jobsrow</span>
                    </Link>

                    <h2 className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
                        style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
                        Welcome back
                    </h2>
                    <p className={`text-sm mb-8 ${isDark ? 'text-violet-300' : 'text-gray-500'}`}>
                        Sign in to continue your journey on Jobsrow
                    </p>

                    {/* Error banner */}
                    {error && (
                        <div className={`mb-6 px-4 py-3 rounded-xl text-sm border
                            ${isDark
                                ? 'bg-red-950/50 border-red-800/50 text-red-300'
                                : 'bg-red-50 border-red-200 text-red-700'}`}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Email */}
                        <div>
                            <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-violet-200' : 'text-gray-700'}`}>
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400
                                    ${isDark
                                        ? 'bg-[#1f1c39] text-white border border-[#47464f]/40 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
                                        : 'bg-white text-gray-900 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'}`}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className={`block text-sm font-semibold ${isDark ? 'text-violet-200' : 'text-gray-700'}`}>
                                    Password
                                </label>
                                <Link to="/forgot-password"
                                    className={`text-xs font-medium hover:underline ${isDark ? 'text-violet-400' : 'text-indigo-600'}`}>
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
                                    className={`w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400
                                        ${isDark
                                            ? 'bg-[#1f1c39] text-white border border-[#47464f]/40 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
                                            : 'bg-white text-gray-900 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors
                                        ${isDark ? 'text-violet-400 hover:text-violet-200' : 'text-gray-400 hover:text-gray-600'}`}>
                                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c4dff)', boxShadow: '0 4px 24px rgba(79,70,229,0.35)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 32px rgba(124,77,255,0.5)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(79,70,229,0.35)'; }}>
                            {loading
                                ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                                : <>Sign In <ArrowRight size={16} /></>}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-7 flex items-center gap-3">
                        <div className={`flex-1 h-px ${isDark ? 'bg-[#47464f]/40' : 'bg-gray-200'}`} />
                        <span className={`text-xs font-medium ${isDark ? 'text-violet-400' : 'text-gray-400'}`}>OR</span>
                        <div className={`flex-1 h-px ${isDark ? 'bg-[#47464f]/40' : 'bg-gray-200'}`} />
                    </div>

                    <p className={`text-center text-sm ${isDark ? 'text-violet-300' : 'text-gray-500'}`}>
                        Don't have an account?{' '}
                        <Link to="/register"
                            className={`font-semibold hover:underline ${isDark ? 'text-violet-400' : 'text-indigo-600'}`}>
                            Sign up free
                        </Link>
                    </p>

                    <p className={`text-center text-xs mt-8 ${isDark ? 'text-[#47464f]' : 'text-gray-300'}`}>
                        Jobsrow © {new Date().getFullYear()} · Building the Future of Hiring
                    </p>
                </div>
            </div>
        </div>
    );
}

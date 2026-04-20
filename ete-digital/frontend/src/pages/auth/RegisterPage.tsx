/**
 * RegisterPage — Premium split-screen redesign
 * Design system: "Indigo Ether" (Stitch) — deep indigo/violet palette, glassmorphism, Inter + Noto Serif
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ArrowRight, CheckCircle, Circle, Loader2, LayoutGrid, Users, Briefcase, Zap } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
);

const validatePasswordStrength = (password: string) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasMinLength = password.length >= 8;
    return {
        hasUppercase, hasLowercase, hasDigit, hasSpecial, hasMinLength,
        isValid: hasUppercase && hasLowercase && hasDigit && hasSpecial && hasMinLength,
    };
};

const brandPoints = [
    { icon: <Zap size={16} className="text-amber-300" />, text: 'Complete Your Profile in Minutes' },
    { icon: <Briefcase size={16} className="text-violet-300" />, text: 'Apply to Premium MNC Jobs' },
    { icon: <CheckCircle size={16} className="text-emerald-400" />, text: 'Get Paid for Real Tryouts' },
];

const stats = [
    { value: '50,000+', label: 'Candidates Placed' },
    { value: '1,200+', label: 'Employer Partners' },
    { value: '4 Days', label: 'Avg. Hire Time' },
];

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register, error, isLoading, clearError } = useAuthStore();


    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        role: 'candidate' as 'candidate' | 'employer',
    });
    const [localError, setLocalError] = useState('');
    const [showPasswordHints, setShowPasswordHints] = useState(false);

    const passwordStrength = validatePasswordStrength(formData.password);
    const displayError = localError || error;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setLocalError('');

        if (formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }
        if (!passwordStrength.isValid) {
            setLocalError('Password does not meet all security requirements');
            return;
        }
        try {
            await register(formData.email, formData.password, formData.fullName, formData.role);
            navigate('/login', {
                state: { message: 'Account created! Please check your email to verify.' }
            });
        } catch (_error) {
            // Error handled by store
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const inputClass = `w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400 bg-white text-gray-900 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10`;

    const labelClass = `block text-sm font-semibold mb-1.5 text-gray-700`;

    return (
        <div className="min-h-screen flex font-['Inter',sans-serif]">

            {/* ── LEFT BRAND PANEL ─────────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col"
                style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>

                {/* Decorative blurred orbs */}
                <div className="absolute top-[-60px] right-[-60px] w-80 h-80 rounded-full opacity-25"
                    style={{ background: 'radial-gradient(circle, #7c4dff, transparent)' }} />
                <div className="absolute bottom-[-80px] left-[-40px] w-96 h-96 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #4338ca, transparent)' }} />

                {/* Dot grid texture */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full p-12">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 w-fit">
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
                    <div className="py-6">
                        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-4">Join 50,000+ Professionals</p>
                        <h1 className="text-4xl font-bold text-white leading-tight mb-5"
                            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
                            Start Proving<br />
                            <span style={{ backgroundImage: 'linear-gradient(90deg, #a78bfa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Your Skills</span><br />
                            Today.
                        </h1>
                        <p className="text-violet-200 text-base leading-relaxed max-w-xs mb-8">
                            India's premier platform where earning your next role means proving it — not just claiming it.
                        </p>

                        {/* Feature callouts */}
                        <div className="space-y-3 mb-8">
                            {brandPoints.map((p) => (
                                <div key={p.text}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
                                    {p.icon}
                                    <span className="text-sm text-white font-medium">{p.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Stats bar */}
                        <div className="grid grid-cols-3 gap-3">
                            {stats.map((s) => (
                                <div key={s.label}
                                    className="rounded-xl p-3 text-center"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <p className="text-white font-bold text-lg">{s.value}</p>
                                    <p className="text-violet-300 text-xs mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Testimonial */}
                    <div className="rounded-2xl p-5"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>
                        <p className="text-violet-100 text-sm italic leading-relaxed mb-4">
                            "I landed my first MNC role in 3 weeks — no resume required. Jobsrow's tryout system changed everything for me."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ background: 'linear-gradient(135deg, #7c4dff, #4f46e5)' }}>PM</div>
                            <div>
                                <p className="text-white text-xs font-semibold">Priya Mehta</p>
                                <p className="text-violet-300 text-xs">Software Engineer, TCS Digital</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT FORM PANEL ─────────────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center px-6 py-10 bg-gray-50">
                <div className="w-full max-w-md">

                    {/* Mobile logo */}
                    <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden w-fit">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c4dff)' }}>
                            <LayoutGrid size={15} className="text-white" />
                        </div>
                        <span className="font-extrabold text-lg text-gray-900">Jobsrow</span>
                    </Link>

                    <h2 className="text-3xl font-bold mb-1 text-gray-900"
                        style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
                        Create your account
                    </h2>
                    <p className="text-sm mb-7 text-gray-500">
                        Where skills speak louder than résumés
                    </p>

                    {/* Error */}
                    {displayError && (
                        <div className="mb-5 px-4 py-3 rounded-xl text-sm border bg-red-50 border-red-200 text-red-700">
                            {displayError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className={labelClass}>Full Name</label>
                            <input id="fullName" name="fullName" type="text" value={formData.fullName}
                                onChange={handleChange} required placeholder="Your Name"
                                className={inputClass} />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className={labelClass}>Email address</label>
                            <input id="email" name="email" type="email" value={formData.email}
                                onChange={handleChange} required placeholder="you@example.com"
                                className={inputClass} />
                        </div>

                        {/* Role toggle */}
                        <div>
                            <label className={labelClass}>I am a...</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['candidate', 'employer'] as const).map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: r })}
                                        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all border
                                            ${formData.role === r
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                                        {r === 'candidate' ? <Users size={15} /> : <Briefcase size={15} />}
                                        {r === 'candidate' ? 'Job Seeker' : 'Employer'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className={labelClass}>Password</label>
                            <input id="password" name="password" type="password" value={formData.password}
                                onChange={handleChange}
                                onFocus={() => setShowPasswordHints(true)}
                                required minLength={8} placeholder="Min. 8 characters"
                                className={inputClass} />
                            {(showPasswordHints || formData.password) && (
                                <div className="mt-2.5 p-3 rounded-xl text-xs space-y-1.5 bg-gray-50">
                                    {[
                                        { check: passwordStrength.hasMinLength, label: 'At least 8 characters' },
                                        { check: passwordStrength.hasUppercase, label: 'One uppercase letter (A-Z)' },
                                        { check: passwordStrength.hasLowercase, label: 'One lowercase letter (a-z)' },
                                        { check: passwordStrength.hasDigit, label: 'One number (0-9)' },
                                        { check: passwordStrength.hasSpecial, label: 'One special character (!@#$%)' },
                                    ].map(({ check, label }) => (
                                        <div key={label} className={`flex items-center gap-2 transition-colors ${check ? 'text-emerald-500' : 'text-gray-400'}`}>
                                            {check
                                                ? <CheckCircle size={13} />
                                                : <Circle size={13} />}
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
                            <input id="confirmPassword" name="confirmPassword" type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange} required placeholder="Re-enter password"
                                className={inputClass} />
                        </div>

                        {/* Submit */}
                        <button
                            id="register-submit"
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c4dff)', boxShadow: '0 4px 24px rgba(79,70,229,0.35)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 32px rgba(124,77,255,0.5)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(79,70,229,0.35)'; }}>
                            {isLoading
                                ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                                : <>Create Account <ArrowRight size={16} /></>}
                        </button>

                        <p className="text-center text-xs text-gray-400">
                            By signing up, you agree to our{' '}
                            <Link to="/terms" className="hover:underline text-indigo-600">Terms</Link>
                            {' '}&amp;{' '}
                            <Link to="/privacy-policy" className="hover:underline text-indigo-600">Privacy Policy</Link>
                        </p>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs font-medium text-gray-400">OR</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Google OAuth Button */}
                    <a
                        id="google-register"
                        href={`${BACKEND_URL}/api/auth/oauth/google?role=${formData.role}`}
                        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 bg-white font-medium text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm mb-4"
                    >
                        <GoogleIcon />
                        Sign up with Google
                    </a>

                    <p className="text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login"
                            className="font-semibold hover:underline text-indigo-600">
                            Sign in
                        </Link>
                    </p>

                    <p className="text-center text-xs mt-6 text-gray-300">
                        Jobsrow © {new Date().getFullYear()} · Building the Future of Hiring
                    </p>
                </div>
            </div >
        </div >
    );
}

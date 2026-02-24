/**
 * Landing Page — Hero, Stats, Features, How It Works, Testimonials, CTA, Footer
 */
import { Link } from 'react-router-dom';
import {
    Briefcase, Star, ShieldCheck, ArrowRight,
    Zap, Trophy, ChevronRight,
    Github, Twitter, Linkedin, Mail
} from 'lucide-react';

// ── Hero Section ───────────────────────────────────────────────────────────────

function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-violet-900 min-h-screen flex items-center">
            {/* Background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            {/* Grid texture */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

            <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-blue-200 font-medium mb-8">
                    <Zap size={14} className="text-amber-400" />
                    Now with AI-powered candidate matching
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
                    Hire based on{' '}
                    <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                        skills, not stories
                    </span>
                </h1>

                <p className="text-xl text-blue-100/80 max-w-2xl mx-auto mb-10 leading-relaxed">
                    ETE Digital connects employers with verified talent through practical job tryouts,
                    smart matching, and a decentralized talent vault — so every hire is a great hire.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <Link
                        to="/register"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-violet-600 text-white font-bold rounded-2xl hover:from-blue-600 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/30 text-lg"
                    >
                        Get Started Free <ArrowRight size={20} />
                    </Link>
                    <Link
                        to="/jobs"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-lg"
                    >
                        Browse Jobs <ChevronRight size={20} />
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                    {[
                        { value: '10K+', label: 'Active Jobs' },
                        { value: '50K+', label: 'Candidates' },
                        { value: '2K+', label: 'Companies' },
                        { value: '94%', label: 'Hire Rate' },
                    ].map((s) => (
                        <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                            <p className="text-3xl font-extrabold text-white">{s.value}</p>
                            <p className="text-sm text-blue-200 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Features Section ──────────────────────────────────────────────────────────

const features = [
    {
        icon: <Star size={28} className="text-amber-500" />,
        bg: 'bg-amber-50',
        title: 'Job Tryouts',
        desc: 'Candidates complete real paid tasks before interview. Hire based on demonstrated ability, not CVs.',
    },
    {
        icon: <Trophy size={28} className="text-violet-600" />,
        bg: 'bg-violet-50',
        title: 'Talent Vault',
        desc: 'Candidates build a verifiable portfolio of work, certifications, and projects that persist across jobs.',
    },
    {
        icon: <Zap size={28} className="text-blue-600" />,
        bg: 'bg-blue-50',
        title: 'AI Matching',
        desc: 'Our explainable AI scores candidate-job fit with transparent breakdowns you can trust.',
    },
    {
        icon: <ShieldCheck size={28} className="text-emerald-600" />,
        bg: 'bg-emerald-50',
        title: 'Verified Skills',
        desc: 'Every skill claim is backed by evidence — tryout scores, vault artifacts, or external certifications.',
    },
];

function FeaturesSection() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Why ETE Digital</p>
                    <h2 className="text-4xl font-extrabold text-gray-900">Everything you need to hire smarter</h2>
                    <p className="text-gray-500 mt-4 max-w-xl mx-auto">
                        A complete platform that eliminates guesswork from hiring and elevates genuine talent.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((f) => (
                        <div key={f.title} className="group p-6 rounded-3xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all bg-white">
                            <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                {f.icon}
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── How It Works ──────────────────────────────────────────────────────────────

const steps = [
    { n: '01', title: 'Post a Job', desc: 'Create your listing and optional tryout task in minutes.' },
    { n: '02', title: 'Candidates Apply', desc: 'Candidates submit applications with vault portfolios attached.' },
    { n: '03', title: 'Tryout + AI Score', desc: 'Top candidates complete your tryout. AI ranks them transparently.' },
    { n: '04', title: 'Hire with Confidence', desc: 'Interview only pre-vetted, skill-verified candidates.' },
];

function HowItWorksSection() {
    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">The Process</p>
                    <h2 className="text-4xl font-extrabold text-gray-900">How ETE Digital works</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {steps.map((s, i) => (
                        <div key={s.n} className="relative">
                            {i < steps.length - 1 && (
                                <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-blue-200 to-transparent z-0 -translate-x-8" />
                            )}
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xl font-black mb-4 shadow-lg shadow-blue-200">
                                    {s.n}
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Testimonials ──────────────────────────────────────────────────────────────

const testimonials = [
    {
        quote: "We used to spend 3 weeks screening candidates. With ETE tryouts, we hired our best engineer in 4 days.",
        name: 'Sarah Chen',
        role: 'CTO, NexaCloud',
        initials: 'SC',
        colors: 'from-blue-500 to-indigo-600',
    },
    {
        quote: "My Talent Vault got me noticed by 3 companies before I even applied. It completely changed my job search.",
        name: 'Marcus Okafor',
        role: 'Senior Developer',
        initials: 'MO',
        colors: 'from-violet-500 to-purple-600',
    },
    {
        quote: "The AI match score gives us crystal-clear reasoning. No more gut-feel hiring decisions.",
        name: 'Priya Sharma',
        role: 'HR Director, Finova',
        initials: 'PS',
        colors: 'from-emerald-500 to-teal-600',
    },
];

function TestimonialsSection() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold text-emerald-600 uppercase tracking-widest mb-3">Social Proof</p>
                    <h2 className="text-4xl font-extrabold text-gray-900">Trusted by builders and hirers</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((t) => (
                        <div key={t.name} className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <p className="text-gray-700 leading-relaxed mb-6 italic">"{t.quote}"</p>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.colors} flex items-center justify-center text-white text-sm font-bold`}>
                                    {t.initials}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                                    <p className="text-xs text-gray-500">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── CTA Section ───────────────────────────────────────────────────────────────

function CtaSection() {
    return (
        <section className="py-24 bg-gradient-to-br from-blue-600 to-violet-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div className="relative max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                    Ready to transform how you hire?
                </h2>
                <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
                    Join thousands of companies and candidates already using ETE Digital.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/register"
                        className="px-8 py-4 bg-white text-blue-700 font-bold rounded-2xl hover:bg-blue-50 transition-colors shadow-lg text-lg"
                    >
                        Start Hiring Free
                    </Link>
                    <Link
                        to="/jobs"
                        className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/20 transition-colors text-lg"
                    >
                        Explore Jobs
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-16">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                                <Briefcase size={16} className="text-white" />
                            </div>
                            <span className="font-extrabold text-white text-lg">ETE Digital</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            The modern platform for skill-based hiring and verified talent.
                        </p>
                        <div className="flex gap-3 mt-4">
                            {[Github, Twitter, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                                    <Icon size={15} />
                                </a>
                            ))}
                        </div>
                    </div>
                    {[
                        {
                            heading: 'Product',
                            links: ['How It Works', 'Features', 'Pricing', 'Job Tryouts'],
                        },
                        {
                            heading: 'Company',
                            links: ['About', 'Blog', 'Careers', 'Contact'],
                        },
                        {
                            heading: 'Legal',
                            links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
                        },
                    ].map((col) => (
                        <div key={col.heading}>
                            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">{col.heading}</h4>
                            <ul className="space-y-2.5">
                                {col.links.map((l) => (
                                    <li key={l}>
                                        <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{l}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-500">© 2025 ETE Digital. All rights reserved.</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail size={12} /> hello@etedigital.io
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ── Nav Bar ───────────────────────────────────────────────────────────────────

function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                        <Briefcase size={16} className="text-white" />
                    </div>
                    <span className="font-extrabold text-white text-lg">ETE Digital</span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
                    <Link to="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                        Sign In
                    </Link>
                    <Link
                        to="/register"
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-violet-700 transition-all"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
    return (
        <div className="min-h-screen">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <HowItWorksSection />
            <TestimonialsSection />
            <CtaSection />
            <Footer />
        </div>
    );
}

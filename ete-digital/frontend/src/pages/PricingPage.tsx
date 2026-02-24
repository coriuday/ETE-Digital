/**
 * Pricing Page
 * Platform is currently free & open source.
 * Paid tiers are scaffolded but NOT wired to payment — ready for future activation.
 */
import { Link } from 'react-router-dom';
import { Check, Github, Zap, Building2, Info } from 'lucide-react';
import PublicNavbar from '../components/layout/PublicNavbar';
import Footer from '../components/layout/Footer';

const freeFeatures = [
    'Unlimited job postings',
    'Unlimited candidate applications',
    'Basic job search & discovery',
    'Candidate profiles & Talent Vault',
    'Email notifications',
    'Community support (GitHub Issues)',
];

// Future paid tiers — scaffolded, not yet active
const futureTiers = [
    {
        icon: <Zap className="w-5 h-5 text-primary-600" />,
        name: 'Pro',
        tagline: 'For growing teams',
        note: 'Coming soon',
        features: [
            'Everything in Free',
            'Paid tryout escrow system',
            'Candidate analytics dashboard',
            'Priority listing for job posts',
            'Branded employer profile',
            'Email support',
        ],
    },
    {
        icon: <Building2 className="w-5 h-5 text-secondary-600" />,
        name: 'Enterprise',
        tagline: 'Custom scale',
        note: 'Coming soon',
        features: [
            'Everything in Pro',
            'SSO / SAML integration',
            'Dedicated account manager',
            'Custom integrations & API',
            'SLA & compliance reports',
            'White-label option',
        ],
    },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-white">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-24 pb-12 bg-gradient-to-br from-gray-900 to-primary-900 text-center">
                <div className="max-w-3xl mx-auto px-4">
                    <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                        <Github className="w-3.5 h-3.5" /> Open Source — MIT License
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Free for everyone,<br />forever.
                    </h1>
                    <p className="text-gray-300 text-lg max-w-xl mx-auto">
                        ETE Digital is fully open source. Self-host it, fork it, build on it.
                        Paid features will be offered as optional add-ons in future versions.
                    </p>
                </div>
            </section>

            {/* Current Free Tier */}
            <section className="py-16">
                <div className="max-w-5xl mx-auto px-4">
                    {/* Open Source badge */}
                    <div className="flex justify-center mb-12">
                        <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-3 flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-green-800 text-sm font-semibold">Currently active — Free for all users</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                        {/* Current plan card */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-primary-600 to-secondary-700 rounded-2xl p-8 text-white shadow-xl shadow-primary-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Github className="w-5 h-5" />
                                <span className="text-sm font-semibold text-primary-200">Open Source</span>
                            </div>
                            <h2 className="text-3xl font-black mb-1">Free</h2>
                            <p className="text-primary-100 text-sm mb-6">No credit card. No catch.</p>
                            <div className="text-5xl font-black mb-1">₹0</div>
                            <p className="text-primary-200 text-xs mb-8">forever</p>
                            <Link
                                to="/register"
                                className="block w-full text-center py-3 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-primary-50 transition-colors"
                            >
                                Get Started Free
                            </Link>
                        </div>

                        {/* Features */}
                        <div className="lg:col-span-3">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Everything included today</h3>
                            <ul className="space-y-3">
                                {freeFeatures.map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                                        <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-green-600" />
                                        </span>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-6 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    This is an open-source platform. You can{' '}
                                    <a
                                        href="https://github.com/your-org/ete-digital"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold underline hover:no-underline"
                                    >
                                        self-host it on GitHub
                                    </a>{' '}
                                    or contribute features.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Future Tiers (coming soon — not active) */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Paid tiers — coming in a future version
                        </h2>
                        <p className="text-gray-500 text-sm">
                            These are planned add-ons. The core platform will always remain free.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {futureTiers.map((tier, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 opacity-70 relative overflow-hidden"
                            >
                                {/* Coming soon ribbon */}
                                <div className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
                                    Coming Soon
                                </div>

                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                                    {tier.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-700 mb-0.5">{tier.name}</h3>
                                <p className="text-gray-400 text-sm mb-6">{tier.tagline}</p>

                                <ul className="space-y-2 mb-6">
                                    {tier.features.map((f, fi) => (
                                        <li key={fi} className="flex items-center gap-2 text-sm text-gray-500">
                                            <Check className="w-4 h-4 text-gray-300" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    disabled
                                    className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-xl text-sm font-semibold cursor-not-allowed"
                                >
                                    Not yet available
                                </button>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        Want to speed up a feature? Open a GitHub issue or submit a PR.
                    </p>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-12">
                <div className="max-w-2xl mx-auto px-4">
                    <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Common questions</h2>
                    {[
                        { q: 'Will the core platform always be free?', a: 'Yes. The open-source version will always include all core features. Paid tiers will only add premium extras — never gate existing functionality.' },
                        { q: 'Can I self-host this?', a: 'Absolutely. The full source is on GitHub under the MIT license. Clone, fork, deploy — no restrictions.' },
                        { q: 'What about tryout payments?', a: 'The payment infrastructure (Stripe escrow) is built into the codebase and ready to activate. It will be enabled as part of a future Pro tier. For now, tryouts are tracked but payment handling is disabled.' },
                        { q: 'How do I report bugs or request features?', a: 'Open an issue on GitHub or use our Contact page. Community contributions are welcome!' },
                    ].map((item, i) => (
                        <div key={i} className="py-4 border-b border-gray-100 last:border-0">
                            <p className="font-semibold text-gray-900 text-sm mb-1.5">{item.q}</p>
                            <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            <Footer />
        </div>
    );
}

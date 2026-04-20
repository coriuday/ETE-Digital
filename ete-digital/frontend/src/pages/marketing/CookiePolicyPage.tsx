/**
 * Cookie Policy Page — Jobsrow
 * Content sourced from: .docs/documentaion_info.md
 */
import { Link } from 'react-router-dom';
import { Cookie, ChevronRight, Mail } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

const cookieTypes = [
    {
        name: 'Essential Cookies',
        color: 'bg-green-100 text-green-700',
        description: 'Necessary for the Platform to function properly.',
        uses: ['User login and authentication', 'Security and fraud prevention', 'Navigation and access to secure areas'],
        note: 'Without these cookies, certain services may not be available.',
    },
    {
        name: 'Performance & Analytics Cookies',
        color: 'bg-blue-100 text-blue-700',
        description: 'Help us understand how users interact with our Platform.',
        uses: ['Pages visited and time spent', 'Errors encountered', 'Traffic analysis and feature improvement'],
    },
    {
        name: 'Functional Cookies',
        color: 'bg-purple-100 text-purple-700',
        description: 'Allow us to remember your preferences.',
        uses: ['Language settings', 'Job search filters', 'Location preferences'],
    },
    {
        name: 'Advertising & Targeting Cookies',
        color: 'bg-orange-100 text-orange-700',
        description: 'Used to show relevant job listings and advertisements.',
        uses: ['Relevant job listings and advertisements', 'Measuring effectiveness of marketing campaigns', 'Delivering personalized content'],
        note: 'These may be set by Jobsrow or trusted third-party partners.',
    },
];

const sections = [
    {
        id: 'what-are-cookies',
        num: '1',
        title: 'What Are Cookies?',
        content: 'Cookies are small text files stored on your device (computer, mobile, or tablet) when you visit a website. They help websites recognize your device, store preferences, and improve user experience.',
        types: [
            { name: 'Session Cookies', desc: 'Temporary cookies active only during your browsing session. Deleted when you close your browser.' },
            { name: 'Persistent Cookies', desc: 'Remain on your device for a defined period. They remember preferences like login details or search filters.' },
        ],
    },
    {
        id: 'how-we-use',
        num: '2',
        title: 'How Jobsrow Uses Cookies',
        content: 'Jobsrow uses cookies, web beacons, pixels, and similar tracking technologies to enhance your experience, improve our services, and deliver relevant content.',
        subItems: [
            { title: 'Analytics & Performance', desc: 'Track user activity, measure traffic, and identify areas for improvement.' },
            { title: 'Personalization', desc: 'Save your job search filters, remember login sessions, and identify preferred language and location.' },
            { title: 'Advertising & Marketing', desc: 'Display relevant job listings, deliver personalized ads, and measure marketing campaign effectiveness.' },
            { title: 'Security & Fraud Prevention', desc: 'Detect suspicious activity, prevent unauthorized access, and protect user accounts.' },
            { title: 'Testing & Optimization', desc: 'A/B testing, performance optimization, and usability improvements.' },
            { title: 'Compliance & Consent', desc: 'Record your cookie preferences and ensure compliance with applicable laws.' },
        ],
    },
    {
        id: 'third-party',
        num: '3',
        title: 'Third-Party Cookies',
        content: 'Jobsrow may allow third-party service providers (such as analytics or advertising partners) to place cookies on your device. These third parties may collect information about your online activities across different websites. We ensure that such third parties are bound by appropriate data protection obligations in accordance with Indian laws.',
    },
    {
        id: 'login',
        num: '4',
        title: 'Login Through Third-Party Accounts',
        content: 'You may choose to sign in to Jobsrow using third-party accounts such as Google, Microsoft, or Apple. When you use this option, the third-party provider authenticates your identity and certain basic information (name, email, profile details) may be shared with Jobsrow to create or manage your account. You can manage or revoke this access through your third-party account settings.',
    },
    {
        id: 'managing',
        num: '5',
        title: 'Managing Cookies',
        content: 'You have full control over cookies and tracking technologies. You can:',
        list: [
            'Accept or reject non-essential cookies through browser settings',
            'Delete stored cookies at any time',
            'Disable tracking features depending on your browser or device',
            'Opt out of personalized advertising via browser or device settings',
            'Withdraw consent for non-essential cookies at any time',
        ],
        note: 'Please note that disabling certain cookies may affect platform functionality.',
    },
    {
        id: 'dnt',
        num: '6',
        title: 'Do Not Track (DNT) Signals',
        content: 'Some browsers provide a "Do Not Track" (DNT) feature. Currently, Jobsrow does not respond to DNT signals due to the lack of a consistent industry standard.',
    },
    {
        id: 'compliance',
        num: '7',
        title: 'Compliance with Indian Law',
        content: 'Jobsrow ensures that the use of cookies and tracking technologies complies with the Digital Personal Data Protection Act, 2023, including:',
        list: [
            'Obtaining consent where required',
            'Using data only for specified purposes',
            'Providing users with control over their data',
        ],
    },
    {
        id: 'updates',
        num: '8',
        title: 'Updates to This Policy',
        content: 'We may update our use of cookies and tracking technologies from time to time to reflect changes in technology, legal requirements, or platform improvements. We encourage you to review this page periodically. Continued use of the Platform after updates constitutes acceptance of the revised policy.',
    },
];

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] font-sans">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-24 pb-10 bg-gradient-to-br from-[#005399] to-[#176BBE]">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Cookie className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-center gap-2 text-blue-200 text-xs">
                            <Link to="/" className="hover:text-white transition-colors">Home</Link>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-white font-medium">Cookie Policy</span>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">Cookie Policy</h1>
                    <p className="text-blue-100 text-sm">Last Updated: May 20, 2025 · Jobsrow</p>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 pt-8 pb-16 space-y-6">

                {/* Intro */}
                <div className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] p-6 md:p-8">
                    <p className="text-sm text-[#414752] leading-[1.7]">
                        This Cookie Policy explains how <strong className="text-[#191c1d]">Jobsrow</strong> ("we", "our", or "us") uses cookies and similar technologies when you access or use our website, mobile applications, or related services (collectively referred to as the "Platform").
                    </p>
                    <p className="text-sm text-[#414752] leading-[1.7] mt-3">
                        By continuing to use Jobsrow, you consent to the use of cookies as described in this policy, unless you choose to disable them through your browser or our cookie settings.
                    </p>
                </div>

                {/* Cookie types cards */}
                <div>
                    <h2 className="text-lg font-bold text-[#191c1d] mb-4">Types of Cookies We Use</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {cookieTypes.map((ct, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] p-5">
                                <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg ${ct.color} mb-3 inline-block`}>{ct.name}</span>
                                <p className="text-sm text-[#414752] mb-3 leading-relaxed">{ct.description}</p>
                                <ul className="space-y-1.5">
                                    {ct.uses.map((u, ui) => (
                                        <li key={ui} className="flex items-start gap-2 text-sm text-[#414752]">
                                            <span className="w-1.5 h-1.5 bg-[#176BBE] rounded-full mt-2 flex-shrink-0" />
                                            {u}
                                        </li>
                                    ))}
                                </ul>
                                {ct.note && <p className="text-xs text-[#727783] mt-3 italic">{ct.note}</p>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sections */}
                {sections.map(s => (
                    <div key={s.id} id={s.id} className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] p-6 md:p-8">
                        <div className="flex items-start gap-3 mb-4">
                            <span className="w-7 h-7 bg-[#d4e3ff] text-[#004785] rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">{s.num}</span>
                            <h2 className="text-base font-bold text-[#191c1d]">{s.title}</h2>
                        </div>
                        <div className="pl-10 space-y-3">
                            {s.content && <p className="text-sm text-[#414752] leading-[1.7]">{s.content}</p>}
                            {s.types && (
                                <div className="space-y-2">
                                    {s.types.map((t, ti) => (
                                        <div key={ti} className="bg-[#f3f4f5] rounded-xl p-3">
                                            <p className="text-sm font-semibold text-[#191c1d] mb-0.5">{t.name}</p>
                                            <p className="text-sm text-[#414752]">{t.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {s.subItems && (
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {s.subItems.map((item, ii) => (
                                        <div key={ii} className="bg-[#f3f4f5] rounded-xl p-3">
                                            <p className="text-sm font-semibold text-[#191c1d] mb-0.5">{item.title}</p>
                                            <p className="text-sm text-[#414752] leading-relaxed">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {s.list && (
                                <ul className="space-y-2">
                                    {s.list.map((item, li) => (
                                        <li key={li} className="flex items-start gap-2 text-sm text-[#414752]">
                                            <span className="w-1.5 h-1.5 bg-[#176BBE] rounded-full mt-2 flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {s.note && <div className="bg-[#f3f4f5] rounded-xl p-3"><p className="text-sm text-[#414752] italic">{s.note}</p></div>}
                        </div>
                    </div>
                ))}

                {/* Contact */}
                <div className="bg-gradient-to-br from-[#005399] to-[#176BBE] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold">Questions about cookies?</p>
                            <p className="text-blue-100 text-sm">Subject Line: Cookie Policy Inquiry</p>
                        </div>
                    </div>
                    <a
                        href="mailto:support@jobsrow.com"
                        className="flex-shrink-0 px-5 py-2.5 bg-white text-[#176BBE] font-semibold text-sm rounded-xl hover:bg-blue-50 transition-colors"
                    >
                        support@jobsrow.com
                    </a>
                </div>
            </div>

            <Footer />
        </div>
    );
}

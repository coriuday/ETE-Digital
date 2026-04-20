/**
 * Privacy Policy Page — Jobsrow
 * Content sourced from: .docs/documentaion_info.md
 */
import { Link } from 'react-router-dom';
import { Shield, ChevronRight, Mail } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

const sections = [
    {
        id: 'welcome',
        title: 'Welcome to Jobsrow — Privacy Overview',
        content: `At Jobsrow, our mission is simply to help job seekers find the right opportunities and enable employers to connect with the best talent. To support this goal, we work closely with our affiliated platforms and partner brands, ensuring a seamless experience across our services. Our Privacy Center is designed to give you clear insights into how these collaborations work and how your information may be shared to enhance your experience.

We understand that trust is essential. When you share your personal information with Jobsrow, we are committed to handling it responsibly and securely. This Privacy Policy explains how we collect, use, and protect both personal and non-personal data while delivering our services.

To stay transparent and up to date, we regularly review and update our Privacy Policy. These updates help ensure that our practices are clearly communicated and aligned with current legal and industry standards.`,
        highlights: [
            'Expanded details on the type of data we collect and how it is used',
            'Clear explanation of the legal grounds for processing personal information',
            'Updated region-specific sections to reflect applicable data protection laws, including India\'s Digital Personal Data Protection Act, 2023',
            'Additional clarity on platform coverage and updates related to our service structure',
        ],
    },
    {
        id: 'what-we-collect',
        title: 'What Information We Collect',
        content: `We may collect personal details such as your name, contact information, resume, job preferences, and activity on the platform (like searches and applications). We also collect limited technical data such as device information and IP address to improve your experience.

Types of data we collect:`,
        list: [
            '**Account Information** – Login details, account settings, sign-ups, and service requests.',
            '**Platform Activity** – Pages visited, clicks, searches, time spent, and interactions.',
            '**Communication Data** – Emails, messages, and interactions through the platform.',
            '**Contact Details** – Name, phone number, email, and address.',
            '**Device & Technical Data** – IP address, device type, browser details, and general location.',
            '**Payment Information (Employers)** – Billing details for paid services. Full card details are not stored.',
            '**Scheduling & Interview Data** – Interview availability and participation details.',
        ],
    },
    {
        id: 'how-we-use',
        title: 'How We Use Your Information',
        content: 'Your data helps us:',
        list: [
            'Match you with relevant job opportunities',
            'Improve platform performance and user experience',
            'Enable communication between job seekers and employers',
            'Maintain security and prevent fraud',
            'Send job alerts and updates',
            'Comply with legal obligations',
        ],
    },
    {
        id: 'data-sharing',
        title: 'Who We Share Your Data With',
        content: `At Jobsrow, we only share your information when necessary to provide our services, improve user experience, and comply with legal requirements. We do **not sell your personal data**.`,
        subsections: [
            {
                title: '1. Jobsrow Affiliates',
                text: 'Jobsrow may share your data with affiliated platforms to improve personalization, connect job seekers with opportunities, and strengthen security.',
            },
            {
                title: '2. Employers',
                text: 'When you apply for a job, your resume, profile, contact information, and application responses are shared with that employer. Employers are responsible for handling your data per applicable laws.',
            },
            {
                title: '3. Service Providers',
                text: 'We work with trusted third-party providers for hosting, payment processing, analytics, customer support, and fraud detection. These partners are bound by strict data protection agreements.',
            },
            {
                title: '4. Legal & Compliance',
                text: 'We may disclose data to comply with legal obligations, respond to lawful requests, or protect the rights and safety of users and the platform.',
            },
        ],
    },
    {
        id: 'your-rights',
        title: 'Your Personal Data Rights',
        content: 'At Jobsrow, we respect your privacy and give you control over your personal information. In line with India\'s Digital Personal Data Protection Act, 2023, you have the following rights:',
        list: [
            '**Access** the personal data we hold about you',
            '**Correct or update** inaccurate or incomplete information',
            '**Delete** your personal data (Right to Erasure)',
            '**Restrict or object** to certain types of data processing',
            '**Withdraw consent** where processing is based on your consent',
            '**Request data portability**, allowing you to receive your data in a usable format',
        ],
    },
    {
        id: 'security',
        title: 'Security of Your Personal Data',
        content: 'Jobsrow is committed to safeguarding your personal data. We implement appropriate technical and organizational measures to protect your information from unauthorized access, misuse, loss, or alteration.',
        list: [
            '**Data Encryption** – Secure encryption protocols for data in transit and at rest',
            '**Access Controls** – Strict internal policies ensure only authorized personnel access data',
            '**Secure Infrastructure** – Protected servers with firewalls and monitoring tools',
            '**Regular Security Testing** – Periodic vulnerability assessments and security audits',
            '**Data Minimization** – We collect only data necessary for providing our services',
        ],
    },
    {
        id: 'automated',
        title: 'Automated Processing & AI',
        content: 'Jobsrow uses advanced technologies, including AI, to recommend jobs, match candidates with employers, improve search results, and detect fraud. These systems assist decision-making but do not make final hiring decisions. You may request a review if you believe automated processing has significantly affected you.',
    },
    {
        id: 'india',
        title: 'India — Digital Personal Data Protection Act, 2023',
        content: 'Jobsrow processes personal data in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and related rules. In compliance with Indian law, Jobsrow has appointed a Grievance Officer:',
        contact: {
            label: 'Grievance Officer Email',
            value: 'support@jobsrow.com',
            note: 'Response Time: Within 7–30 working days (as per applicable regulations). If not satisfied with the resolution, you may escalate to the Data Protection Board of India once established.',
        },
    },
    {
        id: 'acquisitions',
        title: 'Acquisitions and Business Transfers',
        content: 'Jobsrow may undergo business changes such as mergers, acquisitions, or restructuring. In such situations, your personal data may be transferred as part of the business transaction. The receiving entity will be permitted to use your data only for purposes consistent with this Privacy Policy. Users will be notified through appropriate communication channels if privacy practices change.',
    },
    {
        id: 'complaints',
        title: 'Complaints and Disputes',
        content: 'Jobsrow is committed to protecting your personal data and ensuring transparency. If you believe your personal data has been misused, you may contact us directly. All complaints are reviewed by our dedicated data protection team, and resolution is provided within timelines prescribed under applicable Indian laws.',
        subsections: [
            {
                title: 'Escalation',
                text: 'If not satisfied with our response, you may approach the Data Protection Board of India (DPBI) once operational, or any other competent authority under applicable laws.',
            },
        ],
    },
    {
        id: 'updates',
        title: 'Updates to This Policy',
        content: 'We may update this policy to reflect improvements or legal changes. Any updates will be clearly communicated on this page. Continued use of the platform indicates acceptance of updates. We encourage you to check this page periodically.',
    },
];

function renderText(text: string) {
    // Bold markdown **text**
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i} className="text-[#191c1d] font-semibold">{part}</strong> : part
    );
}

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] font-sans">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-24 pb-10 bg-gradient-to-br from-[#005399] to-[#176BBE]">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-center gap-2 text-blue-200 text-xs">
                            <Link to="/" className="hover:text-white transition-colors">Home</Link>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-white font-medium">Privacy Policy</span>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">Privacy Policy</h1>
                    <p className="text-blue-100 text-sm">Last Updated: May 20, 2025 · Jobsrow</p>
                </div>
            </section>

            {/* Table of Contents */}
            <div className="max-w-4xl mx-auto px-4 pt-8">
                <div className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] p-6 mb-8">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Contents</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                        {sections.map((s, i) => (
                            <a
                                key={s.id}
                                href={`#${s.id}`}
                                className="flex items-center gap-2 text-sm text-[#176BBE] hover:text-[#005399] transition-colors"
                            >
                                <span className="w-5 h-5 bg-[#d4e3ff] text-[#004785] rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                                {s.title}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-6 pb-16">
                    {sections.map((s, i) => (
                        <div key={s.id} id={s.id} className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] p-6 md:p-8">
                            <div className="flex items-start gap-3 mb-4">
                                <span className="w-7 h-7 bg-[#d4e3ff] text-[#004785] rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                                <h2 className="text-lg font-bold text-[#191c1d]">{s.title}</h2>
                            </div>
                            <div className="pl-10 space-y-4">
                                <p className="text-sm text-[#414752] leading-[1.7]">{renderText(s.content)}</p>
                                {s.highlights && (
                                    <ul className="space-y-2">
                                        {s.highlights.map((h, hi) => (
                                            <li key={hi} className="flex items-start gap-2 text-sm text-[#414752]">
                                                <span className="w-1.5 h-1.5 bg-[#176BBE] rounded-full mt-2 flex-shrink-0" />
                                                {h}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {s.list && (
                                    <ul className="space-y-2">
                                        {s.list.map((item, li) => (
                                            <li key={li} className="flex items-start gap-2 text-sm text-[#414752]">
                                                <span className="w-1.5 h-1.5 bg-[#176BBE] rounded-full mt-2 flex-shrink-0" />
                                                <span>{renderText(item)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {s.subsections && (
                                    <div className="space-y-4">
                                        {s.subsections.map((sub, si) => (
                                            <div key={si} className="bg-[#f3f4f5] rounded-xl p-4">
                                                <p className="text-sm font-semibold text-[#191c1d] mb-1">{sub.title}</p>
                                                <p className="text-sm text-[#414752] leading-[1.7]">{sub.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {s.contact && (
                                    <div className="bg-[#d4e3ff] rounded-xl p-4">
                                        <p className="text-sm font-semibold text-[#001c3a] mb-1">{s.contact.label}</p>
                                        <a href={`mailto:${s.contact.value}`} className="text-sm text-[#176BBE] font-medium">{s.contact.value}</a>
                                        {s.contact.note && <p className="text-xs text-[#414752] mt-2">{s.contact.note}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Contact CTA */}
                    <div className="bg-gradient-to-br from-[#005399] to-[#176BBE] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-bold">Questions about your privacy?</p>
                                <p className="text-blue-100 text-sm">Our team responds within 7–30 working days.</p>
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
            </div>

            <Footer />
        </div>
    );
}

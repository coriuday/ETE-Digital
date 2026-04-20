/**
 * Terms & Conditions Page — Jobsrow
 * Content sourced from: .docs/documentaion_info.md
 */
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, Mail } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

const sections = [
    {
        id: 'introduction',
        num: '1',
        title: 'Introduction',
        content: `Welcome to Jobsrow. These Terms & Conditions ("Terms") govern your access to and use of the Jobsrow website, mobile applications, and services (collectively, the "Platform").

By accessing or using Jobsrow, you agree to be bound by these Terms. If you do not agree, please do not use our services.`,
    },
    {
        id: 'eligibility',
        num: '2',
        title: 'Eligibility',
        content: 'You must:',
        list: [
            'Be at least 18 years old or the legal working age in your jurisdiction',
            'Use the Platform only for lawful purposes',
            'Provide accurate and complete information',
        ],
        note: 'If you are using Jobsrow on behalf of a company, you confirm that you have the authority to bind that organization.',
    },
    {
        id: 'user-accounts',
        num: '3',
        title: 'User Accounts',
        list: [
            'You are responsible for maintaining the confidentiality of your account credentials',
            'You agree to provide accurate and updated information',
            'Jobsrow reserves the right to suspend or terminate accounts for false, misleading, or suspicious activity',
        ],
    },
    {
        id: 'services',
        num: '4',
        title: 'Services Provided',
        content: 'Jobsrow provides:',
        list: [
            'Job search and application tools for job seekers',
            'Job posting and recruitment tools for employers',
            'Communication tools between job seekers and employers',
        ],
        note: 'Jobsrow is not an employer or recruitment agency and does not guarantee job placement or candidate selection.',
    },
    {
        id: 'job-seekers',
        num: '5',
        title: 'Job Seekers – Responsibilities',
        content: 'As a job seeker, you agree:',
        list: [
            'To provide accurate resume and profile information',
            'Not to submit false or misleading applications',
            'Not to misuse the platform for spam or fraud',
            'To verify job details before accepting offers',
        ],
        note: 'Jobsrow is not responsible for employer actions, job offers, or employment outcomes.',
    },
    {
        id: 'employers',
        num: '6',
        title: 'Employers – Responsibilities',
        content: 'As an employer, you agree:',
        list: [
            'To provide genuine job opportunities',
            'Not to post misleading, fraudulent, or illegal job listings',
            'Not to charge candidates any application fees',
            'To comply with all applicable labor and employment laws',
        ],
        note: 'Jobsrow reserves the right to remove job postings or suspend accounts that violate these terms.',
    },
    {
        id: 'prohibited',
        num: '7',
        title: 'Prohibited Activities',
        content: 'You agree NOT to:',
        list: [
            'Use the platform for illegal or fraudulent purposes',
            'Upload harmful content (viruses, malware, etc.)',
            'Collect or misuse user data without consent',
            'Impersonate any individual or organization',
            'Attempt unauthorized access to the platform',
        ],
    },
    {
        id: 'content',
        num: '8',
        title: 'Content & Data',
        list: [
            'You retain ownership of your content (resume, job posts, etc.)',
            'By using Jobsrow, you grant us a license to use, display, and process your content to provide services',
            'We may remove content that violates our policies',
        ],
    },
    {
        id: 'privacy',
        num: '9',
        title: 'Privacy',
        content: 'Your use of Jobsrow is also governed by our Privacy Policy, which explains how we collect and use your data in compliance with India\'s Digital Personal Data Protection Act, 2023.',
    },
    {
        id: 'payments',
        num: '10',
        title: 'Payments & Billing (For Employers)',
        list: [
            'Certain services may be paid',
            'You agree to provide valid payment details',
            'All fees are non-refundable unless stated otherwise',
            'Jobsrow may change pricing with prior notice',
        ],
    },
    {
        id: 'disclaimer',
        num: '11',
        title: 'Disclaimer of Warranties',
        content: 'Jobsrow provides services on an "as is" and "as available" basis. We do not guarantee:',
        list: [
            'Job placement or hiring success',
            'Accuracy of job listings or candidate profiles',
            'Continuous or error-free service',
        ],
    },
    {
        id: 'liability',
        num: '12',
        title: 'Limitation of Liability',
        content: 'To the fullest extent permitted by law, Jobsrow shall not be liable for:',
        list: [
            'Any indirect or consequential damages',
            'Loss of data, profits, or opportunities',
            'Actions of users, employers, or third parties',
        ],
    },
    {
        id: 'suspension',
        num: '13',
        title: 'Account Suspension & Termination',
        content: 'Jobsrow may suspend or terminate your account if:',
        list: [
            'You violate these Terms',
            'You engage in fraudulent or harmful activity',
            'Required by law',
        ],
        note: 'You may also delete your account at any time.',
    },
    {
        id: 'third-party',
        num: '14',
        title: 'Third-Party Services',
        content: 'Jobsrow may include links or integrations with third-party services. We are not responsible for their content, policies, or actions.',
    },
    {
        id: 'ip',
        num: '15',
        title: 'Intellectual Property',
        content: 'All platform content, branding, and technology belong to Jobsrow. You may not copy, modify, or distribute without permission.',
    },
    {
        id: 'changes',
        num: '16',
        title: 'Changes to Terms',
        content: 'Jobsrow may update these Terms at any time. Changes will be effective upon posting. Continued use means acceptance.',
    },
    {
        id: 'governing-law',
        num: '17',
        title: 'Governing Law',
        content: 'These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in the applicable operating region of Jobsrow.',
    },
    {
        id: 'contact',
        num: '18',
        title: 'Contact Us',
        content: 'If you have any questions regarding these Terms, please contact us at:',
        email: 'support@jobsrow.com',
    },
];

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] font-sans">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-24 pb-10 bg-gradient-to-br from-[#005399] to-[#176BBE]">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-center gap-2 text-blue-200 text-xs">
                            <Link to="/" className="hover:text-white transition-colors">Home</Link>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-white font-medium">Terms & Conditions</span>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">Terms & Conditions</h1>
                    <p className="text-blue-100 text-sm">Effective from the date of posting · Jobsrow</p>
                </div>
            </section>

            {/* Table of Contents */}
            <div className="max-w-4xl mx-auto px-4 pt-8">
                <div className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] p-6 mb-8">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Contents</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {sections.map(s => (
                            <a
                                key={s.id}
                                href={`#${s.id}`}
                                className="flex items-center gap-2 text-sm text-[#176BBE] hover:text-[#005399] transition-colors"
                            >
                                <span className="w-5 h-5 bg-[#d4e3ff] text-[#004785] rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0">{s.num}</span>
                                {s.title}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-4 pb-16">
                    {sections.map(s => (
                        <div key={s.id} id={s.id} className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] p-6 md:p-8">
                            <div className="flex items-start gap-3 mb-4">
                                <span className="w-7 h-7 bg-[#d4e3ff] text-[#004785] rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">{s.num}</span>
                                <h2 className="text-base font-bold text-[#191c1d]">{s.title}</h2>
                            </div>
                            <div className="pl-10 space-y-3">
                                {s.content && <p className="text-sm text-[#414752] leading-[1.7]">{s.content}</p>}
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
                                {s.note && (
                                    <div className="bg-[#f3f4f5] rounded-xl p-3">
                                        <p className="text-sm text-[#414752] italic">{s.note}</p>
                                    </div>
                                )}
                                {s.email && (
                                    <div className="bg-[#d4e3ff] rounded-xl p-4 flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-[#004785] flex-shrink-0" />
                                        <a href={`mailto:${s.email}`} className="text-sm font-semibold text-[#176BBE]">{s.email}</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Related links */}
                    <div className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-[#414752]">Also see our related policies:</p>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/privacy-policy" className="text-sm text-[#176BBE] hover:underline font-medium">Privacy Policy</Link>
                            <Link to="/cookies" className="text-sm text-[#176BBE] hover:underline font-medium">Cookie Policy</Link>
                            <Link to="/contact" className="text-sm text-[#176BBE] hover:underline font-medium">Contact Us</Link>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

/**
 * Guidelines for Safe Job Search — Jobsrow
 * Content sourced from: .docs/documentaion_info.md
 */
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, ChevronRight, Mail } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

const doTips = [
    {
        title: 'Verify the company\'s email',
        desc: 'Always check if the recruiter is using an official business email (e.g., @company.com). Be cautious of emails with spelling errors, unusual formats, or slight variations in the company name. Messages from free email services like Gmail or Yahoo should be treated carefully.',
    },
    {
        title: 'Match the job with your application',
        desc: 'If you receive an offer, make sure it aligns with the role you originally applied for on Jobsrow. Be alert to changes in job details, as this could be a sign of misleading offers.',
    },
    {
        title: 'Question unrealistic offers',
        desc: 'Jobs that promise high salaries, flexible work-from-home options, and minimal effort can sometimes be misleading. Always confirm the company\'s legitimacy, job role, and workplace details.',
    },
    {
        title: 'Expect a proper interview process',
        desc: 'Trustworthy employers will usually conduct a phone, video, or in-person interview. Be cautious if you\'re offered a job without any formal interaction, especially if communication is limited to chat platforms.',
    },
    {
        title: 'Report suspicious activity on Jobsrow',
        desc: 'If you receive messages that seem unusual, misleading, or inappropriate, report them immediately so our team can take action.',
    },
];

const dontTips = [
    {
        title: 'Never pay for job opportunities',
        desc: 'Jobsrow does not require any payment for applying to jobs. Requests for fees are often a warning sign of fraud.',
    },
    {
        title: 'Avoid handling money for employers',
        desc: 'Do not agree to transfer funds, deposit checks, or manage financial transactions on behalf of a company. These are common scam tactics.',
    },
    {
        title: 'Don\'t create accounts or post jobs for unknown companies',
        desc: 'Unless you are officially working in recruitment, avoid opening multiple accounts or posting listings for unfamiliar organizations.',
    },
    {
        title: 'Be cautious with upfront payments',
        desc: 'If someone sends you money and asks you to return a portion of it, it\'s likely a scam that could cause legal issues.',
    },
];

export default function SafeJobSearchPage() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] font-sans">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-24 pb-10 bg-gradient-to-br from-[#005399] to-[#176BBE]">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-center gap-2 text-blue-200 text-xs">
                            <Link to="/" className="hover:text-white transition-colors">Home</Link>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-white font-medium">Guidelines for Safe Job Search</span>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
                        Guidelines for Safe Job Search
                    </h1>
                    <p className="text-blue-100 text-sm max-w-xl">
                        Smart tips to protect yourself from scams and fraudulent job offers while using Jobsrow.
                    </p>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 pb-16">

                {/* Intro */}
                <div className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] p-6 md:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-6 h-6 text-[#176BBE]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#191c1d] mb-2">Smart Tips for Job Seekers on Jobsrow</h2>
                            <p className="text-sm text-[#414752] leading-[1.7]">
                                Jobsrow is committed to providing a safe and trustworthy platform for job seekers. While we take strong measures to verify employers and listings, it's important for you to stay alert and follow these guidelines during your job search.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ✔ DO tips */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h2 className="text-lg font-bold text-[#191c1d]">Things to Do</h2>
                    </div>
                    <div className="space-y-3">
                        {doTips.map((tip, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] p-5 flex items-start gap-4">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#191c1d] mb-1">{tip.title}</p>
                                    <p className="text-sm text-[#414752] leading-[1.7]">{tip.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ✘ DON'T tips */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <h2 className="text-lg font-bold text-[#191c1d]">Things to Avoid During Your Job Search</h2>
                    </div>
                    <div className="space-y-3">
                        {dontTips.map((tip, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-[0_2px_16px_-4px_rgba(25,28,29,0.06)] p-5 flex items-start gap-4">
                                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#191c1d] mb-1">{tip.title}</p>
                                    <p className="text-sm text-[#414752] leading-[1.7]">{tip.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Report CTA */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 md:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-[#191c1d] mb-1">Spotted something suspicious?</h3>
                            <p className="text-sm text-[#414752] mb-4 leading-relaxed">
                                If you encounter a suspicious job listing, employer, or message on Jobsrow, report it immediately. Our team reviews all reports and takes swift action to protect the community.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <a
                                    href="mailto:support@jobsrow.com?subject=Report Suspicious Activity"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#176BBE] text-white text-sm font-semibold rounded-xl hover:bg-[#005399] transition-colors"
                                >
                                    <Mail className="w-4 h-4" />
                                    Report via Email
                                </a>
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#191c1d] text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    Contact Support
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

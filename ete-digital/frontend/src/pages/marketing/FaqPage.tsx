/**
 * FAQ Page
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

const categories = [
    {
        title: 'For Candidates',
        faqs: [
            { q: 'Is Jobsrow free for candidates?', a: 'Yes! Creating an account, browsing jobs, and applying is completely free for candidates. You only earn money through tryouts—never pay for anything.' },
            { q: 'What is a job tryout?', a: 'A tryout is a short, real-world work task set by the employer. Instead of a traditional interview, you demonstrate your skills directly. Companies set a compensation amount (typically ₹2,000–₹20,000) that you receive for completing the task—regardless of whether you get the job.' },
            { q: 'How do I get paid for tryouts?', a: 'Payment is held in escrow by Jobsrow when the employer creates a tryout. Once you submit your work, the employer reviews it within 5 business days. If approved, payment is released to your bank account within 2–3 business days.' },
            { q: 'What if my tryout is rejected?', a: "If your submission is rejected with valid reasoning, payment is returned to the employer. If the employer doesn't review within 5 business days, payment is automatically released to you." },
            { q: 'What is the Talent Vault?', a: 'The Talent Vault is your secure, verified portfolio. Upload your best work samples, projects, and credentials. You control exactly who can view each item and for how long. Employers can request access, which you approve.' },
        ],
    },
    {
        title: 'For Employers',
        faqs: [
            { q: 'How is Jobsrow different from LinkedIn or Indeed?', a: 'Traditional platforms help you find CVs. Jobsrow helps you hire based on actual work. Our paid tryout system means you see real performance before making a hiring decision—not just polished resumes.' },
            { q: 'How much do tryouts cost?', a: 'You set the compensation for each tryout. Typically, employers offer ₹2,000–₹20,000 depending on task complexity. Jobsrow charges a 10% platform fee on top of the tryout amount.' },
            { q: 'What if no one completes the tryout?', a: 'If no candidate is selected within 14 days, the escrow amount is fully refunded to your account.' },
            { q: 'Can I post jobs without tryouts?', a: 'Yes. You can post traditional job listings. However, attaching a tryout significantly improves candidate quality and drastically reduces mis-hires.' },
            { q: 'What plans are available for employers?', a: 'We offer a Pro plan (₹9,999/month) for growing teams and custom Enterprise pricing for larger organizations. See our Pricing page for details.' },
        ],
    },
    {
        title: 'Platform & Security',
        faqs: [
            { q: 'How does Jobsrow verify candidates?', a: "We verify email addresses during registration. Employers can also view verified credentials in a candidate's Talent Vault. Strong identity verification is on our roadmap." },
            { q: 'Is my data secure?', a: 'Yes. We use end-to-end encryption for sensitive data, JWT authentication with short-lived tokens, and industry-standard security practices. We never sell your personal data.' },
            { q: 'How does the matching algorithm work?', a: 'Our matching considers skills, experience, location preferences, job type, and salary expectations. We prioritize explainability—you always know why a candidate is suggested.' },
            { q: 'Can I delete my account?', a: "Yes. You can request account deletion from your Profile Settings. We'll permanently delete your data within 30 days, in compliance with privacy regulations." },
        ],
    },
];

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-gray-100 last:border-0">
            <button className="w-full flex items-center justify-between py-5 text-left" onClick={() => setOpen(!open)}>
                <span className="font-medium text-gray-900 text-sm pr-4">{q}</span>
                {open ? <ChevronUp className="w-5 h-5 text-primary-600 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
            </button>
            {open && <div className="pb-5 text-gray-600 text-sm leading-relaxed pr-8">{a}</div>}
        </div>
    );
}

export default function FaqPage() {
    return (
        <div className="min-h-screen bg-white">
            <PublicNavbar />
            <section className="pt-24 pb-12 bg-gradient-to-br from-gray-900 to-primary-900">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h1>
                    <p className="text-gray-300 text-lg">Everything you need to know about Jobsrow.</p>
                </div>
            </section>
            <section className="py-16">
                <div className="max-w-3xl mx-auto px-4 space-y-12">
                    {categories.map((cat, ci) => (
                        <div key={ci}>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-sm font-bold">{ci + 1}</span>
                                {cat.title}
                            </h2>
                            <div className="bg-white rounded-2xl border border-gray-200 px-6 shadow-soft">
                                {cat.faqs.map((faq, fi) => <FaqItem key={fi} q={faq.q} a={faq.a} />)}
                            </div>
                        </div>
                    ))}
                    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8 text-center border border-primary-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
                        <p className="text-gray-600 text-sm mb-4">Our support team is happy to help. We respond within 24 hours.</p>
                        <Link to="/contact" className="inline-block px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">Contact Us</Link>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}

/**
 * Terms of Service Page
 */
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/layout/PublicNavbar';
import Footer from '../components/layout/Footer';

const sections = [
    { title: '1. Acceptance of Terms', content: 'By creating an account on ETE Digital, you agree to these Terms of Service and our Privacy Policy. If you disagree with any part, you may not use our services.' },
    { title: '2. Eligibility', content: 'You must be at least 18 years old to use ETE Digital. By registering, you confirm that you meet this requirement and that the information you provide is accurate.' },
    {
        title: '3. Candidate Terms', content: `As a candidate:
- You may apply to jobs and participate in paid tryouts.
- Tryout submissions must be your own original work.
- You must not share tryout tasks, instructions, or intellectual property with third parties.
- Submitting plagiarized or AI-generated work (where prohibited by the employer) may result in account suspension.
- Payments for tryouts are released upon employer approval or after the 5-day review window.` },
    {
        title: '4. Employer Terms', content: `As an employer:
- You are responsible for ensuring tryout tasks are fair, legal, and clearly scoped.
- You must review tryout submissions within 5 business days.
- Compensation promised for tryouts must be funded in escrow before the tryout is assigned.
- You may not require work that could be used in production before making a hiring decision without paying the candidate appropriately.` },
    {
        title: '5. Payments & Escrow', content: `ETE Digital holds tryout payments in escrow via Stripe:
- Employers fund escrow before posting a tryout task.
- Upon approval, funds are released to the candidate minus the platform fee.
- If no decision is made in 5 business days, funds are automatically released to the candidate.
- Platform fee: 10% of tryout value, charged to the employer.
- Monthly subscription fees are non-refundable after use.` },
    { title: '6. Intellectual Property', content: 'Unless explicitly agreed otherwise, candidates retain intellectual property rights over their tryout submissions. Employers may only use submitted work for hiring evaluation purposes.' },
    {
        title: '7. Prohibited Conduct', content: `You may not:
- Create fake accounts or impersonate others.
- Post fraudulent jobs or tryouts.
- Harass, discriminate, or abuse other users.
- Attempt to scrape or extract platform data.
- Circumvent payment systems or fees.
Violations may result in immediate account suspension.` },
    { title: '8. Limitation of Liability', content: 'ETE Digital is a marketplace platform. We are not an employer of record and are not responsible for hiring decisions. Our liability is limited to the amount you paid us in the 3 months preceding any claim.' },
    { title: '9. Dispute Resolution', content: 'Disputes between candidates and employers regarding tryout payments should be reported to our support team within 14 days. ETE Digital\'s decision on escrow disputes is final. Governing law: India. Jurisdiction: Bengaluru, Karnataka.' },
    { title: '10. Changes to Terms', content: 'We may modify these terms with 30 days\' notice for material changes. Continued use constitutes acceptance.' },
];

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white">
            <PublicNavbar />

            <section className="pt-24 pb-12 bg-gradient-to-br from-gray-900 to-primary-900">
                <div className="max-w-3xl mx-auto px-4">
                    <p className="text-primary-300 text-sm mb-2">Legal</p>
                    <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
                    <p className="text-gray-300">Last updated: February 20, 2026</p>
                </div>
            </section>

            <section className="py-12">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="space-y-8">
                        {sections.map((s, i) => (
                            <div key={i}>
                                <h2 className="text-lg font-bold text-gray-900 mb-3">{s.title}</h2>
                                <div className="text-gray-600 text-sm leading-relaxed">
                                    {s.content.split('\n').map((line, li) => {
                                        const trimmed = line.trim();
                                        if (trimmed.startsWith('- ')) {
                                            return (
                                                <div key={li} className="flex gap-2 mb-1">
                                                    <span className="text-primary-400 mt-1">•</span>
                                                    <span>{trimmed.slice(2)}</span>
                                                </div>
                                            );
                                        }
                                        if (!trimmed) return <br key={li} />;
                                        return <p key={li} className="mb-2">{trimmed}</p>;
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
                        <Link to="/privacy-policy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                        <Link to="/cookies" className="text-primary-600 hover:underline">Cookie Policy</Link>
                        <Link to="/contact" className="text-primary-600 hover:underline">Contact Us</Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

/**
 * Privacy Policy Page
 */
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/layout/PublicNavbar';
import Footer from '../components/layout/Footer';

const sections = [
    {
        title: '1. Information We Collect',
        content: `When you register on ETE Digital, we collect:
- **Account Information**: Name, email address, password (hashed), and role (candidate/employer).
- **Profile Information**: Bio, skills, location, work experience, education, and profile photo.
- **Job & Application Data**: Jobs posted, applications submitted, and tryout submissions.
- **Payment Information**: Processed securely via Stripe. We do not store full card numbers.
- **Usage Data**: IP address, browser type, pages visited, and interaction events for analytics.
- **Communications**: Messages or emails you send to our support team.`,
    },
    {
        title: '2. How We Use Your Information',
        content: `We use your information to:
- Provide and improve our platform services.
- Match candidates with relevant job opportunities.
- Process tryout payments and manage escrow.
- Send verification emails, notifications, and platform updates.
- Detect fraud, abuse, and security incidents.
- Comply with legal obligations.

We do **not** sell your personal data to third parties.`,
    },
    {
        title: '3. Data Sharing',
        content: `We share your data only with:
- **Employers**: Your profile is visible to employers when you apply for their jobs. You control what is in your Talent Vault.
- **Payment Processors**: Stripe receives payment data to process transactions. See Stripe's Privacy Policy.
- **Infrastructure Providers**: Cloud infrastructure (encrypted at rest and in transit).
- **Law Enforcement**: When required by law or to protect our users.`,
    },
    {
        title: '4. Data Retention',
        content: `We retain your data for as long as your account is active. Upon account deletion:
- Profile and personal data: Deleted within 30 days.
- Transaction records: Retained for 7 years for tax and legal compliance.
- Anonymized analytics data: May be retained indefinitely.`,
    },
    {
        title: '5. Your Rights',
        content: `Depending on your jurisdiction, you have the right to:
- **Access**: Request a copy of your personal data.
- **Correction**: Update inaccurate information through your account settings.
- **Deletion**: Request account and data deletion from Profile Settings.
- **Portability**: Export your data in machine-readable format.
- **Opt-Out**: Unsubscribe from marketing emails at any time.

Contact us at privacy@etedigital.com to exercise these rights.`,
    },
    {
        title: '6. Security',
        content: `We implement industry-standard security measures:
- All data is encrypted in transit (TLS 1.3) and at rest (AES-256).
- Passwords are hashed using bcrypt.
- JWT tokens expire after 15 minutes.
- We conduct regular security audits.`,
    },
    {
        title: '7. Cookies',
        content: `We use essential cookies for authentication and security. See our Cookie Policy for full details. You can manage cookie preferences at any time.`,
    },
    {
        title: '8. Changes to This Policy',
        content: `We may update this policy periodically. We will notify you via email and in-app notification for material changes. Continued use after notice constitutes acceptance.`,
    },
    {
        title: '9. Contact Us',
        content: `For privacy-related questions, contact our Data Protection Officer at:
**privacy@etedigital.com**
ETE Digital • Bengaluru, Karnataka, India`,
    },
];

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white">
            <PublicNavbar />

            <section className="pt-24 pb-12 bg-gradient-to-br from-gray-900 to-primary-900">
                <div className="max-w-3xl mx-auto px-4">
                    <p className="text-primary-300 text-sm mb-2">Legal</p>
                    <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
                    <p className="text-gray-300">Last updated: February 20, 2026</p>
                </div>
            </section>

            <section className="py-12">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-800">
                        <strong>Summary:</strong> We collect only what we need, we don't sell your data, and you can delete your account anytime. Read on for the full details.
                    </div>

                    <div className="prose prose-gray max-w-none space-y-8">
                        {sections.map((section, i) => (
                            <div key={i}>
                                <h2 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h2>
                                <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                    {section.content.split('\n').map((line, li) => {
                                        const trimmed = line.trim();
                                        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                                            const text = trimmed.slice(2, -2);
                                            return <p key={li} className="font-semibold text-gray-800">{text}</p>;
                                        }
                                        if (trimmed.startsWith('- ')) {
                                            return (
                                                <div key={li} className="flex gap-2 mb-1">
                                                    <span className="text-primary-400 mt-1">•</span>
                                                    <span dangerouslySetInnerHTML={{
                                                        __html: trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                    }} />
                                                </div>
                                            );
                                        }
                                        if (!trimmed) return <br key={li} />;
                                        return (
                                            <p key={li} dangerouslySetInnerHTML={{
                                                __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                            }} />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
                        <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>
                        <Link to="/cookies" className="text-primary-600 hover:underline">Cookie Policy</Link>
                        <Link to="/contact" className="text-primary-600 hover:underline">Contact Us</Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

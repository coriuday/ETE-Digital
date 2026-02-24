/**
 * Cookie Policy Page
 */
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/layout/PublicNavbar';
import Footer from '../components/layout/Footer';

const cookieTypes = [
    { name: 'Essential', purpose: 'These cookies are required for the platform to function. They enable authentication, security, and session management.', examples: 'auth_token, session_id, csrf_token', canDisable: false },
    { name: 'Functional', purpose: 'Remember your preferences, such as language, notification settings, and display options.', examples: 'locale, theme, notification_prefs', canDisable: true },
    { name: 'Analytics', purpose: 'Help us understand how users interact with the platform so we can improve the experience. Data is anonymized.', examples: 'page_views, click_events, session_duration', canDisable: true },
    { name: 'Marketing', purpose: 'Used to show relevant job content and measure campaign effectiveness. We do not share this data with ad networks.', examples: 'utm_params, referral_source', canDisable: true },
];

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-white">
            <PublicNavbar />

            <section className="pt-24 pb-12 bg-gradient-to-br from-gray-900 to-primary-900">
                <div className="max-w-3xl mx-auto px-4">
                    <p className="text-primary-300 text-sm mb-2">Legal</p>
                    <h1 className="text-4xl font-bold text-white mb-4">Cookie Policy</h1>
                    <p className="text-gray-300">Last updated: February 20, 2026</p>
                </div>
            </section>

            <section className="py-12">
                <div className="max-w-3xl mx-auto px-4 space-y-8 text-sm text-gray-600">
                    <p>
                        ETE Digital uses cookies and similar technologies to provide a secure, personalized, and effective experience. This policy explains what cookies we use and why.
                    </p>

                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">What are cookies?</h2>
                        <p className="leading-relaxed">
                            Cookies are small text files stored on your device by your browser. They help websites remember information about your visit, such as your login state or preferences, making your next visit easier and more useful.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Types of cookies we use</h2>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-900">Type</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-900">Purpose</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-900">Examples</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-900">Can Disable?</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {cookieTypes.map((c, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">{c.name}</td>
                                            <td className="px-4 py-4 text-gray-600 leading-relaxed">{c.purpose}</td>
                                            <td className="px-4 py-4 text-gray-500 font-mono text-xs">{c.examples}</td>
                                            <td className="px-4 py-4">
                                                {c.canDisable ? (
                                                    <span className="text-green-600 font-semibold">Yes</span>
                                                ) : (
                                                    <span className="text-red-500 font-semibold">No (Required)</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">How to manage cookies</h2>
                        <p className="leading-relaxed mb-3">
                            You can control non-essential cookies from your{' '}
                            <Link to="/settings/notifications" className="text-primary-600 hover:underline">Notification Settings</Link>{' '}
                            page after logging in.
                        </p>
                        <p className="leading-relaxed">
                            You can also configure cookies directly in your browser settings. Note that disabling essential cookies may prevent you from logging in or using core platform features.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Cookie Retention</h2>
                        <p className="leading-relaxed">Session cookies expire when you close your browser. Persistent cookies expire between 7 days (auth tokens) and 1 year (preference settings).</p>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Updates to this Policy</h2>
                        <p className="leading-relaxed">We may update this policy as we add new features. The "last updated" date above reflects when it was last changed.</p>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
                        <Link to="/privacy-policy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                        <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>
                        <Link to="/contact" className="text-primary-600 hover:underline">Contact Us</Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

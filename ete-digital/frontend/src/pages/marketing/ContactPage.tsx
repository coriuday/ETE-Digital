/**
 * Contact Page
 */
import { useState } from 'react';
import { Mail, MessageSquare, Phone, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await new Promise(r => setTimeout(r, 1000));
            setSubmitted(true);
        } catch {
            setError('Failed to send your message. Please try again or email us directly.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <PublicNavbar />
            <section className="pt-24 pb-12 bg-gradient-to-br from-gray-900 to-primary-900">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Get in Touch</h1>
                    <p className="text-gray-300 text-lg">We'd love to hear from you. Our team is ready to help.</p>
                </div>
            </section>
            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                        <div className="lg:col-span-2 space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                                <div className="space-y-4">
                                    {[
                                        { icon: <Mail className="w-5 h-5 text-primary-600" />, label: 'Email', value: 'hello@etedigital.com' },
                                        { icon: <Phone className="w-5 h-5 text-primary-600" />, label: 'Phone', value: '+91 80000 00000' },
                                        { icon: <MapPin className="w-5 h-5 text-primary-600" />, label: 'Office', value: 'Bengaluru, Karnataka, India' },
                                        { icon: <MessageSquare className="w-5 h-5 text-primary-600" />, label: 'Response Time', value: 'Within 24 business hours' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">{item.icon}</div>
                                            <div>
                                                <div className="text-xs text-gray-500 font-medium">{item.label}</div>
                                                <div className="text-gray-900 text-sm font-medium">{item.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-primary-50 rounded-2xl p-6">
                                <h3 className="font-bold text-gray-900 mb-2">For Enterprises</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">Looking for custom integrations, white-labeling, or bulk hiring solutions? Our enterprise team will set up a dedicated call.</p>
                            </div>
                        </div>
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-soft">
                                {submitted ? (
                                    <div className="text-center py-8">
                                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-7 h-7 text-green-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Message sent!</h3>
                                        <p className="text-gray-500 text-sm">We'll get back to you within 24 hours.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                                <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Your name" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                            <select name="subject" value={form.subject} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                                                <option value="">Select a topic...</option>
                                                <option value="general">General Inquiry</option>
                                                <option value="hiring">I'm an Employer</option>
                                                <option value="candidate">I'm a Candidate</option>
                                                <option value="enterprise">Enterprise / Partnerships</option>
                                                <option value="bug">Report a Bug</option>
                                                <option value="billing">Billing Issue</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                            <textarea name="message" value={form.message} onChange={handleChange} required rows={5} placeholder="Tell us how we can help..." className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
                                        </div>
                                        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                                        <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-700 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send Message'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}

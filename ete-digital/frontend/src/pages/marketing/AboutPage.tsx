/**
 * About Page
 */
import { Link } from 'react-router-dom';
import { Target, Heart, Users, Zap, ArrowRight } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

const values = [
    { icon: <Target className="w-6 h-6 text-primary-600" />, title: 'Outcome-First', desc: 'We believe hiring decisions should be based on real work, not résumé keywords or interview performance anxiety.' },
    { icon: <Heart className="w-6 h-6 text-primary-600" />, title: 'Fair for All', desc: 'Candidates deserve to be paid for their time and effort. Our paid tryout model ensures everyone benefits from the process.' },
    { icon: <Users className="w-6 h-6 text-primary-600" />, title: 'Trust & Transparency', desc: 'Both sides see the same information. No hidden agendas, no black-box algorithms. Just clear, explainable matching.' },
    { icon: <Zap className="w-6 h-6 text-primary-600" />, title: 'Speed to Hire', desc: 'Traditional hiring takes 45+ days. Our streamlined tryout process cuts time-to-hire to under 2 weeks.' },
];

// const team = [
//     { name: 'Arjun Mehta', role: 'CEO & Co-founder', initials: 'AM', bio: 'Former engineering manager at Google. Frustrated by 6-month hiring cycles, he built the solution.' },
//     { name: 'Kavya Reddy', role: 'CTO & Co-founder', initials: 'KR', bio: 'Ex-Stripe engineer. Built the escrow payment system that makes paid tryouts trustworthy and fair.' },
//     { name: 'Siddhant Joshi', role: 'Head of Product', initials: 'SJ', bio: 'Previously at LinkedIn. Believes every candidate deserves a fair chance to show their real abilities.' },
//     { name: 'Meera Nair', role: 'Head of Operations', initials: 'MN', bio: 'Passionate about building equitable hiring systems that work for candidates from all backgrounds.' },
// ];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-24 pb-16 bg-gradient-to-br from-gray-900 to-primary-900">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        About Jobsrow
                    </h1>
                    <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                        Jobsrow is a fast-growing job platform designed to simplify the way job seekers and employers connect. Our mission is to make job searching easier, faster, and more effective by putting users at the center of everything we do.
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-2xl p-10 shadow-soft border border-gray-100">
                        <div className="text-4xl mb-4 text-center">🎯</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Our Mission</h2>
                        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto text-center">
                            To create a world where every hiring decision is based on demonstrated skill,
                            where candidates are compensated for their effort, and where employers find
                            the right person every single time—faster and fairer than ever before.
                        </p>
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-sm text-gray-600 leading-[1.8] max-w-2xl mx-auto">
                                We provide powerful tools that help job seekers explore opportunities, build professional profiles, and connect with employers across multiple industries. At the same time, we empower businesses to discover qualified talent through smart hiring solutions and streamlined recruitment processes.
                            </p>
                            <p className="text-sm text-gray-600 leading-[1.8] max-w-2xl mx-auto mt-3">
                                With the support of advanced technology, data-driven insights, and intelligent matching systems, Jobsrow enhances the hiring experience for both candidates and employers. Our platform is built to reduce hiring time, improve candidate quality, and create meaningful career opportunities.
                            </p>
                            <p className="text-sm font-medium text-gray-900 leading-[1.8] max-w-2xl mx-auto mt-3">
                                Jobsrow aims to become a trusted global platform by continuously innovating and adapting to the evolving job market, helping individuals grow their careers and organizations build strong teams.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 bg-white">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What we stand for</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {values.map((v, i) => (
                            <div key={i} className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:shadow-soft transition-shadow">
                                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    {v.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Story */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">The story behind Jobsrow</h2>
                            <div className="space-y-4 text-gray-600 leading-relaxed text-sm">
                                <p>In 2023, our co-founder Arjun was hiring engineers at a fast-growing startup. After 3 months, 120 interviews, and 15 take-home assignments (all unpaid), he was exhausted—and still hadn't found the right fit.</p>
                                <p>Meanwhile, his friend Priya—a talented developer—had spent 40+ hours on unpaid take-homes for companies that ghosted her. The system was failing everyone.</p>
                                <p>Arjun and Kavya teamed up to build Jobsrow: a platform where tryouts are paid, transparent, and lead to actual outcomes. Since launch, over ₹2.5 crore has been paid to candidates for completing tryouts.</p>
                                <p className="font-medium text-gray-900">That's the future of hiring we're building.</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8 text-center">
                            <div className="text-5xl font-black text-primary-600 mb-2">2023</div>
                            <div className="text-gray-600 text-sm mb-6">Founded</div>
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { v: '₹2.5Cr+', l: 'Paid to Candidates' },
                                    { v: '95%', l: 'Hire Rate' },
                                    { v: '12 days', l: 'Avg. Time to Hire' },
                                    { v: '4.8/5', l: 'Candidate Rating' },
                                ].map((s, i) => (
                                    <div key={i}>
                                        <div className="text-xl font-bold text-primary-700">{s.v}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{s.l}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team
            <section className="py-16 bg-white">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Meet the team</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {team.map((member, i) => (
                            <div key={i} className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                                    {member.initials}
                                </div>
                                <h3 className="font-bold text-gray-900">{member.name}</h3>
                                <p className="text-primary-600 text-sm mb-2">{member.role}</p>
                                <p className="text-gray-500 text-xs leading-relaxed">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section> */}

            {/* CTA */}
            <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-700">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Join us in reshaping hiring</h2>
                    <p className="text-primary-100 mb-8">Whether you're a candidate or employer, the future of hiring starts here.</p>
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-bold hover:bg-primary-50 transition-colors"
                    >
                        Get Started Free <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}

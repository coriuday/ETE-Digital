import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code, Zap, ChevronRight, Briefcase, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-[128px] -z-10 animate-pulse" />
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[128px] -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

            {/* Navigation Bar */}
            <nav className="fixed w-full z-50 top-0 transition-all border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 flex items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
                            >
                                ETE Digital
                            </motion.div>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <Link to="/jobs" className="text-slate-300 hover:text-white transition-colors">Find Jobs</Link>
                            <Link to="/tryouts" className="text-slate-300 hover:text-white transition-colors">Tryouts</Link>
                            <div className="flex space-x-4">
                                <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-white hover:text-blue-400 transition-colors">
                                    Sign In
                                </Link>
                                <Link to="/register" className="px-5 py-2.5 text-sm font-medium rounded-full bg-blue-600 hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                                    Join Now
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 lg:pt-48 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                            Prove Your Skills. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                                Land the Job.
                            </span>
                        </h1>
                        <p className="mt-4 max-w-2xl text-lg md:text-xl text-slate-400 mx-auto mb-10">
                            The world's premium developer hiring platform where your code speaks louder than your resume. Take specialized tryouts and build your verified Talent Vault.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <Link to="/jobs" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                Find Elite Jobs
                            </Link>
                            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 border border-slate-700 backdrop-blur-sm text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center group">
                                Hire Top Talent
                                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Glassmorphic Stats Strip */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-5xl mx-auto mt-20 px-4"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl">
                        {[
                            { label: 'Active Jobs', value: '2k+' },
                            { label: 'Verified Talent', value: '15k+' },
                            { label: 'Tryouts Taken', value: '40k+' },
                            { label: 'Hiring Rate', value: '94%' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{stat.value}</div>
                                <div className="text-sm text-slate-400 mt-1 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </main>

            {/* Features Section */}
            <section className="py-24 bg-slate-950 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">A Next-Gen Hiring Experience</h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">Skip the generic interviews. Show exactly what you can build.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Code className="w-8 h-8 text-blue-400" />,
                                title: 'Skill-Based Tryouts',
                                desc: 'Take project-based assessments tailored to the exact role. Let your code do the talking.',
                                border: 'border-blue-500/20',
                                glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                            },
                            {
                                icon: <ShieldCheck className="w-8 h-8 text-purple-400" />,
                                title: 'Secure Talent Vault',
                                desc: 'Store your verified projects, grades, and code in a secure, shareable portfolio vault.',
                                border: 'border-purple-500/20',
                                glow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]'
                            },
                            {
                                icon: <Zap className="w-8 h-8 text-emerald-400" />,
                                title: 'Automated Grading',
                                desc: 'Instant feedback on your submissions using our advanced automated code evaluation engine.',
                                border: 'border-emerald-500/20',
                                glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className={`group p-8 rounded-3xl bg-slate-900/50 backdrop-blur-md border border-white/5 ${feature.border} ${feature.glow} transition-all duration-300`}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Jobs Preview */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[120px] -z-10" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured Roles</h2>
                            <p className="text-slate-400">Top opportunities waiting for your skills.</p>
                        </div>
                        <Link to="/jobs" className="hidden md:flex items-center text-blue-400 hover:text-blue-300 font-medium pb-1 transition-colors">
                            View All Jobs <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: 'Senior React Engineer', company: 'TechNova', salary: '$140k - $180k', tags: ['Remote', 'React', 'TypeScript'] },
                            { title: 'Lead DevOps Architect', company: 'CloudBase', salary: '$160k - $210k', tags: ['Hybrid', 'AWS', 'Kubernetes'] },
                            { title: 'Machine Learning Exec', company: 'DataSphere', salary: '$150k - $200k', tags: ['Remote', 'Python', 'PyTorch'] },
                        ].map((job, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 transition-colors group cursor-pointer">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{job.title}</h3>
                                        <p className="text-slate-400 text-sm mt-1">{job.company}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-slate-400" />
                                    </div>
                                </div>
                                <div className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500 font-semibold mb-6">
                                    {job.salary}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {job.tags.map((tag, j) => (
                                        <span key={j} className="px-3 py-1 text-xs font-medium bg-white/5 border border-white/10 rounded-full text-slate-300">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-slate-950 mt-12 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
                        ETE Digital
                    </h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                        Elevating tech recruitment with skill-based tryouts and secure talent vaults.
                    </p>
                    <div className="flex justify-center space-x-6 text-sm text-slate-400">
                        <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link to="#" className="hover:text-white transition-colors">Contact Us</Link>
                    </div>
                    <div className="mt-12 text-slate-600 text-sm">
                        &copy; {new Date().getFullYear()} ETE Digital. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

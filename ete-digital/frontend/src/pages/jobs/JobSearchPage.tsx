/**
 * Job Search Page — Fully theme-aware (light + dark modes)
 * Premium redesign with proper dark/light mode support and click animations
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search, MapPin, Briefcase, SlidersHorizontal,
    LayoutGrid, List, ArrowRight, Building2, Clock, DollarSign, X, Zap
} from 'lucide-react';
import { jobsApi, Job, JobSearchParams } from '../../api/jobs';
import { useTheme } from '../../contexts/ThemeContext';

// ── Filter Sidebar ────────────────────────────────────────────────────────────

interface Filters {
    jobType: string;
    remote: boolean;
    salaryMin: string;
    hasTryout: boolean;
}

function FilterSidebar({ filters, onChange, onClose, isDark }: {
    filters: Filters;
    onChange: (f: Filters) => void;
    onClose?: () => void;
    isDark: boolean;
}) {
    return (
        <aside className={`w-full rounded-3xl p-6 space-y-8 relative overflow-hidden transition-colors duration-200
            ${isDark
                ? 'bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl'
                : 'bg-white border border-gray-200 shadow-sm'}`}>

            {/* Ambient glow (dark only) */}
            {isDark && <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none" />}

            <div className="flex items-center justify-between relative z-10">
                <h3 className={`text-xl font-bold tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>Filters</h3>
                {onClose && (
                    <button onClick={onClose} className={`lg:hidden transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Tryout Toggle */}
            <div className={`relative z-10 flex items-center justify-between p-4 rounded-xl
                ${isDark
                    ? 'bg-purple-500/10 border border-purple-500/20'
                    : 'bg-violet-50 border border-violet-200'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center
                        ${isDark ? 'bg-purple-500/20' : 'bg-violet-100'}`}>
                        <Zap size={16} className={isDark ? 'text-purple-400' : 'text-violet-600'} />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Has Tryout</p>
                        <p className={`text-xs ${isDark ? 'text-purple-200/70' : 'text-violet-500'}`}>Skill-based hiring</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={filters.hasTryout}
                        onChange={(e) => onChange({ ...filters, hasTryout: e.target.checked })}
                    />
                    <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500 transition-colors
                        ${isDark ? 'bg-slate-700 border border-white/10' : 'bg-gray-200 border border-gray-300'}`}></div>
                </label>
            </div>

            {/* Job Type */}
            <div className="relative z-10">
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Job Type</p>
                <div className="space-y-3">
                    {['', 'full-time', 'part-time', 'contract', 'internship'].map((type) => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="radio"
                                    name="jobType"
                                    checked={filters.jobType === type}
                                    onChange={() => onChange({ ...filters, jobType: type })}
                                    className={`peer appearance-none w-5 h-5 rounded border transition-colors cursor-pointer
                                        ${isDark
                                            ? 'border-white/20 bg-slate-800 checked:bg-blue-500 checked:border-blue-400'
                                            : 'border-gray-300 bg-white checked:bg-indigo-500 checked:border-indigo-500'}`}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                            </div>
                            <span className={`text-sm capitalize tracking-wide font-medium transition-colors cursor-pointer
                                ${isDark
                                    ? 'text-slate-300 group-hover:text-white'
                                    : 'text-gray-600 group-hover:text-gray-900'}`}>
                                {type ? type.replace('-', ' ') : 'Any Type'}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Remote */}
            <div className="relative z-10">
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Work Arrangement</p>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={filters.remote}
                            onChange={(e) => onChange({ ...filters, remote: e.target.checked })}
                            className={`peer appearance-none w-5 h-5 rounded border transition-colors cursor-pointer
                                ${isDark
                                    ? 'border-white/20 bg-slate-800 checked:bg-blue-500 checked:border-blue-400'
                                    : 'border-gray-300 bg-white checked:bg-indigo-500 checked:border-indigo-500'}`}
                        />
                        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className={`text-sm font-medium transition-colors cursor-pointer
                        ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                        Remote only
                    </span>
                </label>
            </div>

            {/* Salary */}
            <div className="relative z-10">
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Minimum Salary</p>
                <div className="relative group">
                    <DollarSign size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-400 group-focus-within:text-emerald-400' : 'text-gray-400 group-focus-within:text-emerald-500'}`} />
                    <input
                        type="number"
                        placeholder="e.g. 100000"
                        value={filters.salaryMin}
                        onChange={(e) => onChange({ ...filters, salaryMin: e.target.value })}
                        className={`w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 transition-all
                            ${isDark
                                ? 'bg-slate-900 border border-white/10 text-white focus:ring-emerald-500/50 focus:border-emerald-500 placeholder:text-slate-600'
                                : 'bg-gray-50 border border-gray-200 text-gray-900 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder:text-gray-400'}`}
                    />
                </div>
            </div>

            {/* Reset */}
            <div className={`relative z-10 pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                <button
                    onClick={() => onChange({ jobType: '', remote: false, salaryMin: '', hasTryout: false })}
                    className={`w-full py-3 text-sm font-bold rounded-xl transition-all active:scale-95
                        ${isDark
                            ? 'text-slate-400 hover:text-white border border-white/10 hover:bg-white/5'
                            : 'text-gray-500 hover:text-gray-800 border border-gray-200 hover:bg-gray-50'}`}
                >
                    Reset Filters
                </button>
            </div>
        </aside>
    );
}

// ── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({ job, view, isDark }: { job: Job; view: 'grid' | 'list'; isDark: boolean }) {
    const isGrid = view === 'grid';
    return (
        <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative rounded-2xl transition-all p-6 flex cursor-pointer
                ${isGrid ? 'flex-col' : 'flex-col sm:flex-row items-start gap-6'}
                ${isDark
                    ? 'bg-slate-900/60 backdrop-blur-md border border-white/5 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                    : 'bg-white border border-gray-100 hover:border-indigo-300 hover:shadow-lg shadow-sm'}`}
        >
            <Link to={`/jobs/${job.id}`} className="absolute inset-0 z-10" aria-label={`View details for ${job.title}`} />

            <div className="flex w-full gap-4 items-start">
                <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                        ${isDark
                            ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 group-hover:border-blue-500/30'
                            : 'bg-indigo-50 border border-indigo-100 group-hover:border-indigo-300'}`}>
                        <Building2 size={24} className={isDark ? 'text-blue-400' : 'text-indigo-500'} />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                        <h3 className={`text-lg font-bold transition-colors truncate
                            ${isDark ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-indigo-600'}`}>
                            {job.title}
                        </h3>
                    </div>

                    <p className={`text-sm font-medium mb-4 truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {job.company ?? 'Confidential Company'}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {job.has_tryout && (
                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide
                                ${isDark ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300' : 'bg-violet-50 border border-violet-200 text-violet-700'}`}>
                                <Zap size={10} /> Skill Tryout
                            </span>
                        )}
                        {job.remote_ok && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide
                                ${isDark ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
                                Remote
                            </span>
                        )}
                        {job.job_type && (
                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize
                                ${isDark ? 'bg-slate-800 border border-white/5 text-slate-300' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
                                <Clock size={10} /> {job.job_type.replace('-', ' ')}
                            </span>
                        )}
                    </div>
                </div>

                {!isGrid && (
                    <div className="hidden sm:flex flex-col items-end flex-shrink-0 relative z-20">
                        {job.salary_min != null ? (
                            <div className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500 font-bold text-lg text-right">
                                ${job.salary_min.toLocaleString()}
                                {job.salary_max ? ` – $${job.salary_max.toLocaleString()}` : '+'}
                            </div>
                        ) : (
                            <div className={`font-medium text-sm text-right ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Competitive</div>
                        )}
                        <button className={`mt-4 px-5 py-2 rounded-full text-sm font-bold transition-all active:scale-95 relative z-20
                            ${isDark
                                ? 'border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white'
                                : 'border border-indigo-300 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}>
                            View Details
                        </button>
                    </div>
                )}
            </div>

            <div className={`w-full ${isGrid ? 'mt-4 pt-4' : 'sm:hidden mt-4 pt-4'} border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                {job.salary_min != null ? (
                    <div className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500 font-bold mb-4">
                        ${job.salary_min.toLocaleString()}
                        {job.salary_max ? ` – $${job.salary_max.toLocaleString()}` : '+'}
                    </div>
                ) : (
                    <div className={`font-medium text-sm mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Competitive Salary</div>
                )}

                <div className="flex items-center justify-between mt-auto">
                    <div className={`flex items-center text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        <MapPin size={12} className="mr-1" /> {job.location || 'Anywhere'}
                    </div>
                    <span className={`flex items-center gap-1 text-sm font-bold group-hover:gap-2 transition-all relative z-20
                        ${isDark ? 'text-blue-400' : 'text-indigo-600'}`}>
                        Details <ArrowRight size={14} />
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function JobSearchPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<Filters>({ jobType: '', remote: false, salaryMin: '', hasTryout: false });
    const [jobs, setJobs] = useState<Job[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const PAGE_SIZE = 12;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: JobSearchParams = {
                page,
                page_size: PAGE_SIZE,
                ...(query && { query }),
                ...(location && { location }),
                ...(filters.jobType && { job_type: filters.jobType }),
                ...(filters.remote && { remote_ok: true }),
                ...(filters.salaryMin && { salary_min: Number(filters.salaryMin) }),
                ...(filters.hasTryout && { has_tryout: true }),
            };
            const data = await jobsApi.searchJobs(params);
            setJobs(data.jobs);
            setTotal(data.total);
        } catch {
            setJobs([]);
        } finally {
            setLoading(false);
        }
    }, [query, location, filters, page]);

    useEffect(() => { load(); }, [load]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        load();
    };

    return (
        <div className={`min-h-screen font-sans selection:bg-violet-500/30 transition-colors duration-300
            ${isDark ? 'bg-slate-950 text-slate-50' : 'bg-gray-50 text-slate-900'}`}>

            {/* Ambient background blobs */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] ${isDark ? 'bg-blue-600/10' : 'bg-indigo-400/5'}`} />
                <div className={`absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full blur-[100px] ${isDark ? 'bg-purple-600/10' : 'bg-violet-400/5'}`} />
            </div>

            {/* Search header */}
            <div className={`relative z-10 pt-24 pb-8 border-b transition-colors duration-200
                ${isDark ? 'border-white/5 bg-slate-900/30 backdrop-blur-md' : 'border-gray-200 bg-white/80 backdrop-blur-md'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center md:text-left">
                        <h1 className={`text-4xl md:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Explore{' '}
                            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isDark ? 'from-violet-400 to-indigo-400' : 'from-violet-600 to-indigo-600'}`}>
                                Elite Opportunities
                            </span>
                        </h1>
                        <p className={`text-lg md:text-xl max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {total > 0
                                ? `${total.toLocaleString()} positions curated for top engineering talent.`
                                : 'Search from thousands of verified roles tailored to your skills.'}
                        </p>
                    </motion.div>

                    {/* Search bar */}
                    <form onSubmit={handleSearch}
                        className={`flex flex-col md:flex-row gap-4 p-3 rounded-3xl border transition-colors duration-200
                            ${isDark
                                ? 'bg-slate-900/60 border-white/10 backdrop-blur-xl shadow-2xl'
                                : 'bg-white border-gray-200 shadow-sm'}`}>
                        <div className={`flex-1 flex items-center gap-3 px-4 rounded-2xl border transition-all focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/50
                            ${isDark ? 'bg-slate-800/50 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                            <Search size={20} className={isDark ? 'text-blue-400 flex-shrink-0' : 'text-indigo-400 flex-shrink-0'} />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Job title, skills, or company..."
                                className={`flex-1 py-4 bg-transparent outline-none font-medium
                                    ${isDark ? 'text-white placeholder:text-slate-500' : 'text-gray-900 placeholder:text-gray-400'}`}
                            />
                        </div>
                        <div className={`md:w-1/3 flex items-center gap-3 px-4 rounded-2xl border transition-all focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/50
                            ${isDark ? 'bg-slate-800/50 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                            <MapPin size={20} className={isDark ? 'text-purple-400 flex-shrink-0' : 'text-violet-400 flex-shrink-0'} />
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="City or Remote"
                                className={`flex-1 py-4 bg-transparent outline-none font-medium
                                    ${isDark ? 'text-white placeholder:text-slate-500' : 'text-gray-900 placeholder:text-gray-400'}`}
                            />
                        </div>
                        <button type="submit"
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-violet-700 hover:to-indigo-700 active:scale-95 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                            Find Jobs
                        </button>
                    </form>
                </div>
            </div>

            {/* Body */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filter — desktop */}
                    <div className="hidden lg:block w-72 flex-shrink-0">
                        <FilterSidebar filters={filters} isDark={isDark} onChange={(f) => { setFilters(f); setPage(1); }} />
                    </div>

                    {/* Jobs list */}
                    <div className="flex-1 min-w-0">
                        {/* Controls bar */}
                        <div className={`flex items-center justify-between mb-8 p-4 rounded-2xl border transition-colors duration-200
                            ${isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-sm' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`lg:hidden flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all active:scale-95
                                        ${isDark ? 'border-white/10 bg-slate-800 text-white hover:bg-slate-700' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                                    <SlidersHorizontal size={16} /> Filters
                                </button>
                                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    Showing{' '}
                                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{Math.min(jobs.length, total)}</span>
                                    {' '}of{' '}
                                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{total}</span>
                                    {' '}roles
                                </p>
                            </div>
                            <div className={`flex items-center gap-1 border rounded-xl p-1
                                ${isDark ? 'bg-slate-950/50 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                                <button onClick={() => setView('grid')}
                                    className={`p-2 rounded-lg transition-all active:scale-90
                                        ${view === 'grid'
                                            ? isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-indigo-600 shadow-sm'
                                            : isDark ? 'text-slate-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                                    <LayoutGrid size={18} />
                                </button>
                                <button onClick={() => setView('list')}
                                    className={`p-2 rounded-lg transition-all active:scale-90
                                        ${view === 'list'
                                            ? isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-indigo-600 shadow-sm'
                                            : isDark ? 'text-slate-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                                    <List size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Mobile filter overlay */}
                        {showFilters && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="lg:hidden mb-8 overflow-hidden">
                                <FilterSidebar filters={filters} isDark={isDark} onChange={setFilters} onClose={() => setShowFilters(false)} />
                            </motion.div>
                        )}

                        {/* Grid/List */}
                        {loading ? (
                            <div className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className={`rounded-2xl border p-6 animate-pulse ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-gray-100'}`}>
                                        <div className="flex gap-4 mb-6">
                                            <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />
                                            <div className="space-y-3 flex-1 pt-1">
                                                <div className={`h-4 rounded w-3/4 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                                                <div className={`h-3 rounded w-1/2 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />
                                            </div>
                                        </div>
                                        <div className={`h-3 rounded w-full mb-3 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />
                                        <div className={`h-3 rounded w-2/3 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />
                                    </div>
                                ))}
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className={`flex flex-col items-center justify-center py-32 text-center rounded-3xl border border-dashed
                                ${isDark ? 'bg-slate-900/20 border-white/5' : 'bg-white border-gray-200'}`}>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
                                    <Briefcase size={32} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
                                </div>
                                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No matching jobs</h3>
                                <p className={`max-w-md ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    We couldn't find any opportunities matching your exact criteria. Try adjusting your filters or search terms.
                                </p>
                                <button
                                    onClick={() => { setQuery(''); setLocation(''); setFilters({ jobType: '', remote: false, salaryMin: '', hasTryout: false }); setPage(1); load(); }}
                                    className={`mt-6 px-6 py-2.5 font-bold rounded-xl transition-all active:scale-95 border
                                        ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-white/10' : 'bg-gray-900 hover:bg-gray-800 text-white border-gray-900'}`}>
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                                    className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                    {jobs.map((j) => <JobCard key={j.id} job={j} view={view} isDark={isDark} />)}
                                </motion.div>
                                {/* Pagination */}
                                {total > PAGE_SIZE && (
                                    <div className={`flex items-center justify-center gap-4 mt-12 py-4 rounded-2xl border
                                        ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-gray-200'}`}>
                                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                            className={`px-5 py-2.5 text-sm font-bold border rounded-xl transition-all active:scale-95 disabled:opacity-30
                                                ${isDark ? 'border-white/10 hover:bg-slate-800 text-white disabled:hover:bg-transparent' : 'border-gray-200 hover:bg-gray-50 text-gray-700 disabled:hover:bg-transparent'}`}>
                                            Previous
                                        </button>
                                        <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                            Page <span className={`mx-1 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{page}</span> of {Math.ceil(total / PAGE_SIZE)}
                                        </span>
                                        <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
                                            className={`px-5 py-2.5 text-sm font-bold border rounded-xl transition-all active:scale-95 disabled:opacity-30
                                                ${isDark ? 'border-white/10 hover:bg-slate-800 text-white disabled:hover:bg-transparent' : 'border-gray-200 hover:bg-gray-50 text-gray-700 disabled:hover:bg-transparent'}`}>
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

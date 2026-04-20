/**
 * Job Search Page — Light theme
 * Premium redesign with light mode and click animations
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search, MapPin, Briefcase, SlidersHorizontal,
    LayoutGrid, List, ArrowRight, Building2, Clock, DollarSign, X, Zap
} from 'lucide-react';
import { jobsApi, Job, JobSearchParams } from '../../api/jobs';
import { useAuthStore } from '../../stores/authStore';
import AppShell from '../../components/layout/AppShell';

// ── Filter Sidebar ────────────────────────────────────────────────────────────

interface Filters {
    jobType: string;
    remote: boolean;
    salaryMin: string;
    hasTryout: boolean;
}

function FilterSidebar({ filters, onChange, onClose }: {
    filters: Filters;
    onChange: (f: Filters) => void;
    onClose?: () => void;
}) {
    return (
        <aside className="w-full rounded-3xl p-6 space-y-8 relative overflow-hidden bg-white border border-gray-200 shadow-sm">

            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-wide text-gray-900">Filters</h3>
                {onClose && (
                    <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-700">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Tryout Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-violet-50 border border-violet-200">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-violet-100">
                        <Zap size={16} className="text-violet-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Has Tryout</p>
                        <p className="text-xs text-violet-500">Skill-based hiring</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={filters.hasTryout}
                        onChange={(e) => onChange({ ...filters, hasTryout: e.target.checked })}
                    />
                    <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500 transition-colors bg-gray-200 border border-gray-300"></div>
                </label>
            </div>

            {/* Job Type */}
            <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-400">Job Type</p>
                <div className="space-y-3">
                    {['', 'full-time', 'part-time', 'contract', 'internship'].map((type) => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="radio"
                                    name="jobType"
                                    checked={filters.jobType === type}
                                    onChange={() => onChange({ ...filters, jobType: type })}
                                    className="peer appearance-none w-5 h-5 rounded border transition-colors cursor-pointer border-gray-300 bg-white checked:bg-indigo-500 checked:border-indigo-500"
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                            </div>
                            <span className="text-sm capitalize tracking-wide font-medium transition-colors cursor-pointer text-gray-600 group-hover:text-gray-900">
                                {type ? type.replace('-', ' ') : 'Any Type'}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Remote */}
            <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-400">Work Arrangement</p>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={filters.remote}
                            onChange={(e) => onChange({ ...filters, remote: e.target.checked })}
                            className="peer appearance-none w-5 h-5 rounded border transition-colors cursor-pointer border-gray-300 bg-white checked:bg-indigo-500 checked:border-indigo-500"
                        />
                        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="text-sm font-medium transition-colors cursor-pointer text-gray-600 group-hover:text-gray-900">
                        Remote only
                    </span>
                </label>
            </div>

            {/* Salary */}
            <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-400">Minimum Salary</p>
                <div className="relative group">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500" />
                    <input
                        type="number"
                        placeholder="e.g. 100000"
                        value={filters.salaryMin}
                        onChange={(e) => onChange({ ...filters, salaryMin: e.target.value })}
                        className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 transition-all bg-gray-50 border border-gray-200 text-gray-900 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Reset */}
            <div className="pt-4 border-t border-gray-100">
                <button
                    onClick={() => onChange({ jobType: '', remote: false, salaryMin: '', hasTryout: false })}
                    className="w-full py-3 text-sm font-bold rounded-xl transition-all active:scale-95 text-gray-500 hover:text-gray-800 border border-gray-200 hover:bg-gray-50"
                >
                    Reset Filters
                </button>
            </div>
        </aside>
    );
}

// ── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({ job, view }: { job: Job; view: 'grid' | 'list' }) {
    const isGrid = view === 'grid';
    return (
        <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative rounded-2xl transition-all p-6 flex cursor-pointer bg-white border border-gray-100 hover:border-indigo-300 hover:shadow-lg shadow-sm
                ${isGrid ? 'flex-col' : 'flex-col sm:flex-row items-start gap-6'}`}
        >
            <Link to={`/jobs/${job.id}`} className="absolute inset-0 z-10" aria-label={`View details for ${job.title}`} />

            <div className="flex w-full gap-4 items-start">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100 group-hover:border-indigo-300">
                        <Building2 size={24} className="text-indigo-500" />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                            {job.title}
                        </h3>
                    </div>

                    <p className="text-sm font-medium mb-4 truncate text-gray-500">
                        {job.company ?? 'Confidential Company'}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {job.has_tryout && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-violet-50 border border-violet-200 text-violet-700">
                                <Zap size={10} /> Skill Tryout
                            </span>
                        )}
                        {job.remote_ok && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-blue-50 border border-blue-200 text-blue-700">
                                Remote
                            </span>
                        )}
                        {job.job_type && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize bg-gray-100 border border-gray-200 text-gray-600">
                                <Clock size={10} /> {job.job_type.replace('-', ' ')}
                            </span>
                        )}
                    </div>
                </div>

                {!isGrid && (
                    <div className="hidden sm:flex flex-col items-end flex-shrink-0 relative z-20">
                        {job.salary_min != null ? (
                            <div className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-lg text-right">
                                ${job.salary_min.toLocaleString()}
                                {job.salary_max ? ` – $${job.salary_max.toLocaleString()}` : '+'}
                            </div>
                        ) : (
                            <div className="font-medium text-sm text-right text-gray-400">Competitive</div>
                        )}
                        <button className="mt-4 px-5 py-2 rounded-full text-sm font-bold transition-all active:scale-95 relative z-20 border border-indigo-300 text-indigo-600 hover:bg-indigo-600 hover:text-white">
                            View Details
                        </button>
                    </div>
                )}
            </div>

            <div className={`w-full ${isGrid ? 'mt-4 pt-4' : 'sm:hidden mt-4 pt-4'} border-t border-gray-100`}>
                {job.salary_min != null ? (
                    <div className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold mb-4">
                        ${job.salary_min.toLocaleString()}
                        {job.salary_max ? ` – $${job.salary_max.toLocaleString()}` : '+'}
                    </div>
                ) : (
                    <div className="font-medium text-sm mb-4 text-gray-400">Competitive Salary</div>
                )}

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center text-xs text-gray-400">
                        <MapPin size={12} className="mr-1" /> {job.location || 'Anywhere'}
                    </div>
                    <span className="flex items-center gap-1 text-sm font-bold group-hover:gap-2 transition-all relative z-20 text-indigo-600">
                        Details <ArrowRight size={14} />
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function JobSearchPage() {
    const { isAuthenticated } = useAuthStore();

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

    const content = (
        <div className="min-h-screen font-sans bg-gray-50 text-gray-900">

            {/* Search header */}
            <div className="relative z-10 pt-24 pb-8 border-b border-gray-200 bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-black mb-4 text-gray-900">
                            Explore{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                                Elite Opportunities
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl max-w-2xl text-gray-500">
                            {total > 0
                                ? `${total.toLocaleString()} positions curated for top engineering talent.`
                                : 'Search from thousands of verified roles tailored to your skills.'}
                        </p>
                    </motion.div>

                    {/* Search bar */}
                    <form onSubmit={handleSearch}
                        className="flex flex-col md:flex-row gap-4 p-3 rounded-3xl border bg-white border-gray-200 shadow-sm">
                        <div className="flex-1 flex items-center gap-3 px-4 rounded-2xl border bg-gray-100 border-gray-200 focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400 transition-all">
                            <Search size={20} className="text-indigo-400 flex-shrink-0" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Job title, skills, or company..."
                                className="flex-1 py-4 bg-transparent outline-none font-medium text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                        <div className="md:w-1/3 flex items-center gap-3 px-4 rounded-2xl border bg-gray-100 border-gray-200 focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400 transition-all">
                            <MapPin size={20} className="text-violet-400 flex-shrink-0" />
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="City or Remote"
                                className="flex-1 py-4 bg-transparent outline-none font-medium text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                        <button type="submit"
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-violet-700 hover:to-indigo-700 active:scale-95 transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                            Find Jobs
                        </button>
                    </form>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filter — desktop */}
                    <div className="hidden lg:block w-72 flex-shrink-0">
                        <FilterSidebar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
                    </div>

                    {/* Jobs list */}
                    <div className="flex-1 min-w-0">
                        {/* Controls bar */}
                        <div className="flex items-center justify-between mb-8 p-4 rounded-2xl border bg-white border-gray-200">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="lg:hidden flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all active:scale-95 border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100">
                                    <SlidersHorizontal size={16} /> Filters
                                </button>
                                <p className="text-sm font-medium text-gray-500">
                                    Showing{' '}
                                    <span className="font-bold text-gray-900">{Math.min(jobs.length, total)}</span>
                                    {' '}of{' '}
                                    <span className="font-bold text-gray-900">{total}</span>
                                    {' '}roles
                                </p>
                            </div>
                            <div className="flex items-center gap-1 border rounded-xl p-1 bg-gray-100 border-gray-200">
                                <button onClick={() => setView('grid')}
                                    className={`p-2 rounded-lg transition-all active:scale-90 ${view === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}>
                                    <LayoutGrid size={18} />
                                </button>
                                <button onClick={() => setView('list')}
                                    className={`p-2 rounded-lg transition-all active:scale-90 ${view === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}>
                                    <List size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Mobile filter overlay */}
                        {showFilters && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="lg:hidden mb-8 overflow-hidden">
                                <FilterSidebar filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
                            </motion.div>
                        )}

                        {/* Grid/List */}
                        {loading ? (
                            <div className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="rounded-2xl border p-6 animate-pulse bg-white border-gray-100">
                                        <div className="flex gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-xl bg-gray-100" />
                                            <div className="space-y-3 flex-1 pt-1">
                                                <div className="h-4 rounded w-3/4 bg-gray-200" />
                                                <div className="h-3 rounded w-1/2 bg-gray-100" />
                                            </div>
                                        </div>
                                        <div className="h-3 rounded w-full mb-3 bg-gray-100" />
                                        <div className="h-3 rounded w-2/3 bg-gray-100" />
                                    </div>
                                ))}
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border border-dashed bg-white border-gray-200">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gray-100">
                                    <Briefcase size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">No matching jobs</h3>
                                <p className="max-w-md text-gray-500">
                                    We couldn't find any opportunities matching your exact criteria. Try adjusting your filters or search terms.
                                </p>
                                <button
                                    onClick={() => { setQuery(''); setLocation(''); setFilters({ jobType: '', remote: false, salaryMin: '', hasTryout: false }); setPage(1); load(); }}
                                    className="mt-6 px-6 py-2.5 font-bold rounded-xl transition-all active:scale-95 border bg-gray-900 hover:bg-gray-800 text-white border-gray-900">
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                                    className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                    {jobs.map((j) => <JobCard key={j.id} job={j} view={view} />)}
                                </motion.div>
                                {/* Pagination */}
                                {total > PAGE_SIZE && (
                                    <div className="flex items-center justify-center gap-4 mt-12 py-4 rounded-2xl border bg-white border-gray-200">
                                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                            className="px-5 py-2.5 text-sm font-bold border rounded-xl transition-all active:scale-95 disabled:opacity-30 border-gray-200 hover:bg-gray-50 text-gray-700 disabled:hover:bg-transparent">
                                            Previous
                                        </button>
                                        <span className="text-sm font-medium text-gray-500">
                                            Page <span className="mx-1 font-bold text-gray-900">{page}</span> of {Math.ceil(total / PAGE_SIZE)}
                                        </span>
                                        <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
                                            className="px-5 py-2.5 text-sm font-bold border rounded-xl transition-all active:scale-95 disabled:opacity-30 border-gray-200 hover:bg-gray-50 text-gray-700 disabled:hover:bg-transparent">
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

    return isAuthenticated ? (
        <AppShell>
            {content}
        </AppShell>
    ) : content;
}

/**
 * Job Search Page — Filter sidebar + responsive job cards with grid/list toggle
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, MapPin, Briefcase, SlidersHorizontal,
    LayoutGrid, List, ArrowRight, Building2, Clock, DollarSign, X
} from 'lucide-react';
import { jobsApi, Job, JobSearchParams } from '../api/jobs';

// ── Filter Sidebar ────────────────────────────────────────────────────────────

interface Filters {
    jobType: string;
    remote: boolean;
    salaryMin: string;
}

function FilterSidebar({ filters, onChange, onClose }: {
    filters: Filters;
    onChange: (f: Filters) => void;
    onClose?: () => void;
}) {
    return (
        <aside className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Filters</h3>
                {onClose && (
                    <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Job Type */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Job Type</p>
                <div className="space-y-2">
                    {['', 'full-time', 'part-time', 'contract', 'internship'].map((type) => (
                        <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                                type="radio"
                                name="jobType"
                                checked={filters.jobType === type}
                                onChange={() => onChange({ ...filters, jobType: type })}
                                className="accent-blue-600"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors capitalize">
                                {type || 'Any'}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Remote */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Work Arrangement</p>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={filters.remote}
                        onChange={(e) => onChange({ ...filters, remote: e.target.checked })}
                        className="accent-blue-600 w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">Remote only</span>
                </label>
            </div>

            {/* Salary */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Minimum Salary</p>
                <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={filters.salaryMin}
                        onChange={(e) => onChange({ ...filters, salaryMin: e.target.value })}
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Reset */}
            <button
                onClick={() => onChange({ jobType: '', remote: false, salaryMin: '' })}
                className="w-full py-2 text-sm font-medium text-gray-500 hover:text-blue-600 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
            >
                Reset Filters
            </button>
        </aside>
    );
}

// ── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({ job, view }: { job: Job; view: 'grid' | 'list' }) {
    const isGrid = view === 'grid';
    return (
        <Link
            to={`/jobs/${job.id}`}
            className={`group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all p-6 flex ${isGrid ? 'flex-col' : 'flex-row items-start gap-4'}`}
        >
            {/* Company avatar */}
            <div className={`${isGrid ? 'mb-4' : ''} flex-shrink-0`}>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center">
                    <Building2 size={20} className="text-blue-600" />
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {job.title}
                    </h3>
                    {job.has_tryout && (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                            ✦ Tryout
                        </span>
                    )}
                </div>

                <p className="text-sm text-gray-500 mb-3 truncate">{(job as any).company_name ?? 'Company'}</p>

                <div className="flex flex-wrap gap-2 mb-3">
                    {job.location && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={11} /> {job.location}
                        </span>
                    )}
                    {job.job_type && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 capitalize">
                            <Clock size={11} /> {job.job_type}
                        </span>
                    )}
                    {job.remote_ok && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">Remote</span>
                    )}
                </div>

                {job.salary_min != null && (
                    <p className="text-sm font-semibold text-blue-700">
                        ${job.salary_min.toLocaleString()}
                        {job.salary_max ? `–$${job.salary_max.toLocaleString()}` : '+'}
                        <span className="text-gray-400 font-normal text-xs"> / yr</span>
                    </p>
                )}

                {/* Skills */}
                {(job as any).required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {(job as any).required_skills.slice(0, 4).map((s: string) => (
                            <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-lg">{s}</span>
                        ))}
                    </div>
                )}
            </div>

            <div className={`${isGrid ? 'mt-4 pt-4 border-t border-gray-100 flex justify-end' : 'ml-auto flex-shrink-0'}`}>
                <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:gap-2 transition-all">
                    View <ArrowRight size={13} />
                </span>
            </div>
        </Link>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function JobSearchPage() {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<Filters>({ jobType: '', remote: false, salaryMin: '' });
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
        <div className="min-h-screen bg-gray-50">
            {/* Search Hero */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-violet-900 pt-20 pb-12">
                <div className="max-w-5xl mx-auto px-6">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-3">
                        Find your next opportunity
                    </h1>
                    <p className="text-blue-200 text-center mb-8">
                        {total > 0 ? `${total.toLocaleString()} jobs available` : 'Search from thousands of verified openings'}
                    </p>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 bg-white rounded-2xl p-2 shadow-2xl shadow-blue-900/40">
                        <div className="flex-1 flex items-center gap-3 px-3">
                            <Search size={18} className="text-gray-400 flex-shrink-0" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Job title, skills, or company…"
                                className="flex-1 py-2.5 text-sm outline-none text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                        <div className="flex items-center gap-3 px-3 border-l border-gray-200 sm:min-w-[180px]">
                            <MapPin size={17} className="text-gray-400 flex-shrink-0" />
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="City or Remote"
                                className="flex-1 py-2.5 text-sm outline-none text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                        <button type="submit"
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-violet-700 transition-all text-sm whitespace-nowrap">
                            <Search size={15} /> Search Jobs
                        </button>
                    </form>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex gap-8">
                    {/* Filter — desktop */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <FilterSidebar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
                    </div>

                    {/* Jobs list */}
                    <div className="flex-1 min-w-0">
                        {/* Controls bar */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    <SlidersHorizontal size={15} /> Filters
                                </button>
                                <p className="text-sm text-gray-500">
                                    <span className="font-semibold text-gray-800">{total}</span> positions
                                </p>
                            </div>
                            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                                <button onClick={() => setView('grid')}
                                    className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <LayoutGrid size={15} />
                                </button>
                                <button onClick={() => setView('list')}
                                    className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <List size={15} />
                                </button>
                            </div>
                        </div>

                        {/* Mobile filter overlay */}
                        {showFilters && (
                            <div className="lg:hidden mb-6">
                                <FilterSidebar filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
                            </div>
                        )}

                        {/* Grid/List */}
                        {loading ? (
                            <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                                        <div className="flex gap-3 mb-4">
                                            <div className="w-11 h-11 bg-gray-100 rounded-xl" />
                                            <div className="space-y-2 flex-1">
                                                <div className="h-3 bg-gray-200 rounded w-3/4" />
                                                <div className="h-2 bg-gray-100 rounded w-1/2" />
                                            </div>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded w-full mb-2" />
                                        <div className="h-2 bg-gray-100 rounded w-2/3" />
                                    </div>
                                ))}
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Briefcase size={48} className="text-gray-200 mb-4" />
                                <p className="text-gray-500 font-medium">No jobs found</p>
                                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            <>
                                <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                    {jobs.map((j) => <JobCard key={j.id} job={j} view={view} />)}
                                </div>
                                {/* Pagination */}
                                {total > PAGE_SIZE && (
                                    <div className="flex items-center justify-center gap-3 mt-8">
                                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
                                            Previous
                                        </button>
                                        <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
                                        <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
                                            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
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

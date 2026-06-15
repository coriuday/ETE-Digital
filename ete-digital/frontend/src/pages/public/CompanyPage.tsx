/**
 * CompanyPage — Task 1.5
 * Public company profile page at /companies/:slug
 *
 * Shows: logo, tagline, description, culture tags, tech stack, benefits,
 *         and a paginated grid of the company's active job listings.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Globe, MapPin, Users, Calendar, CheckCircle2,
    ArrowRight, Briefcase, Loader2, ExternalLink,
    Linkedin, Twitter, Github, Building2,
} from 'lucide-react';
import api from '../../api/client';

// ── Types ──────────────────────────────────────────────────────────────────────
interface CompanyData {
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    description: string | null;
    industry: string | null;
    company_size: string | null;
    founded_year: number | null;
    logo_url: string | null;
    cover_image_url: string | null;
    brand_color: string | null;
    website: string | null;
    city: string | null;
    country: string | null;
    social_links: Record<string, string>;
    benefits: string[];
    tech_stack: string[];
    culture_tags: string[];
    is_verified: boolean;
}

interface CompanyJob {
    id: string;
    title: string;
    location: string | null;
    remote_ok: boolean;
    job_type: string;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string;
    skills_required: string[];
    has_tryout: boolean;
    created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const JOB_TYPE_LABEL: Record<string, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    internship: 'Internship',
};

function formatSalary(min: number | null, max: number | null, currency = 'INR') {
    if (!min && !max) return null;
    const fmt = (n: number) =>
        n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}K`;
    if (min && max) return `${currency} ${fmt(min)}–${fmt(max)}`;
    if (min) return `${currency} ${fmt(min)}+`;
    return `Up to ${currency} ${fmt(max!)}`;
}

function SocialIcon({ name }: { name: string }) {
    if (name === 'linkedin') return <Linkedin size={16} />;
    if (name === 'twitter' || name === 'x') return <Twitter size={16} />;
    if (name === 'github') return <Github size={16} />;
    return <Globe size={16} />;
}

// ── Job Card ───────────────────────────────────────────────────────────────────
function JobCard({ job, companyName }: { job: CompanyJob; companyName: string }) {
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
    return (
        <Link
            to={`/jobs/${job.id}`}
            className="group block bg-white border border-gray-100 rounded-2xl p-5 hover:border-violet-200 hover:shadow-md transition-all duration-200"
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-violet-600 transition-colors">{job.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {companyName}
                        {job.location && <> · {job.location}</>}
                        {job.remote_ok && <> · <span className="text-emerald-600 font-medium">Remote OK</span></>}
                    </p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-violet-500 flex-shrink-0 mt-1 transition-colors" />
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                    {JOB_TYPE_LABEL[job.job_type] ?? job.job_type}
                </span>
                {job.has_tryout && (
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100 rounded-full">
                        Paid Tryout
                    </span>
                )}
                {salary && (
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full">
                        {salary}
                    </span>
                )}
            </div>

            {job.skills_required.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {job.skills_required.slice(0, 4).map(s => (
                        <span key={s} className="text-[11px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md">
                            {s}
                        </span>
                    ))}
                    {job.skills_required.length > 4 && (
                        <span className="text-[11px] px-2 py-0.5 text-gray-400">+{job.skills_required.length - 4} more</span>
                    )}
                </div>
            )}
        </Link>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CompanyPage() {
    const { slug } = useParams<{ slug: string }>();

    const [company, setCompany] = useState<CompanyData | null>(null);
    const [jobs, setJobs] = useState<CompanyJob[]>([]);
    const [totalJobs, setTotalJobs] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        if (!slug) return;
        (async () => {
            setLoading(true);
            try {
                const res = await api.get(`/api/companies/${slug}`, { params: { page: 1, page_size: 10 } });
                setCompany(res.data.company);
                setJobs(res.data.jobs);
                setTotalJobs(res.data.total_jobs);
                setTotalPages(res.data.total_pages);
                setPage(1);
            } catch (err: any) {
                setError(err?.response?.status === 404 ? 'Company not found.' : 'Failed to load company.');
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    // Pagination
    const loadPage = async (p: number) => {
        if (!slug) return;
        setJobsLoading(true);
        try {
            const res = await api.get(`/api/companies/${slug}`, { params: { page: p, page_size: 10 } });
            setJobs(res.data.jobs);
            setPage(p);
        } finally {
            setJobsLoading(false);
        }
    };

    // ── Loading / Error ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 size={28} className="animate-spin text-violet-600" />
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
                <Building2 size={40} className="text-gray-300" />
                <p className="text-gray-500 font-medium">{error ?? 'Company not found.'}</p>
                <Link to="/jobs" className="text-violet-600 underline text-sm">Browse all jobs</Link>
            </div>
        );
    }

    const brandColor = company.brand_color || '#7c3aed';
    const location = [company.city, company.country].filter(Boolean).join(', ');

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif]">
            {/* ── Hero Banner ───────────────────────────────────────────────── */}
            <div
                className="relative h-52 md:h-64 overflow-hidden"
                style={{
                    background: company.cover_image_url
                        ? `url(${company.cover_image_url}) center/cover no-repeat`
                        : `linear-gradient(135deg, ${brandColor}cc, ${brandColor}66)`,
                }}
            >
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
                {/* Nav */}
                <div className="absolute top-4 left-4">
                    <Link to="/jobs" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-medium bg-black/20 rounded-full px-3 py-1.5 transition-colors">
                        ← All Jobs
                    </Link>
                </div>
            </div>

            {/* ── Profile Header ─────────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 mb-6 relative z-10">
                    {/* Logo */}
                    <div
                        className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{ background: company.logo_url ? 'white' : brandColor }}
                    >
                        {company.logo_url ? (
                            <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain p-1" />
                        ) : (
                            <span className="text-3xl font-extrabold text-white">{company.name[0]}</span>
                        )}
                    </div>

                    <div className="pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{company.name}</h1>
                            {company.is_verified && (
                                <span title="Verified company">
                                    <CheckCircle2 size={20} className="text-violet-600" />
                                </span>
                            )}
                        </div>
                        {company.tagline && <p className="text-gray-500 text-sm mt-0.5">{company.tagline}</p>}

                        {/* Meta row */}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                            {company.industry && <span className="flex items-center gap-1"><Briefcase size={12} /> {company.industry}</span>}
                            {location && <span className="flex items-center gap-1"><MapPin size={12} /> {location}</span>}
                            {company.company_size && <span className="flex items-center gap-1"><Users size={12} /> {company.company_size} employees</span>}
                            {company.founded_year && <span className="flex items-center gap-1"><Calendar size={12} /> Founded {company.founded_year}</span>}
                            {company.website && (
                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-violet-600 hover:underline">
                                    <Globe size={12} /> Website <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Social links */}
                    {Object.keys(company.social_links).length > 0 && (
                        <div className="sm:ml-auto flex gap-2 pb-1">
                            {Object.entries(company.social_links).map(([key, url]) => (
                                <a
                                    key={key}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-violet-600 hover:border-violet-200 transition-colors"
                                    title={key}
                                >
                                    <SocialIcon name={key} />
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Body ──────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
                    {/* Left: About + Culture ───────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* About */}
                        {company.description && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h2 className="font-bold text-gray-900 text-lg mb-3">About {company.name}</h2>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{company.description}</p>
                            </div>
                        )}

                        {/* Jobs */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-gray-900 text-lg">
                                    Open Positions
                                    {totalJobs > 0 && <span className="ml-2 text-sm font-semibold text-gray-400">({totalJobs})</span>}
                                </h2>
                            </div>

                            {jobsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 size={24} className="animate-spin text-violet-500" />
                                </div>
                            ) : jobs.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                                    <Briefcase size={32} className="text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No open positions right now.</p>
                                    <Link to="/jobs" className="text-violet-600 text-sm underline mt-2 block">Browse all jobs</Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {jobs.map(job => (
                                        <JobCard key={job.id} job={job} companyName={company.name} />
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-6">
                                    <button
                                        onClick={() => loadPage(page - 1)}
                                        disabled={page === 1 || jobsLoading}
                                        className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:border-violet-300 transition-colors"
                                    >
                                        ← Prev
                                    </button>
                                    <span className="text-sm text-gray-500 font-medium">
                                        {page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => loadPage(page + 1)}
                                        disabled={page === totalPages || jobsLoading}
                                        className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:border-violet-300 transition-colors"
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: sidebar ──────────────────────────────────────── */}
                    <div className="space-y-5">
                        {/* Culture tags */}
                        {company.culture_tags.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                <h3 className="font-bold text-gray-900 mb-3 text-sm">Culture</h3>
                                <div className="flex flex-wrap gap-2">
                                    {company.culture_tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 text-xs font-semibold bg-violet-50 text-violet-700 rounded-full border border-violet-100">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tech Stack */}
                        {company.tech_stack.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                <h3 className="font-bold text-gray-900 mb-3 text-sm">Tech Stack</h3>
                                <div className="flex flex-wrap gap-2">
                                    {company.tech_stack.map(tech => (
                                        <span key={tech} className="px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Benefits */}
                        {company.benefits.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                <h3 className="font-bold text-gray-900 mb-3 text-sm">Benefits</h3>
                                <ul className="space-y-2">
                                    {company.benefits.map(b => (
                                        <li key={b} className="flex items-center gap-2 text-sm text-gray-600">
                                            <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Employer Jobs Page - List and manage all jobs
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi, Job } from '../../api/jobs';
import toast from 'react-hot-toast';
import { Users, Eye, CalendarDays, Plus, Briefcase } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';

const STATUS_CFG: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-emerald-100 text-emerald-700', label: 'Active' },
    draft: { color: 'bg-amber-100 text-amber-700', label: 'Draft' },
    closed: { color: 'bg-gray-100 text-gray-600', label: 'Closed' },
};

export default function EmployerJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => { loadJobs(); }, []);

    const loadJobs = async () => {
        try {
            const response = await jobsApi.getEmployerJobs();
            setJobs(response.jobs || []);
        } catch {
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job => filterStatus === 'all' || job.status === filterStatus);

    const handleDeleteJob = async (jobId: string) => {
        if (!confirm('Are you sure you want to close this job?')) return;
        try {
            await jobsApi.deleteJob(jobId);
            // Backend soft-deletes (status → CLOSED). Mirror that in local state
            // instead of removing the row so the badge updates to "Closed" rather
            // than the job disappearing and reappearing on the next refresh.
            setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'closed' } : j));
            toast.success('Job closed successfully');
        } catch {
            toast.error('Failed to close job. Please try again.');
        }
    };

    const counts: Record<string, number> = { all: jobs.length };
    jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });

    if (loading) {
        return (
            <AppShell>
                <div className="p-8 space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="p-6 lg:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage your job postings</p>
                    </div>
                    <Link
                        to="/employer/jobs/create"
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
                    >
                        <Plus size={16} /> Post New Job
                    </Link>
                </div>

                {/* Filter tabs */}
                <div className="flex flex-wrap gap-2">
                    {['all', 'active', 'draft', 'closed'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${filterStatus === s
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                }`}
                        >
                            {s === 'all' ? 'All' : STATUS_CFG[s].label} ({counts[s] ?? 0})
                        </button>
                    ))}
                </div>

                {/* Jobs list */}
                {filteredJobs.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
                        <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Briefcase size={28} className="text-violet-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            {filterStatus === 'all' ? 'Start by posting your first job' : `No ${filterStatus} jobs`}
                        </p>
                        <Link
                            to="/employer/jobs/create"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
                        >
                            <Plus size={15} /> Post a Job
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredJobs.map(job => {
                            const cfg = STATUS_CFG[job.status] ?? STATUS_CFG.closed;
                            const appCount = job.applications_count ?? 0;
                            return (
                                <div key={job.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <h3 className="text-base font-semibold text-gray-900 truncate">{job.title}</h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                                {job.has_tryout && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                                        ⚡ Tryout
                                                    </span>
                                                )}
                                                {/* Applicant count badge — prominent and colorful */}
                                                <span className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold ${appCount > 0
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    <Users size={11} />
                                                    {appCount} {appCount === 1 ? 'Applicant' : 'Applicants'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                <span>📍 {job.location || 'Remote'}</span>
                                                <span>• {job.job_type?.replace('_', ' ')}</span>
                                                {job.salary_min && job.salary_max && (
                                                    <span>• {job.salary_currency} {job.salary_min.toLocaleString()} – {job.salary_max.toLocaleString()}</span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Eye size={11} /> {job.views_count ?? 0} views
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays size={11} /> {new Date(job.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Link
                                                to={`/employer/applications?job=${job.id}`}
                                                className="px-3.5 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors"
                                            >
                                                View Applications
                                            </Link>
                                            {job.has_tryout && (
                                                <Link
                                                    to={`/employer/tryouts/grade?jobId=${job.id}`}
                                                    className="px-3.5 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-semibold hover:bg-purple-100 transition-colors"
                                                >
                                                    Grade Tryouts
                                                </Link>
                                            )}
                                            <Link
                                                to={`/employer/jobs/${job.id}/edit`}
                                                className="px-3.5 py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteJob(job.id)}
                                                className="px-3.5 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppShell>
    );
}

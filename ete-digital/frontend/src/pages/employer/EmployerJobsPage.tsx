/**
 * Employer Jobs Page - List and manage all jobs
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi, Job } from '../../api/jobs';

export default function EmployerJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => { loadJobs(); }, []);

    const loadJobs = async () => {
        try {
            const response = await jobsApi.getEmployerJobs();
            setJobs(response.jobs || []);
        } catch (error) {
            console.error('Failed to load jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job => filterStatus === 'all' || job.status === filterStatus);

    const handleDeleteJob = async (jobId: string) => {
        if (!confirm('Are you sure you want to delete this job?')) return;
        try {
            await jobsApi.deleteJob(jobId);
            setJobs(jobs.filter(j => j.id !== jobId));
        } catch (error) {
            console.error('Failed to delete job:', error);
            alert('Failed to delete job');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading jobs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
                            <p className="text-gray-600 mt-1">Manage your job postings</p>
                        </div>
                        <Link to="/employer/jobs/create" className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium">
                            + Post New Job
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Filter:</span>
                        <div className="flex gap-2">
                            {['all', 'active', 'draft', 'closed'].map(status => (
                                <button key={status} onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className="ml-auto text-sm text-gray-600">{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}</div>
                    </div>
                </div>

                {filteredJobs.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
                        <p className="text-gray-600 mb-6">{filterStatus === 'all' ? 'Start by posting your first job' : `No ${filterStatus} jobs`}</p>
                        <Link to="/employer/jobs/create" className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium">Post a Job</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredJobs.map(job => (
                            <div key={job.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${job.status === 'active' ? 'bg-green-100 text-green-700' : job.status === 'closed' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {job.status}
                                            </span>
                                            {job.has_tryout && <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Has Tryout</span>}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                            <span>📍 {job.location || 'Remote'}</span>
                                            <span>• {job.job_type.replace('_', ' ')}</span>
                                            {job.salary_min && job.salary_max && <span>• {job.salary_currency} {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}</span>}
                                        </div>
                                        <div className="flex items-center gap-6 text-sm text-gray-600">
                                            <span>👁️ {job.views_count} views</span>
                                            <span>📝 {job.applications_count} applications</span>
                                            <span>📅 Posted {new Date(job.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link to={`/employer/jobs/${job.id}/applications`} className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition text-sm font-medium">View Applications</Link>
                                        <Link to={`/employer/jobs/${job.id}/edit`} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition text-sm font-medium">Edit</Link>
                                        <button onClick={() => handleDeleteJob(job.id)} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

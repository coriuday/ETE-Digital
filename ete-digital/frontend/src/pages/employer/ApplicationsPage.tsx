/**
 * Applications Page - Employer view all applications
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../../api/jobs';

interface Application {
    id: string;
    job_id: string;
    job_title: string;
    candidate_id: string;
    candidate_name: string;
    candidate_email: string;
    cover_letter: string | null;
    status: string;
    created_at: string;
}

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterJob, setFilterJob] = useState<string>('all');
    const [jobs, setJobs] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load jobs for filter
            const jobsData = await jobsApi.getEmployerJobs();
            setJobs(jobsData.jobs || []);

            // Load all applications (we'll aggregate from all jobs)
            const allApps: Application[] = [];
            for (const job of jobsData.jobs || []) {
                try {
                    const appsData = await jobsApi.getJobApplications(job.id);
                    if (appsData.applications) {
                        allApps.push(...appsData.applications.map((app: any) => ({
                            ...app,
                            job_title: job.title,
                        })));
                    }
                } catch (err) {
                    console.error(`Failed to load applications for job ${job.id}:`, err);
                }
            }
            setApplications(allApps);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredApplications = applications.filter(app => {
        if (filterStatus !== 'all' && app.status !== filterStatus) return false;
        if (filterJob !== 'all' && app.job_id !== filterJob) return false;
        return true;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'reviewed': return 'bg-blue-100 text-blue-700';
            case 'shortlisted': return 'bg-green-100 text-green-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            case 'hired': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading applications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
                            <p className="text-gray-600 mt-1">Review and manage candidate applications</p>
                        </div>
                        <Link
                            to="/employer/dashboard"
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Status
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="rejected">Rejected</option>
                                <option value="hired">Hired</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Job
                            </label>
                            <select
                                value={filterJob}
                                onChange={(e) => setFilterJob(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Jobs</option>
                                {jobs.map(job => (
                                    <option key={job.id} value={job.id}>{job.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                        Showing {filteredApplications.length} of {applications.length} applications
                    </div>
                </div>

                {/* Applications List */}
                {filteredApplications.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications found</h3>
                        <p className="text-gray-600">
                            {applications.length === 0
                                ? 'No applications received yet'
                                : 'No applications match your filters'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredApplications.map(app => (
                            <div key={app.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {app.candidate_name}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-2">{app.candidate_email}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span>💼 {app.job_title}</span>
                                            <span>• 📅 Applied {new Date(app.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {app.cover_letter && (
                                            <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                                                {app.cover_letter}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Link
                                            to={`/employer/applications/${app.id}`}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium text-center"
                                        >
                                            View Details
                                        </Link>
                                        {app.status === 'pending' && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await jobsApi.updateApplicationStatus(app.id, 'shortlisted');
                                                        await loadData();
                                                    } catch (error) {
                                                        console.error('Failed to update status:', error);
                                                    }
                                                }}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                            >
                                                Shortlist
                                            </button>
                                        )}
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

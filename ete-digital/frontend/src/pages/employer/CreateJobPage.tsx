/**
 * Create Job Page - Post new job listing
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../../api/jobs';

export default function CreateJobPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        description: '',
        requirements: '',
        job_type: 'full_time',
        location: '',
        remote_ok: false,
        salary_min: '',
        salary_max: '',
        salary_currency: 'INR',
        skills_required: '',
        experience_required: '',
        has_tryout: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const jobData = {
                ...formData,
                salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
                salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
                skills_required: formData.skills_required.split(',').map(s => s.trim()).filter(Boolean),
            };

            await jobsApi.createJob(jobData);
            alert('Job posted successfully!');
            navigate('/employer/jobs');
        } catch (error) {
            console.error('Failed to create job:', error);
            alert('Failed to post job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Post a New Job</h1>
                    <p className="text-gray-600 mt-1">Fill in the details below to create a job posting</p>
                </div>
            </div>

            {/* Form */}
            <div className="container mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow p-8 space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleChange} required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="e.g. Senior Frontend Developer" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                                    <input type="text" name="company" value={formData.company} onChange={handleChange} required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="e.g. TechCorp Inc." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Type *</label>
                                    <select name="job_type" value={formData.job_type} onChange={handleChange} required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                                        <option value="full_time">Full Time</option>
                                        <option value="part_time">Part Time</option>
                                        <option value="contract">Contract</option>
                                        <option value="internship">Internship</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="e.g. San Francisco, CA" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" name="remote_ok" checked={formData.remote_ok} onChange={handleChange}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                                    <span className="text-sm text-gray-700">Remote work allowed</span>
                                </label>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} required rows={6}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Describe the role, responsibilities, and what you're looking for..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Requirements *</label>
                                    <textarea name="requirements" value={formData.requirements} onChange={handleChange} required rows={6}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="List required skills, experience, education..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                                    <input type="text" name="skills_required" value={formData.skills_required} onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="e.g. React, TypeScript, Node.js (comma-separated)" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience Required</label>
                                    <input type="text" name="experience_required" value={formData.experience_required} onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="e.g. 3+ years" />
                                </div>
                            </div>
                        </div>

                        {/* Compensation */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Compensation</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Salary</label>
                                    <input type="number" name="salary_min" value={formData.salary_min} onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="50000" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Salary</label>
                                    <input type="number" name="salary_max" value={formData.salary_max} onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="100000" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                    <select name="salary_currency" value={formData.salary_currency} onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="INR">INR</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Tryout */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Trial Task (Optional)</h2>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" name="has_tryout" checked={formData.has_tryout} onChange={handleChange}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                                <span className="text-sm text-gray-700">Include a trial task for candidates</span>
                            </label>
                            {formData.has_tryout && (
                                <p className="mt-2 text-sm text-gray-600">
                                    You'll be able to create the tryout details after posting the job.
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-6 border-t">
                            <button type="submit" disabled={loading}
                                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? 'Posting...' : 'Post Job'}
                            </button>
                            <button type="button" onClick={() => navigate('/employer/jobs')}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

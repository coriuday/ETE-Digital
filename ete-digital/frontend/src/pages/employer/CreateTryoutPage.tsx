/**
 * Create Tryout Page - Create trial task for a job
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jobsApi } from '../../api/jobs';

export default function CreateTryoutPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const jobId = searchParams.get('jobId');

    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        job_id: jobId || '',
        title: '',
        description: '',
        instructions: '',
        deliverables: '',
        time_limit_hours: 48,
        payment_amount: 50,
        auto_grade: false,
        rubric: [
            { criterion: 'Code Quality', points: 25 },
            { criterion: 'Functionality', points: 25 },
            { criterion: 'Design', points: 25 },
            { criterion: 'Documentation', points: 25 },
        ],
    });

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            const data = await jobsApi.getEmployerJobs();
            setJobs(data.jobs || []);
        } catch (error) {
            console.error('Failed to load jobs:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log('Creating tryout:', formData);
            alert('Tryout created successfully!');
            navigate('/employer/jobs');
        } catch (error) {
            console.error('Failed to create tryout:', error);
            alert('Failed to create tryout');
        } finally {
            setLoading(false);
        }
    };

    const updateRubric = (index: number, field: string, value: any) => {
        const newRubric = [...formData.rubric];
        newRubric[index] = { ...newRubric[index], [field]: value };
        setFormData({ ...formData, rubric: newRubric });
    };

    const addRubricItem = () => {
        setFormData({
            ...formData,
            rubric: [...formData.rubric, { criterion: '', points: 0 }],
        });
    };

    const removeRubricItem = (index: number) => {
        setFormData({
            ...formData,
            rubric: formData.rubric.filter((_, i) => i !== index),
        });
    };

    const totalPoints = formData.rubric.reduce((sum, item) => sum + item.points, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Create Tryout</h1>
                    <p className="text-gray-600 mt-1">Create a paid trial task for candidates</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
                    {/* Job Selection */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Job *</label>
                            <select value={formData.job_id} onChange={(e) => setFormData({ ...formData, job_id: e.target.value })} required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                                <option value="">Choose a job...</option>
                                {jobs.map(job => (
                                    <option key={job.id} value={job.id}>{job.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Task Details */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tryout Title *</label>
                                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required
                                    placeholder="e.g., Build a React Dashboard Component"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={4}
                                    placeholder="Describe the task..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Instructions *</label>
                                <textarea value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} required rows={6}
                                    placeholder="Detailed step-by-step instructions..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Deliverables *</label>
                                <textarea value={formData.deliverables} onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })} required rows={3}
                                    placeholder="What should candidates submit? (GitHub repo, deployed URL, etc.)"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>
                    </div>

                    {/* Time & Payment */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Time & Compensation</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (hours) *</label>
                                <input type="number" value={formData.time_limit_hours} onChange={(e) => setFormData({ ...formData, time_limit_hours: parseInt(e.target.value) })} required min="1"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount ($) *</label>
                                <input type="number" value={formData.payment_amount} onChange={(e) => setFormData({ ...formData, payment_amount: parseFloat(e.target.value) })} required min="0" step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>
                    </div>

                    {/* Scoring Rubric */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Scoring Rubric</h2>
                            <span className="text-sm text-gray-600">
                                Total: {totalPoints} points
                                {totalPoints !== 100 && <span className="text-orange-600 ml-2">(should equal 100)</span>}
                            </span>
                        </div>

                        {formData.rubric.map((item, index) => (
                            <div key={index} className="flex gap-4 mb-3">
                                <input type="text" value={item.criterion} onChange={(e) => updateRubric(index, 'criterion', e.target.value)}
                                    placeholder="Criterion name"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                                <input type="number" value={item.points} onChange={(e) => updateRubric(index, 'points', parseInt(e.target.value) || 0)}
                                    placeholder="Points" min="0"
                                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                                {formData.rubric.length > 1 && (
                                    <button type="button" onClick={() => removeRubricItem(index)}
                                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition">✕</button>
                                )}
                            </div>
                        ))}

                        <button type="button" onClick={addRubricItem}
                            className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
                            + Add Criterion
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => navigate(-1)}
                            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading || totalPoints !== 100}
                            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Creating...' : 'Create Tryout'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

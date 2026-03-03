/**
 * Grade Tryouts Page - Review and grade tryout submissions
 */
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

interface Submission {
    id: string;
    tryout_id: string;
    tryout_title: string;
    candidate_id: string;
    candidate_name: string;
    github_url?: string;
    demo_url?: string;
    notes?: string;
    status: string;
    submitted_at: string;
    score?: number;
}

export default function GradeTryoutsPage() {
    const [searchParams] = useSearchParams();
    const tryoutId = searchParams.get('tryoutId');

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        loadSubmissions();
    }, [tryoutId]);

    const loadSubmissions = async () => {
        try {
            setSubmissions([]);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load submissions:', error);
            setLoading(false);
        }
    };

    const filteredSubmissions = submissions.filter(sub => {
        if (filter === 'all') return true;
        return sub.status === filter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'graded': return 'bg-green-100 text-green-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading submissions...</p>
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
                            <h1 className="text-3xl font-bold text-gray-900">Grade Tryouts</h1>
                            <p className="text-gray-600 mt-1">Review and score candidate submissions</p>
                        </div>
                        <Link to="/employer/dashboard" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                {/* Filter */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">Filter:</label>
                        {['all', 'pending', 'graded'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg transition capitalize ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                {f} ({f === 'all' ? submissions.length : submissions.filter(s => s.status === f).length})
                            </button>
                        ))}
                    </div>
                </div>

                {filteredSubmissions.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No submissions yet</h3>
                        <p className="text-gray-600">
                            {submissions.length === 0 ? 'No tryout submissions received yet' : 'No submissions match your filter'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredSubmissions.map(sub => (
                            <div key={sub.id} className="bg-white rounded-lg shadow p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">{sub.candidate_name}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>{sub.status}</span>
                                            {sub.score !== undefined && (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Score: {sub.score}/100</span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 mb-3">{sub.tryout_title}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                            <span>📅 Submitted {new Date(sub.submitted_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {sub.github_url && (
                                                <a href={sub.github_url} target="_blank" rel="noopener noreferrer"
                                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium">GitHub Repo →</a>
                                            )}
                                            {sub.demo_url && (
                                                <a href={sub.demo_url} target="_blank" rel="noopener noreferrer"
                                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium">Live Demo →</a>
                                            )}
                                        </div>
                                    </div>
                                    <Link to={`/employer/tryouts/grade/${sub.id}`}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">
                                        {sub.status === 'pending' ? 'Grade Now' : 'View Details'}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

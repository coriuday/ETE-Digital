/**
 * My Tryout Submissions Page (for candidates)
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tryoutsApi, Submission } from '../../api/tryouts';

export default function MyTryoutsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => { loadSubmissions(); }, [page]);

    const loadSubmissions = async () => {
        setLoading(true);
        try {
            const response = await tryoutsApi.getMySubmissions(page);
            setSubmissions(response.submissions);
            setTotal(response.total);
        } catch (error) {
            console.error('Failed to load submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            SUBMITTED: 'bg-blue-100 text-blue-700',
            GRADING: 'bg-yellow-100 text-yellow-700',
            PASSED: 'bg-green-100 text-green-700',
            FAILED: 'bg-red-100 text-red-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const getPaymentBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-gray-100 text-gray-700',
            ESCROWED: 'bg-yellow-100 text-yellow-700',
            RELEASED: 'bg-green-100 text-green-700',
            CANCELLED: 'bg-red-100 text-red-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">My Tryout Submissions</h1>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-600 mb-4">You haven't submitted any tryouts yet.</p>
                        <Link to="/jobs" className="text-primary-600 hover:text-primary-700 font-semibold">Browse jobs with tryouts</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {submissions.map((submission) => (
                            <div key={submission.id} className="bg-white rounded-lg shadow p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-1">Tryout Submission</h3>
                                        <p className="text-sm text-gray-600">Submitted {new Date(submission.submitted_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(submission.status)}`}>{submission.status}</span>
                                        <div className="mt-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadge(submission.payment_status)}`}>
                                                💰 {submission.payment_status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {(submission.auto_score !== undefined || submission.manual_score !== undefined) && (
                                    <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                                        {submission.auto_score !== undefined && (
                                            <div><p className="text-xs text-gray-600 mb-1">Auto Score</p><p className="text-2xl font-bold text-primary-600">{submission.auto_score}%</p></div>
                                        )}
                                        {submission.manual_score !== undefined && (
                                            <div><p className="text-xs text-gray-600 mb-1">Manual Score</p><p className="text-2xl font-bold text-secondary-600">{submission.manual_score}%</p></div>
                                        )}
                                        {submission.final_score !== undefined && (
                                            <div><p className="text-xs text-gray-600 mb-1">Final Score</p><p className={`text-2xl font-bold ${submission.status === 'PASSED' ? 'text-green-600' : 'text-red-600'}`}>{submission.final_score}%</p></div>
                                        )}
                                    </div>
                                )}
                                {submission.feedback && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm font-medium text-gray-900 mb-2">Reviewer Feedback</p>
                                        <p className="text-sm text-gray-700">{submission.feedback}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

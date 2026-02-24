/**
 * Grade Submission Page - Review and score individual submission
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function GradeSubmissionPage() {
    const { submissionId } = useParams<{ submissionId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [rubric] = useState([
        { criterion: 'Code Quality', maxPoints: 25, score: 0 },
        { criterion: 'Functionality', maxPoints: 25, score: 0 },
        { criterion: 'Design', maxPoints: 25, score: 0 },
        { criterion: 'Documentation', maxPoints: 25, score: 0 },
    ]);
    const [scores, setScores] = useState<number[]>([0, 0, 0, 0]);
    const [feedback, setFeedback] = useState('');
    const [decision, setDecision] = useState<'pass' | 'fail' | null>(null);

    const totalScore = scores.reduce((sum, score) => sum + score, 0);

    const handleSubmit = async () => {
        if (!decision) {
            alert('Please select pass or fail');
            return;
        }

        setLoading(true);
        try {
            // In real app: await tryoutsApi.gradeSubmission(submissionId, { scores, feedback, decision })
            console.log('Grading submission:', { submissionId, scores, totalScore, feedback, decision });
            alert('Submission graded successfully!');
            navigate('/employer/tryouts/grade');
        } catch (error) {
            console.error('Failed to grade submission:', error);
            alert('Failed to grade submission');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Grade Submission</h1>
                            <p className="text-gray-600 mt-1">Review and score this tryout submission</p>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Submission Info */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submission Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Candidate</label>
                                <p className="text-gray-900 font-medium">John Doe</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Tryout</label>
                                <p className="text-gray-900">Build React Dashboard</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">GitHub Repository</label>
                                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                                    View Code →
                                </a>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Live Demo</label>
                                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                                    View Demo →
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Candidate Notes */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Candidate's Notes</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">
                            [Candidate's submission notes would appear here]
                        </p>
                    </div>

                    {/* Scoring Rubric */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Scoring Rubric</h2>
                            <div className="text-2xl font-bold text-primary-600">
                                {totalScore} / 100
                            </div>
                        </div>

                        <div className="space-y-4">
                            {rubric.map((item, index) => (
                                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-medium text-gray-900">{item.criterion}</h3>
                                        <span className="text-sm text-gray-600">Max: {item.maxPoints} pts</span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max={item.maxPoints}
                                            value={scores[index]}
                                            onChange={(e) => {
                                                const newScores = [...scores];
                                                newScores[index] = parseInt(e.target.value);
                                                setScores(newScores);
                                            }}
                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max={item.maxPoints}
                                            value={scores[index]}
                                            onChange={(e) => {
                                                const newScores = [...scores];
                                                newScores[index] = Math.min(item.maxPoints, Math.max(0, parseInt(e.target.value) || 0));
                                                setScores(newScores);
                                            }}
                                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Feedback */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Feedback</h2>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={6}
                            placeholder="Provide detailed feedback to the candidate..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Decision */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Final Decision</h2>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDecision('pass')}
                                className={`flex-1 px-6 py-4 rounded-lg font-medium transition ${decision === 'pass'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                ✓ Pass & Approve Payment
                            </button>
                            <button
                                onClick={() => setDecision('fail')}
                                className={`flex-1 px-6 py-4 rounded-lg font-medium transition ${decision === 'fail'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                ✗ Fail & Reject Payment
                            </button>
                        </div>

                        {decision && (
                            <div className={`mt-4 p-4 rounded-lg ${decision === 'pass' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                }`}>
                                {decision === 'pass'
                                    ? '✓ This candidate will receive payment and advance in the hiring process'
                                    : '✗ This candidate will not receive payment and will be notified'}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !decision}
                            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Submitting...' : 'Submit Grade'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Tryouts API
 */
import api from './client';

export interface Tryout {
    id: string;
    job_id: string;
    employer_id: string;
    title: string;
    description: string;
    estimated_duration_hours: number;
    payment_amount: number;
    payment_currency: string;
    submission_format: 'URL' | 'FILE' | 'CODE' | 'TEXT';
    scoring_rubric: Record<string, number>;
    passing_score: number;
    auto_grade_weight: number;
    manual_grade_weight: number;
    max_submissions_per_candidate: number;
    is_active: boolean;
    created_at: string;
}

export interface Submission {
    id: string;
    tryout_id: string;
    candidate_id: string;
    submission_url?: string;
    submission_file_path?: string;
    submission_code?: string;
    submission_text?: string;
    notes?: string;
    auto_score?: number;
    manual_score?: number;
    final_score?: number;
    feedback?: string;
    status: 'SUBMITTED' | 'GRADING' | 'PASSED' | 'FAILED';
    payment_status: 'PENDING' | 'ESCROWED' | 'RELEASED' | 'CANCELLED';
    submitted_at: string;
    graded_at?: string;
}

export const tryoutsApi = {
    // Get tryout by job ID
    getTryoutByJob: async (jobId: string): Promise<Tryout> => {
        const response = await api.get(`/api/tryouts/job/${jobId}`);
        return response.data;
    },

    // Get tryout by ID
    getTryout: async (tryoutId: string): Promise<Tryout> => {
        const response = await api.get(`/api/tryouts/${tryoutId}`);
        return response.data;
    },

    // Submit solution
    submitSolution: async (tryoutId: string, data: {
        submission_url?: string;
        submission_file_path?: string;
        submission_code?: string;
        submission_text?: string;
        notes?: string;
    }): Promise<Submission> => {
        const response = await api.post(`/api/tryouts/${tryoutId}/submit`, data);
        return response.data;
    },

    // Get my submissions
    getMySubmissions: async (page: number = 1): Promise<any> => {
        const response = await api.get('/api/tryouts/submissions/my-submissions', {
            params: { page, page_size: 20 },
        });
        return response.data;
    },

    // Get submissions for a tryout (employer)
    getTryoutSubmissions: async (tryoutId: string, page: number = 1): Promise<any> => {
        const response = await api.get(`/api/tryouts/${tryoutId}/submissions`, {
            params: { page, page_size: 20 },
        });
        return response.data;
    },

    // Create tryout (employer)
    createTryout: async (data: any): Promise<Tryout> => {
        const response = await api.post('/api/tryouts', data);
        return response.data;
    },
};

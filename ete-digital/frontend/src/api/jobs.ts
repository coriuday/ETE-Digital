/**
 * Jobs API
 */
import api from './client';
import type { PipelineProgress, StatusHistoryEntry } from '../constants/applicationPipeline';

export interface ApplicationDetail {
    id: string;
    job_id: string;
    candidate_id: string;
    cover_letter: string | null;
    vault_share_token?: string | null;
    status: string;
    match_score: number | null;
    match_explanation: Record<string, unknown> | null;
    employer_notes: string | null;
    candidate_name?: string;
    candidate_email?: string;
    job_title?: string;
    candidate_headline?: string | null;
    candidate_location?: string | null;
    candidate_skills?: string[];
    candidate_resume_url?: string | null;
    status_history?: StatusHistoryEntry[];
    available_actions?: string[];
    is_locked?: boolean;
    pipeline_progress?: PipelineProgress;
    created_at: string;
    updated_at: string | null;
}

export interface CandidateProfile {
    candidate_id: string;
    application_id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    bio: string | null;
    headline: string | null;
    skills: string[];
    experience_years: string | null;
    resume_url: string | null;
    social_links: Record<string, string> | null;
    vault_share_token: string | null;
    has_shared_vault: boolean;
    job_title: string | null;
}

export interface Job {
    id: string;
    employer_id: string;
    title: string;
    company: string;
    description: string;
    requirements: string;
    job_type: 'full_time' | 'part_time' | 'contract' | 'internship';
    location: string | null;
    remote_ok: boolean;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string;
    skills_required: string[];
    experience_required: string | null;
    has_tryout: boolean;
    external_apply_url: string | null;
    status: string;
    views_count: number;
    applications_count: number;
    created_at: string;
    published_at: string | null;
    employer_verified?: boolean;
}

export interface JobSearchParams {
    query?: string;
    job_type?: string;
    remote_ok?: boolean;
    location?: string;
    skills?: string;
    salary_min?: number;
    has_tryout?: boolean;
    page?: number;
    page_size?: number;
    sort_by?: 'created_at' | 'salary' | 'title';
    sort_order?: 'asc' | 'desc';
}

export interface JobListResponse {
    jobs: Job[];
    total: number;
    page: number;
    page_size: number;
}

export interface Application {
    id: string;
    job_id: string;
    candidate_id: string;
    cover_letter: string | null;
    status: string;
    created_at: string;
}

export const jobsApi = {
    // Search jobs
    searchJobs: async (params: JobSearchParams): Promise<JobListResponse> => {
        const response = await api.get('/api/jobs/search', { params });
        return response.data;
    },

    // Get job by ID
    getJob: async (jobId: string): Promise<Job> => {
        const response = await api.get(`/api/jobs/${jobId}`);
        return response.data;
    },

    // Apply to job
    applyToJob: async (jobId: string, data: { cover_letter?: string }): Promise<Application> => {
        const response = await api.post(`/api/jobs/${jobId}/apply`, {
            job_id: jobId,
            ...data,
        });
        return response.data;
    },

    // Get my applications (candidate)
    getMyApplications: async (page: number = 1): Promise<any> => {
        const response = await api.get('/api/jobs/applications/my-applications', {
            params: { page, page_size: 20 },
        });
        return response.data;
    },

    // Create job (employer)
    createJob: async (data: any): Promise<Job> => {
        const response = await api.post('/api/jobs/', data);  // trailing slash avoids 307 redirect stripping body
        return response.data;
    },

    // Get my jobs (employer)
    getMyJobs: async (page: number = 1): Promise<JobListResponse> => {
        const response = await api.get('/api/jobs/my-jobs', {
            params: { page, page_size: 20 },
        });
        return response.data;
    },

    // Employer-specific functions
    getEmployerJobs: async (): Promise<JobListResponse> => {
        const response = await api.get('/api/jobs/my-jobs');
        return response.data;
    },

    updateJob: async (jobId: string, data: Partial<Job>): Promise<Job> => {
        const response = await api.put(`/api/jobs/${jobId}`, data);
        return response.data;
    },

    deleteJob: async (jobId: string): Promise<void> => {
        await api.delete(`/api/jobs/${jobId}`);
    },

    publishJob: async (jobId: string): Promise<Job> => {
        const response = await api.post(`/api/jobs/${jobId}/publish`);
        return response.data;
    },

    getJobApplications: async (jobId: string, page: number = 1): Promise<any> => {
        const response = await api.get(`/api/jobs/${jobId}/applications`, {
            params: { page, page_size: 20 },
        });
        return response.data;
    },

    updateApplicationStatus: async (applicationId: string, status: string, notes?: string): Promise<ApplicationDetail> => {
        const response = await api.put(`/api/jobs/applications/${applicationId}/status`, {
            status,
            employer_notes: notes,
        });
        return response.data;
    },

    getApplicationDetail: async (applicationId: string): Promise<ApplicationDetail> => {
        const response = await api.get(`/api/jobs/applications/${applicationId}`);
        return response.data;
    },

    getCandidateProfile: async (applicationId: string): Promise<CandidateProfile> => {
        const response = await api.get(`/api/jobs/applications/${applicationId}/candidate-profile`);
        return response.data;
    },
};

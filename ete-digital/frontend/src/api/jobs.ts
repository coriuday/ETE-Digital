/**
 * Jobs API
 */
import api from './client';

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
    status: string;
    views_count: number;
    applications_count: number;
    created_at: string;
    published_at: string | null;
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

    updateApplicationStatus: async (applicationId: string, status: string, notes?: string): Promise<Application> => {
        const response = await api.put(`/api/jobs/applications/${applicationId}/status`, {
            status,
            employer_notes: notes,  // backend schema uses employer_notes, not notes
        });
        return response.data;
    },

    // Get full application detail for employer (real candidate name, email, job title)
    getApplicationDetail: async (applicationId: string): Promise<any> => {
        const response = await api.get(`/api/jobs/applications/${applicationId}`);
        return response.data;
    },
};

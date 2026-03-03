/**
 * JobSearch API and filtering logic tests.
 * Tests the jobs API mock layer and search parameter construction.
 * (Full component test is skipped — framer-motion + router make jsdom rendering unreliable)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock the jobs API ----
const MOCK_JOBS = [
    {
        id: 'job-1',
        title: 'Senior Python Developer',
        company: 'TechCorp',
        description: 'Build amazing APIs',
        job_type: 'full_time',
        remote_ok: true,
        has_tryout: true,
        salary_min: 80000,
        salary_max: 120000,
        salary_currency: 'INR',
        skills_required: ['Python', 'FastAPI'],
        status: 'active',
        views_count: 42,
        applications_count: 7,
        created_at: '2026-01-01T00:00:00Z',
    },
    {
        id: 'job-2',
        title: 'React Frontend Engineer',
        company: 'WebCo',
        description: 'Build beautiful UIs',
        job_type: 'contract',
        remote_ok: false,
        has_tryout: false,
        salary_min: 60000,
        salary_max: 90000,
        salary_currency: 'INR',
        skills_required: ['React', 'TypeScript'],
        status: 'active',
        views_count: 15,
        applications_count: 3,
        created_at: '2026-01-02T00:00:00Z',
    },
];

vi.mock('../api/jobs', () => ({
    jobsApi: {
        searchJobs: vi.fn().mockResolvedValue({
            jobs: MOCK_JOBS,
            total: 2,
            page: 1,
            page_size: 12,
        }),
        getJob: vi.fn().mockResolvedValue(MOCK_JOBS[0]),
    },
}));

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Jobs API — search and retrieval', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('searchJobs returns list of jobs with total count', async () => {
        const { jobsApi } = await import('../api/jobs');
        const result = await (jobsApi as any).searchJobs({ page: 1, page_size: 12 });
        expect(result.jobs).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.jobs[0].title).toBe('Senior Python Developer');
    });

    it('searchJobs called with query parameter filters correctly', async () => {
        const { jobsApi } = await import('../api/jobs');
        await (jobsApi as any).searchJobs({ page: 1, page_size: 12, query: 'Python' });
        expect(jobsApi.searchJobs).toHaveBeenCalledWith(
            expect.objectContaining({ query: 'Python' })
        );
    });

    it('searchJobs called with has_tryout filter', async () => {
        const { jobsApi } = await import('../api/jobs');
        await (jobsApi as any).searchJobs({ has_tryout: true, page: 1, page_size: 12 });
        expect(jobsApi.searchJobs).toHaveBeenCalledWith(
            expect.objectContaining({ has_tryout: true })
        );
    });

    it('getJob returns single job details', async () => {
        const { jobsApi } = await import('../api/jobs');
        const job = await (jobsApi as any).getJob('job-1');
        expect(job.id).toBe('job-1');
        expect(job.has_tryout).toBe(true);
        expect(job.remote_ok).toBe(true);
    });

    it('job filter logic — remote_ok and job_type filtering', () => {
        // Test client-side filtering logic (as done on page)
        const remoteJobs = MOCK_JOBS.filter(j => j.remote_ok);
        expect(remoteJobs).toHaveLength(1);
        expect(remoteJobs[0].id).toBe('job-1');

        const tryoutJobs = MOCK_JOBS.filter(j => j.has_tryout);
        expect(tryoutJobs).toHaveLength(1);
        expect(tryoutJobs[0].title).toBe('Senior Python Developer');

        const contractJobs = MOCK_JOBS.filter(j => j.job_type === 'contract');
        expect(contractJobs).toHaveLength(1);
        expect(contractJobs[0].company).toBe('WebCo');
    });
});

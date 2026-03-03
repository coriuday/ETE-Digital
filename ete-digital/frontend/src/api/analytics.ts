/**
 * Analytics API client
 */
import api from './client';

export interface KPICard {
    label: string;
    value: number;
    change_pct: number;
    is_positive: boolean;
}

export interface TimeSeriesPoint {
    date: string;
    value: number;
}

export interface TopJobEntry {
    job_id: string;
    title: string;
    applications: number;
    views: number;
}

export interface FunnelStage {
    stage: string;
    count: number;
    pct: number;
}

export interface AnalyticsSummary {
    kpis: KPICard[];
    applications_over_time: TimeSeriesPoint[];
    top_jobs: TopJobEntry[];
    application_funnel: FunnelStage[];
    period_days: number;
}

export const analyticsApi = {
    /**
     * Get employer analytics summary
     * @param days  Period in days (7–365, default 30)
     */
    getAnalyticsSummary: async (days: number = 30): Promise<AnalyticsSummary> => {
        const response = await api.get('/api/analytics/summary', {
            params: { days },
        });
        return response.data;
    },

    // Legacy aliases kept for backwards compat
    getDashboard: async (days = 30) => {
        const response = await api.get('/api/analytics/summary', { params: { days } });
        return response.data;
    },

    getJobAnalytics: async (jobId: string) => {
        const response = await api.get(`/api/jobs/${jobId}`);
        return response.data;
    },
};

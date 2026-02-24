/**
 * Analytics API client
 */
import { api } from './client';

export const analyticsApi = {
    getDashboard: async (days = 30) => {
        const response = await api.get(`/api/analytics/dashboard?days=${days}`);
        return response.data;
    },

    getJobAnalytics: async (jobId: string) => {
        const response = await api.get(`/api/analytics/jobs/${jobId}`);
        return response.data;
    },
};

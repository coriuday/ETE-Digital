/**
 * Candidate preferences API — stored in UserProfile.preferences JSONB
 */
import api from './client';

export interface QualificationsData {
    education: { school: string; degree: string; year: string }[];
    certifications: { name: string; issuer: string; year: string }[];
}

export interface UserPreferences {
    profile_visible: boolean;
    remote_preferred: boolean;
    preferred_job_types: string[];
    preferred_locations: string[];
    salary_min: number | null;
    salary_max: number | null;
    hidden_companies: string[];
    hidden_job_types: string[];
    qualifications: QualificationsData;
    resume_builder: Record<string, unknown>;
}

export const preferencesApi = {
    get: async (): Promise<UserPreferences> => {
        const response = await api.get('/api/users/me/preferences');
        return response.data;
    },

    patch: async (data: Partial<UserPreferences>): Promise<UserPreferences> => {
        const response = await api.patch('/api/users/me/preferences', data);
        return response.data;
    },
};

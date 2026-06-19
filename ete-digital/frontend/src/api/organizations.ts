/**
 * Organisation / domain verification API
 */
import api from './client';

export interface Organization {
    id: string;
    company_name: string;
    domain: string;
    website: string;
    is_verified: boolean;
    trust_tier: 'unverified' | 'pending' | 'verified';
    registration_path: 'domain' | 'standard';
    verification_token: string | null;
    verification_method: 'dns_txt' | 'html_file' | 'meta_tag' | null;
    verified_at: string | null;
    dns_txt_record: string | null;
    html_file_name: string | null;
    meta_tag_snippet: string | null;
    linkedin_url?: string | null;
    company_size?: string | null;
    industry?: string | null;
}

export interface OrgMember {
    user_id: string;
    email: string;
    full_name: string | null;
    role: string;
    joined_at: string;
    invited_by: string | null;
}

export const organizationsApi = {
    getMine: async (): Promise<Organization> => {
        const res = await api.get('/api/organizations/me');
        return res.data;
    },

    initDomain: async (data: {
        company_name: string;
        domain: string;
        website: string;
        verification_method?: string;
    }): Promise<Organization> => {
        const res = await api.post('/api/organizations/init', data);
        return res.data;
    },

    initStandard: async (data: {
        company_name: string;
        website: string;
        linkedin_url?: string;
        company_size?: string;
        industry?: string;
        gst_number?: string;
    }): Promise<Organization> => {
        const res = await api.post('/api/organizations/init-standard', data);
        return res.data;
    },

    verify: async (): Promise<Organization> => {
        const res = await api.post('/api/organizations/verify');
        return res.data;
    },

    listMembers: async (): Promise<OrgMember[]> => {
        const res = await api.get('/api/organizations/members');
        return res.data;
    },

    invite: async (email: string, role: string) => {
        const res = await api.post('/api/organizations/invite', { email, role });
        return res.data;
    },

    updateMemberRole: async (userId: string, role: string) => {
        const res = await api.patch(`/api/organizations/members/${userId}/role`, { role });
        return res.data;
    },

    updateMine: async (data: {
        company_name?: string;
        website?: string;
        linkedin_url?: string;
        company_size?: string;
        industry?: string;
    }): Promise<Organization> => {
        const res = await api.patch('/api/organizations/me', data);
        return res.data;
    },

    removeMember: async (userId: string) => {
        await api.delete(`/api/organizations/members/${userId}`);
    },

    acceptInvite: async (token: string) => {
        const res = await api.post(`/api/organizations/accept-invite?token=${encodeURIComponent(token)}`);
        return res.data;
    },
};

export interface AdminOrganization {
    id: string;
    company_name: string;
    domain: string;
    website: string;
    owner_email: string | null;
    trust_tier: string;
    registration_path: string;
    is_verified: boolean;
    industry: string | null;
    company_size: string | null;
    created_at: string;
}

export const adminOrganizationsApi = {
    list: async (params?: { trust_tier?: string; page?: number; page_size?: number }) => {
        const res = await api.get('/api/admin/organizations', { params });
        return res.data as { organizations: AdminOrganization[]; total: number };
    },

    approve: async (orgId: string) => {
        const res = await api.post(`/api/admin/organizations/${orgId}/approve`);
        return res.data;
    },

    reject: async (orgId: string) => {
        const res = await api.post(`/api/admin/organizations/${orgId}/reject`);
        return res.data;
    },
};

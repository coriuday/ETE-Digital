/**
 * Vault API
 */
import api from './client';

export interface VaultItem {
    id: string;
    candidate_id: string;
    type: 'project' | 'verified_sample' | 'badge' | 'certificate' | 'other';
    title: string;
    description: string;
    file_url: string;  // Encrypted on backend
    metadata: Record<string, any>;
    is_verified: boolean;
    verified_from_tryout_id?: string;
    created_at: string;
    view_count: number;
    share_count: number;
}

export interface ShareToken {
    id: string;
    candidate_id: string;
    token: string;
    vault_item_ids: string[];
    shared_with_company?: string;
    shared_with_email?: string;
    expires_at?: string;
    max_views?: number;
    current_views: number;
    is_active: boolean;
    created_at: string;
}

export interface VaultStats {
    total_items: number;
    verified_items: number;
    total_shares: number;
    total_views: number;
}

export const vaultApi = {
    // Get all vault items
    getVaultItems: async (): Promise<VaultItem[]> => {
        const response = await api.get('/api/vault/items');
        // Backend returns paginated: { items: VaultItem[], total: number, page: number, page_size: number }
        const data = response.data;
        return Array.isArray(data) ? data : (data?.items ?? []);
    },

    // Get single vault item
    getVaultItem: async (itemId: string): Promise<VaultItem> => {
        const response = await api.get(`/api/vault/items/${itemId}`);
        return response.data;
    },

    // Create vault item
    createVaultItem: async (data: {
        type: string;
        title: string;
        description: string;
        file_url: string;
        metadata?: Record<string, any>;
    }): Promise<VaultItem> => {
        const response = await api.post('/api/vault/items', data);
        return response.data;
    },

    // Update vault item
    updateVaultItem: async (itemId: string, data: Partial<VaultItem>): Promise<VaultItem> => {
        const response = await api.put(`/api/vault/items/${itemId}`, data);
        return response.data;
    },

    // Delete vault item
    deleteVaultItem: async (itemId: string): Promise<void> => {
        await api.delete(`/api/vault/items/${itemId}`);
    },

    // Upload a file to MinIO and create a vault item
    uploadVaultFile: async (data: {
        file: File;
        title: string;
        description?: string;
        item_type?: string;
    }): Promise<VaultItem> => {
        const form = new FormData();
        form.append('file', data.file);
        form.append('title', data.title);
        form.append('description', data.description ?? '');
        form.append('item_type', data.item_type ?? 'project');
        const response = await api.post('/api/vault/items/upload', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Get vault statistics
    getVaultStats: async (): Promise<VaultStats> => {
        const response = await api.get('/api/vault/stats');
        return response.data;
    },

    // Create share token
    createShareToken: async (data: {
        vault_item_ids: string[];
        shared_with_company?: string;
        shared_with_email?: string;
        expires_hours?: number;
        max_views?: number;
    }): Promise<ShareToken> => {
        const response = await api.post('/api/vault/share', data);
        return response.data;
    },

    // Get all share tokens
    getShareTokens: async (): Promise<ShareToken[]> => {
        const response = await api.get('/api/vault/share/tokens');
        return response.data;
    },

    // Revoke share token
    revokeShareToken: async (tokenId: string): Promise<void> => {
        await api.delete(`/api/vault/share/${tokenId}`);
    },

    // View shared items (public, no auth)
    viewSharedItems: async (token: string): Promise<any> => {
        const response = await api.get(`/api/vault/shared/${token}`);
        return response.data;
    },
};

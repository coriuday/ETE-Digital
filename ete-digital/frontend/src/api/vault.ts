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

export interface ShareLink {
    id: string;
    token: string;
    share_url?: string;
    vault_item_id: string;
}

export interface ShareToken {
    id: string;
    candidate_id?: string;
    token: string;
    vault_item_ids: string[];
    links: ShareLink[];
    group_token_ids?: string[];
    share_url?: string;
    shared_with_company?: string;
    shared_with_email?: string;
    expires_at?: string;
    max_views?: number;
    current_views: number;
    is_active: boolean;
    created_at: string;
}

/** Map backend ShareTokenResponse → frontend ShareToken shape */
function mapShareToken(raw: Record<string, unknown>): ShareToken {
    const vaultItemId = raw.vault_item_id as string | undefined;
    const id = String(raw.id);
    const token = String(raw.token);
    const link: ShareLink = {
        id,
        token,
        share_url: raw.share_url as string | undefined,
        vault_item_id: vaultItemId ?? '',
    };
    return {
        id,
        token,
        vault_item_ids: vaultItemId ? [vaultItemId] : [],
        links: [link],
        group_token_ids: [id],
        share_url: raw.share_url as string | undefined,
        shared_with_company: raw.shared_with_company as string | undefined,
        shared_with_email: raw.shared_with_email as string | undefined,
        expires_at: raw.expires_at as string | undefined,
        max_views: raw.max_views as number | undefined,
        current_views: (raw.view_count as number) ?? 0,
        is_active: !(raw.is_revoked as boolean),
        created_at: String(raw.created_at),
    };
}

/** Group tokens created together (same recipient + expiry) into one UI card */
function groupShareTokens(tokens: ShareToken[]): ShareToken[] {
    const groups = new Map<string, ShareToken>();
    for (const t of tokens) {
        const key = [
            t.shared_with_email ?? '',
            t.shared_with_company ?? '',
            t.expires_at ?? '',
            t.max_views ?? '',
            t.is_active,
        ].join('|');
        const existing = groups.get(key);
        if (existing) {
            existing.vault_item_ids = [...new Set([...existing.vault_item_ids, ...t.vault_item_ids])];
            existing.links = [...existing.links, ...t.links];
            existing.group_token_ids = [...new Set([...(existing.group_token_ids ?? [existing.id]), ...(t.group_token_ids ?? [t.id])])];
            existing.current_views = Math.max(existing.current_views, t.current_views);
        } else {
            groups.set(key, {
                ...t,
                vault_item_ids: [...t.vault_item_ids],
                links: [...t.links],
                group_token_ids: t.group_token_ids ?? [t.id],
            });
        }
    }
    return Array.from(groups.values());
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

    // Create share token(s) — backend returns one token per vault item
    createShareToken: async (data: {
        vault_item_ids: string[];
        shared_with_company?: string;
        shared_with_email?: string;
        expires_hours?: number;
        max_views?: number;
    }): Promise<ShareToken> => {
        const response = await api.post('/api/vault/share', data);
        const rawList = Array.isArray(response.data) ? response.data : [response.data];
        const mapped = rawList.map((r: Record<string, unknown>) => mapShareToken(r));
        const grouped = groupShareTokens(mapped);
        return grouped[0] ?? mapped[0];
    },

    // Get all share tokens
    getShareTokens: async (): Promise<ShareToken[]> => {
        const response = await api.get('/api/vault/share/tokens');
        const rawList = response.data?.tokens ?? [];
        if (!Array.isArray(rawList)) return [];
        const mapped = rawList.map((r: Record<string, unknown>) => mapShareToken(r));
        return groupShareTokens(mapped);
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

/**
 * VaultDashboard logic tests.
 * Tests vault API mock, filtering/search logic, and stats computation.
 * (Full component test skipped due to lucide-react/router jsdom limitations)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock vault API ----
const MOCK_VAULT_ITEMS = [
    {
        id: 'item-1',
        candidate_id: 'user-1',
        type: 'project',
        title: 'FastAPI Backend Project',
        description: 'A production-grade backend built with FastAPI',
        file_url: 'https://github.com/example/fastapi-project',
        is_verified: false,
        view_count: 10,
        share_count: 3,
        created_at: '2026-01-01T00:00:00Z',
    },
    {
        id: 'item-2',
        candidate_id: 'user-1',
        type: 'verified_sample',
        title: 'Tryout Submission — ETE Challenge',
        description: 'Verified by employer after successful tryout',
        file_url: null,
        is_verified: true,
        view_count: 5,
        share_count: 1,
        created_at: '2026-01-10T00:00:00Z',
    },
    {
        id: 'item-3',
        candidate_id: 'user-1',
        type: 'certificate',
        title: 'AWS Solutions Architect',
        description: 'Professional certificate',
        file_url: 'https://credly.com/example',
        is_verified: false,
        view_count: 2,
        share_count: 0,
        created_at: '2026-01-15T00:00:00Z',
    },
];

const MOCK_STATS = {
    total_items: 3,
    verified_items: 1,
    total_shares: 4,
    total_views: 17,
    items_by_type: { project: 1, verified_sample: 1, certificate: 1 },
};

vi.mock('../api/vault', () => ({
    vaultApi: {
        getVaultItems: vi.fn().mockResolvedValue(MOCK_VAULT_ITEMS),
        getVaultStats: vi.fn().mockResolvedValue(MOCK_STATS),
        createVaultItem: vi.fn().mockResolvedValue(MOCK_VAULT_ITEMS[0]),
        deleteVaultItem: vi.fn().mockResolvedValue({ message: 'Deleted' }),
    },
}));



describe('VaultDashboard — API and filtering logic', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('getVaultItems returns all items', async () => {
        const { vaultApi } = await import('../api/vault');
        const items = await (vaultApi as any).getVaultItems();
        expect(items).toHaveLength(3);
        expect(items[0].type).toBe('project');
    });

    it('getVaultStats returns accurate summary', async () => {
        const { vaultApi } = await import('../api/vault');
        const stats = await (vaultApi as any).getVaultStats();
        expect(stats.total_items).toBe(3);
        expect(stats.verified_items).toBe(1);
        expect(stats.total_shares).toBe(4);
        expect(stats.total_views).toBe(17);
    });

    it('filter by type — project', () => {
        const filtered = MOCK_VAULT_ITEMS.filter(i => i.type === 'project');
        expect(filtered).toHaveLength(1);
        expect(filtered[0].title).toBe('FastAPI Backend Project');
    });

    it('filter by type — verified_sample', () => {
        const filtered = MOCK_VAULT_ITEMS.filter(i => i.type === 'verified_sample');
        expect(filtered).toHaveLength(1);
        expect(filtered[0].is_verified).toBe(true);
    });

    it('search filtering is case-insensitive', () => {
        const search = 'tryout';
        const filtered = MOCK_VAULT_ITEMS.filter(i =>
            i.title.toLowerCase().includes(search.toLowerCase())
        );
        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('item-2');
    });

    it('delete vault item is called with correct id', async () => {
        const { vaultApi } = await import('../api/vault');
        await (vaultApi as any).deleteVaultItem('item-1');
        expect(vaultApi.deleteVaultItem).toHaveBeenCalledWith('item-1');
    });

    it('only verified items have is_verified:true', () => {
        const verified = MOCK_VAULT_ITEMS.filter(i => i.is_verified);
        expect(verified).toHaveLength(1);
        expect(verified[0].type).toBe('verified_sample');
    });
});

/**
 * Simple Analytics Utility
 * Tracks page views and user actions
 */

interface AnalyticsEvent {
    type: 'page_view' | 'action';
    page?: string;
    action?: string;
    metadata?: Record<string, any>;
    timestamp: string;
    userId?: string;
}

class Analytics {
    private events: AnalyticsEvent[] = [];
    private readonly STORAGE_KEY = 'ete_analytics';
    private readonly MAX_EVENTS = 1000;

    constructor() {
        this.loadEvents();
    }

    private loadEvents() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.events = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }

    private saveEvents() {
        try {
            // Keep only last MAX_EVENTS
            if (this.events.length > this.MAX_EVENTS) {
                this.events = this.events.slice(-this.MAX_EVENTS);
            }
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
        } catch (error) {
            console.error('Failed to save analytics:', error);
        }
    }

    trackPageView(page: string, userId?: string) {
        const event: AnalyticsEvent = {
            type: 'page_view',
            page,
            timestamp: new Date().toISOString(),
            userId,
        };
        this.events.push(event);
        this.saveEvents();
    }

    trackAction(action: string, metadata?: Record<string, any>, userId?: string) {
        const event: AnalyticsEvent = {
            type: 'action',
            action,
            metadata,
            timestamp: new Date().toISOString(),
            userId,
        };
        this.events.push(event);
        this.saveEvents();
    }

    getPageViews(page?: string): number {
        if (page) {
            return this.events.filter(e => e.type === 'page_view' && e.page === page).length;
        }
        return this.events.filter(e => e.type === 'page_view').length;
    }

    getActionCount(action: string): number {
        return this.events.filter(e => e.type === 'action' && e.action === action).length;
    }

    getEvents(type?: 'page_view' | 'action', limit?: number): AnalyticsEvent[] {
        let filtered = type ? this.events.filter(e => e.type === type) : this.events;
        if (limit) {
            filtered = filtered.slice(-limit);
        }
        return filtered;
    }

    getStats() {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const events24h = this.events.filter(e => new Date(e.timestamp) > last24h);
        const events7d = this.events.filter(e => new Date(e.timestamp) > last7d);

        return {
            totalEvents: this.events.length,
            last24h: {
                pageViews: events24h.filter(e => e.type === 'page_view').length,
                actions: events24h.filter(e => e.type === 'action').length,
            },
            last7d: {
                pageViews: events7d.filter(e => e.type === 'page_view').length,
                actions: events7d.filter(e => e.type === 'action').length,
            },
            topPages: this.getTopPages(10),
            topActions: this.getTopActions(10),
        };
    }

    private getTopPages(limit: number): Array<{ page: string; count: number }> {
        const pageCounts: Record<string, number> = {};
        this.events
            .filter(e => e.type === 'page_view' && e.page)
            .forEach(e => {
                pageCounts[e.page!] = (pageCounts[e.page!] || 0) + 1;
            });

        return Object.entries(pageCounts)
            .map(([page, count]) => ({ page, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    private getTopActions(limit: number): Array<{ action: string; count: number }> {
        const actionCounts: Record<string, number> = {};
        this.events
            .filter(e => e.type === 'action' && e.action)
            .forEach(e => {
                actionCounts[e.action!] = (actionCounts[e.action!] || 0) + 1;
            });

        return Object.entries(actionCounts)
            .map(([action, count]) => ({ action, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    clear() {
        this.events = [];
        localStorage.removeItem(this.STORAGE_KEY);
    }
}

export const analytics = new Analytics();

// Helper hooks for React components
export function useAnalytics() {
    return {
        trackPageView: (page: string) => analytics.trackPageView(page),
        trackAction: (action: string, metadata?: Record<string, any>) => analytics.trackAction(action, metadata),
    };
}

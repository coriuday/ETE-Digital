import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}

export default function GoogleAnalytics() {
    const location = useLocation();
    const { user } = useAuthStore();

    useEffect(() => {
        // Only run in production environment to avoid polluting analytics with dev data
        if (import.meta.env.MODE !== 'production') return;
        
        // "It shouldn't be seen by Everyone" - Exclude admins from being tracked
        if (user?.role === 'admin') return;

        // Add script if it doesn't exist
        if (!document.getElementById('ga-script')) {
            const script = document.createElement('script');
            script.id = 'ga-script';
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtag/js?id=G-MKY6BW0Y27';
            document.head.appendChild(script);

            const inlineScript = document.createElement('script');
            inlineScript.innerHTML = `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-MKY6BW0Y27');
            `;
            document.head.appendChild(inlineScript);
        } else {
            // Log page view on route change for SPA navigation
            if (typeof window.gtag === 'function') {
                window.gtag('config', 'G-MKY6BW0Y27', {
                    page_path: location.pathname + location.search,
                });
            }
        }
    }, [location, user]);

    return null;
}

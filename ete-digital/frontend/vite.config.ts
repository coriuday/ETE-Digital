import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/api': {
                target: process.env.VITE_API_URL || 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: 'hidden', // generates maps for Sentry/error tracking but does NOT serve them publicly
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                // Strategic named chunks for optimal caching:
                // - react-core: rarely changes (cache long)
                // - ui-libs:    framer-motion + lucide (visual only, cache medium)
                // - data-libs:  tanstack-query + axios + zustand (app logic, cache medium)
                // - recharts:   large chart lib loaded only on analytics pages
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react-dom') || id.includes('react-router')) {
                            return 'chunk-react-core';
                        }
                        if (id.includes('framer-motion') || id.includes('lucide-react')) {
                            return 'chunk-ui-libs';
                        }
                        if (id.includes('@tanstack') || id.includes('axios') || id.includes('zustand')) {
                            return 'chunk-data-libs';
                        }
                        if (id.includes('recharts') || id.includes('d3-')) {
                            return 'chunk-charts';
                        }
                        if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform')) {
                            return 'chunk-forms';
                        }
                    }
                }
            }
        }
    },
})

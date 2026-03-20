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
        sourcemap: true,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        const segments = id.toString().split('node_modules/')[1].split('/');
                        if (segments[0].startsWith('@')) {
                            return `${segments[0]}/${segments[1]}`;
                        }
                        return segments[0];
                    }
                }
            }
        }
    },
})

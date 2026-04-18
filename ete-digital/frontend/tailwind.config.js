/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Primary brand colors
                primary: {
                    50: 'hsl(var(--color-primary-50))',
                    100: 'hsl(var(--color-primary-100))',
                    200: 'hsl(var(--color-primary-200))',
                    300: 'hsl(var(--color-primary-300))',
                    400: 'hsl(var(--color-primary-400))',
                    500: 'hsl(var(--color-primary-500))',
                    600: 'hsl(var(--color-primary-600))',
                    700: 'hsl(var(--color-primary-700))',
                    800: 'hsl(var(--color-primary-800))',
                    900: 'hsl(var(--color-primary-900))',
                },
                // Semantic colors
                success: 'hsl(var(--color-success))',
                warning: 'hsl(var(--color-warning))',
                error: 'hsl(var(--color-error))',
                info: 'hsl(var(--color-info))',
                // Neutrals
                background: 'hsl(var(--color-background))',
                surface: 'hsl(var(--color-surface))',
                text: {
                    primary: 'hsl(var(--color-text-primary))',
                    secondary: 'hsl(var(--color-text-secondary))',
                    tertiary: 'hsl(var(--color-text-tertiary))',
                },
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-mono)', 'monospace'],
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
            },
            backdropBlur: {
                'glass': '10px',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                shimmer: {
                    '100%': { transform: 'translateX(100%)' },
                },
                pulseSubtle: {
                    '0%, 100%': { transform: 'scale(0.95)', opacity: '0.8' },
                    '50%': { transform: 'scale(1)', opacity: '1' },
                },
                progressRing: {
                    '0%': { strokeDasharray: '0, 1000', strokeDashoffset: '0' },
                    '50%': { strokeDasharray: '150, 1000', strokeDashoffset: '-50' },
                    '100%': { strokeDasharray: '150, 1000', strokeDashoffset: '-150' },
                },
                particleFloat: {
                    '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: '0.2' },
                    '50%': { transform: 'translateY(-20px) scale(1.5)', opacity: '0.6' },
                },
                particleFloatReverse: {
                    '0%, 100%': { transform: 'translateY(0) scale(1.2)', opacity: '0.3' },
                    '50%': { transform: 'translateY(15px) scale(0.8)', opacity: '0.8' },
                },
                loadingDots: {
                    '0%, 20%': { content: '""' },
                    '40%': { content: '"."' },
                    '60%': { content: '".."' },
                    '80%, 100%': { content: '"..."' },
                },
                textShimmer: {
                    '0%': { backgroundPosition: '200% center' },
                    '100%': { backgroundPosition: '-200% center' },
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'shimmer': 'shimmer 2s infinite linear',
                'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'progress-ring': 'progressRing 1.5s ease-in-out infinite, spin 2s linear infinite',
                'particle-1': 'particleFloat 4s ease-in-out infinite',
                'particle-2': 'particleFloatReverse 5s ease-in-out infinite',
                'particle-3': 'particleFloat 6s ease-in-out infinite',
                'text-shimmer': 'textShimmer 2.5s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}

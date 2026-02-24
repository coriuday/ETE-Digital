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
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
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
            },
        },
    },
    plugins: [],
}

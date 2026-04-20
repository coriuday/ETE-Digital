/**
 * Theme Context and Provider
 * Dark/light mode system with localStorage persistence
 * Applies both Tailwind dark class + data-theme attribute
 */
import React, { createContext, useContext, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = 'light';
    
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('dark');
        root.removeAttribute('data-theme');
        localStorage.setItem('jobsrow_theme', 'light');
    }, []);

    const toggleTheme = () => {};
    const setTheme = (_newTheme: Theme) => {};

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: false }}>
            {children}
        </ThemeContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}

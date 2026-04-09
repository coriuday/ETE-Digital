import { useEffect } from 'react'
import AppRouter from './AppRouter'
import './styles/index.css'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'

function App() {
    const { initializeAuth, isInitialized } = useAuthStore((s) => ({
        initializeAuth: s.initializeAuth,
        isInitialized: s.isInitialized
    }))

    // On first mount, attempt a silent token refresh if the user was previously
    // logged in (isAuthenticated persisted in localStorage but access token is
    // gone because it lives only in memory). Prevents the flash-then-logout UX.
    useEffect(() => {
        initializeAuth()
    }, [initializeAuth])

    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <ErrorBoundary>
            <ThemeProvider>
                <div className="App">
                    <AppRouter />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                borderRadius: '12px',
                                background: '#1f2937',
                                color: '#f9fafb',
                                fontSize: '14px',
                            },
                            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                        }}
                    />
                </div>
            </ThemeProvider>
        </ErrorBoundary>
    )
}

export default App

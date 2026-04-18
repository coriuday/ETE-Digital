import { useEffect, useState } from 'react'
import AppRouter from './AppRouter'
import './styles/index.css'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import { Preloader } from './components/ui/Preloader'
import { SkeletonPageLayout } from './components/ui/Skeleton'

function App() {
    const { initializeAuth, isInitialized } = useAuthStore((s) => ({
        initializeAuth: s.initializeAuth,
        isInitialized: s.isInitialized
    }))

    const [artificialDelayFinished, setArtificialDelayFinished] = useState(false)

    // On first mount, attempt a silent token refresh if the user was previously logged in
    useEffect(() => {
        initializeAuth()
    }, [initializeAuth])

    // Enforce a minimum loading time for the premium preloader experience
    useEffect(() => {
        const timer = setTimeout(() => {
            setArtificialDelayFinished(true)
        }, 1500)
        return () => clearTimeout(timer)
    }, [])

    const isLoading = !isInitialized || !artificialDelayFinished

    return (
        <ErrorBoundary>
            <ThemeProvider>
                <div className="App relative min-h-screen">
                    {/* The Preloader handles its own fade-out and unmount when isLoading becomes false */}
                    <Preloader isLoading={isLoading} />
                    
                    {isLoading ? (
                        <div className="absolute inset-0">
                            <SkeletonPageLayout />
                        </div>
                    ) : (
                        <div className="animate-fade-in">
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
                    )}
                </div>
            </ThemeProvider>
        </ErrorBoundary>
    )
}

export default App

import AppRouter from './AppRouter'
import './styles/index.css'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'

function App() {
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

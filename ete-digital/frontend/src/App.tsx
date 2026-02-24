import AppRouter from './AppRouter'
import './styles/index.css'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <div className="App">
                    <AppRouter />
                </div>
            </ThemeProvider>
        </ErrorBoundary>
    )
}

export default App

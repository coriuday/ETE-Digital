/**
 * 404 Not Found Page
 */
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-lg w-full text-center">
                <div className="relative mb-8">
                    <div className="text-[10rem] font-black text-gray-200 leading-none select-none">404</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white rounded-2xl shadow-large px-8 py-4">
                            <Search className="w-8 h-8 text-primary-400 mx-auto mb-1" />
                            <p className="text-sm font-medium text-gray-600">Page not found</p>
                        </div>
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">Oops! This page went missing</h1>
                <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                    The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-primary-400 hover:text-primary-600 transition-all">
                        <ArrowLeft className="w-4 h-4" /> Go Back
                    </button>
                    <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-700 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary-200">
                        <Home className="w-4 h-4" /> Go Home
                    </Link>
                </div>
                <div className="mt-12 flex items-center justify-center gap-6 text-xs text-gray-400">
                    <Link to="/jobs" className="hover:text-primary-600 transition-colors">Browse Jobs</Link>
                    <span>·</span>
                    <Link to="/contact" className="hover:text-primary-600 transition-colors">Contact Support</Link>
                    <span>·</span>
                    <Link to="/faq" className="hover:text-primary-600 transition-colors">FAQ</Link>
                </div>
            </div>
        </div>
    );
}

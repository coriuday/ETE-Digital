/**
 * Shared header for auth pages — logo + link back to public site (all breakpoints).
 */
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function AuthLayoutHeader({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
    const linkCls = variant === 'dark'
        ? 'inline-flex items-center gap-1.5 text-sm font-semibold text-violet-200 hover:text-white transition-colors'
        : 'inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors';

    return (
        <header className="w-full max-w-md mx-auto mb-8 flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center w-fit" aria-label="JobsRow home">
                <BrandLogo size="md" />
            </Link>
            <Link to="/" className={linkCls}>
                <ArrowLeft size={15} />
                Back to JobsRow
            </Link>
        </header>
    );
}

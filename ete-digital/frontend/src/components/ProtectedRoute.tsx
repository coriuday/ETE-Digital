/**
 * ProtectedRoute — Authentication + Role-based Access Control
 *
 * Access Model:
 *   admin    → full access to all routes (admin panel + everything)
 *   employer → HR role (DB value): access to /hr/* only, limited job-seeker facing features
 *   candidate → access to /dashboard, /jobs, /vault, /tryouts
 *
 * Unauthorized access redirects to the user's own role home instead of a generic 404.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useEffect } from 'react';

interface ProtectedRouteProps {
    /** If set, only users with this role (or admin) may access the route. */
    requiredRole?: 'candidate' | 'employer' | 'admin';
}

/** Maps each role to its home dashboard for redirect-on-deny. */
function roleHome(role?: string): string {
    if (role === 'employer') return '/hr/dashboard';
    if (role === 'admin')    return '/admin';
    return '/dashboard';
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, user, fetchUser, isLoading } = useAuthStore();

    useEffect(() => {
        if (!user && !isLoading) {
            fetchUser();
        }
    }, [user, fetchUser, isLoading]);

    // Show spinner while auth state is resolving
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto mb-3" />
                    <p className="text-sm text-text-secondary font-medium">Loading…</p>
                </div>
            </div>
        );
    }

    // Not logged in → send to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Role gate:
    //  • admin bypasses all role restrictions (full access)
    //  • Otherwise the user's role must match requiredRole
    if (requiredRole && user?.role !== requiredRole) {
        // Admins get through any role-gated route
        if (user?.role === 'admin') {
            return <Outlet />;
        }
        // Send the user to their own home dashboard with a clear redirect
        return <Navigate to={roleHome(user?.role)} replace />;
    }

    return <Outlet />;
}

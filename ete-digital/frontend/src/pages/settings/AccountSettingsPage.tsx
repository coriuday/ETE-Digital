/**
 * @deprecated Use /settings/profile — kept for backwards-compatible redirects
 */
import { Navigate } from 'react-router-dom';

export default function AccountSettingsPage() {
    return <Navigate to="/settings/profile" replace />;
}

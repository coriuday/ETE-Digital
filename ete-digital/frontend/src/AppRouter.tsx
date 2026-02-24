/**
 * App Router
 * Main routing configuration
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';

// ---- Existing Pages ----
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import JobSearchPage from './pages/JobSearchPage';
import JobDetailsPage from './pages/JobDetailsPage';
import TryoutDetailsPage from './pages/TryoutDetailsPage';
import MyTryoutsPage from './pages/MyTryoutsPage';
import VaultDashboardPage from './pages/VaultDashboardPage';
import VaultItemFormPage from './pages/VaultItemFormPage';
import ShareManagementPage from './pages/ShareManagementPage';
import SharedVaultPage from './pages/SharedVaultPage';
import EmployerJobsPage from './pages/EmployerJobsPage';
import CreateJobPage from './pages/CreateJobPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailsPage from './pages/ApplicationDetailsPage';
import CreateTryoutPage from './pages/CreateTryoutPage';
import GradeTryoutsPage from './pages/GradeTryoutsPage';
import GradeSubmissionPage from './pages/GradeSubmissionPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';

// ---- New / Redesigned Pages ----
import EmployerDashboardPage from './pages/EmployerDashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminJobsPage from './pages/admin/AdminJobsPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';
import MyApplicationsPage from './pages/MyApplicationsPage';

// ---- New Pages ----
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

// Auth flows
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerificationPage from './pages/EmailVerificationPage';

// Marketing
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';
import PricingPage from './pages/PricingPage';

// Legal
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import CookiePolicyPage from './pages/CookiePolicyPage';

// Settings
import AccountSettingsPage from './pages/settings/AccountSettingsPage';
import NotificationSettingsPage from './pages/settings/NotificationSettingsPage';

export default function AppRouter() {
    const { isAuthenticated } = useAuthStore();

    return (
        <BrowserRouter>
            <Routes>
                {/* Landing Page */}
                <Route
                    path="/"
                    element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />}
                />

                {/* Auth Routes (redirect to dashboard if already logged in) */}
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
                />
                <Route
                    path="/register"
                    element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />}
                />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<EmailVerificationPage />} />

                {/* Public Job Search */}
                <Route path="/jobs" element={<JobSearchPage />} />
                <Route path="/jobs/:jobId" element={<JobDetailsPage />} />

                {/* Public Shared Vault */}
                <Route path="/shared/:token" element={<SharedVaultPage />} />

                {/* Marketing Pages */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/pricing" element={<PricingPage />} />

                {/* Legal Pages */}
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* Settings */}
                    <Route path="/settings" element={<AccountSettingsPage />} />
                    <Route path="/settings/notifications" element={<NotificationSettingsPage />} />

                    {/* Candidate Routes */}
                    <Route path="/dashboard/applications" element={<MyApplicationsPage />} />
                    <Route path="/dashboard/tryouts" element={<MyTryoutsPage />} />
                    <Route path="/tryouts/job/:jobId" element={<TryoutDetailsPage />} />
                    <Route path="/tryouts/:tryoutId" element={<TryoutDetailsPage />} />
                    <Route path="/vault" element={<VaultDashboardPage />} />
                    <Route path="/vault/add" element={<VaultItemFormPage />} />
                    <Route path="/vault/edit/:itemId" element={<VaultItemFormPage />} />
                    <Route path="/vault/shares" element={<ShareManagementPage />} />

                    {/* Employer Routes */}
                    <Route path="/employer/jobs" element={<EmployerJobsPage />} />
                    <Route path="/employer/jobs/create" element={<CreateJobPage />} />
                    <Route path="/employer/applications" element={<ApplicationsPage />} />
                    <Route path="/employer/applications/:applicationId" element={<ApplicationDetailsPage />} />
                    <Route path="/employer/tryouts/create" element={<CreateTryoutPage />} />
                    <Route path="/employer/tryouts/grade" element={<GradeTryoutsPage />} />
                    <Route path="/employer/tryouts/grade/:submissionId" element={<GradeSubmissionPage />} />
                    <Route path="/employer/analytics" element={<AnalyticsDashboardPage />} />

                    {/* Employer Dashboard */}
                    <Route path="/employer/dashboard" element={<EmployerDashboardPage />} />
                </Route>

                {/* Admin-only Routes */}
                <Route element={<ProtectedRoute requiredRole="admin" />}>
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/jobs" element={<AdminJobsPage />} />
                    <Route path="/admin/applications" element={<AdminApplicationsPage />} />
                </Route>

                {/* 404 - Catch All */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

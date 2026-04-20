/**
 * App Router
 * Main routing configuration
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';

// ---- Auth Pages ----
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import EmailVerificationPage from './pages/auth/EmailVerificationPage';

// ---- Misc Pages ----
import DashboardPage from './pages/candidate/DashboardPage';
import LandingPage from './pages/public/LandingPage';
import NotFoundPage from './pages/public/NotFoundPage';

// ---- Jobs Pages ----
import JobSearchPage from './pages/jobs/JobSearchPage';
import JobDetailsPage from './pages/jobs/JobDetailsPage';

// ---- Candidate Pages ----
import TryoutDetailsPage from './pages/candidate/TryoutDetailsPage';
import MyTryoutsPage from './pages/candidate/MyTryoutsPage';
import VaultDashboardPage from './pages/candidate/VaultDashboardPage';
import VaultItemFormPage from './pages/candidate/VaultItemFormPage';
import ShareManagementPage from './pages/candidate/ShareManagementPage';
import MyApplicationsPage from './pages/candidate/MyApplicationsPage';

// ---- Public Pages ----
import SharedVaultPage from './pages/public/SharedVaultPage';
import CopyrightPage from './pages/public/CopyrightPage';
import HowItWorksPage from './pages/public/HowItWorksPage';

// ---- Employer Pages ----
import EmployerJobsPage from './pages/employer/EmployerJobsPage';
import EmployerDashboardPage from './pages/employer/EmployerDashboardPage';
import CreateJobPage from './pages/employer/CreateJobPage';
import ApplicationsPage from './pages/employer/ApplicationsPage';
import ApplicationDetailsPage from './pages/employer/ApplicationDetailsPage';
import CreateTryoutPage from './pages/employer/CreateTryoutPage';
import GradeTryoutsPage from './pages/employer/GradeTryoutsPage';
import GradeSubmissionPage from './pages/employer/GradeSubmissionPage';
import AnalyticsDashboardPage from './pages/employer/AnalyticsDashboardPage';

// ---- Admin Pages ----
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminJobsPage from './pages/admin/AdminJobsPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';

// ---- Marketing Pages ----
import AboutPage from './pages/marketing/AboutPage';
import ContactPage from './pages/marketing/ContactPage';
import FaqPage from './pages/marketing/FaqPage';
import PricingPage from './pages/marketing/PricingPage';
import HelpCenterPage from './pages/marketing/HelpCenterPage';
import HelpJobSeekersPage from './pages/marketing/HelpJobSeekersPage';
import HelpEmployersPage from './pages/marketing/HelpEmployersPage';

// ---- Legal Pages ----
import PrivacyPolicyPage from './pages/marketing/PrivacyPolicyPage';
import TermsPage from './pages/marketing/TermsPage';
import CookiePolicyPage from './pages/marketing/CookiePolicyPage';
import SafeJobSearchPage from './pages/marketing/SafeJobSearchPage';

// ---- Settings Pages ----
import AccountSettingsPage from './pages/settings/AccountSettingsPage';
import NotificationSettingsPage from './pages/settings/NotificationSettingsPage';

export default function AppRouter() {
    const { isAuthenticated, user } = useAuthStore();

    // Redirect authenticated users to their role-appropriate dashboard
    const roleHome =
        user?.role === 'employer' ? '/employer/dashboard'
        : user?.role === 'admin'  ? '/admin'
        : '/dashboard'; // candidate (default)

    return (
        <BrowserRouter>
            <Routes>
                {/* Landing Page */}
                <Route
                    path="/"
                    element={isAuthenticated ? <Navigate to={roleHome} /> : <LandingPage />}
                />

                {/* Auth Routes (redirect to role dashboard if already logged in) */}
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to={roleHome} /> : <LoginPage />}
                />
                <Route
                    path="/register"
                    element={isAuthenticated ? <Navigate to={roleHome} /> : <RegisterPage />}
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
                <Route path="/how-it-works" element={<HowItWorksPage />} />

                {/* Help Center Pages */}
                <Route path="/help" element={<HelpCenterPage />} />
                <Route path="/help/job-seekers" element={<HelpJobSeekersPage />} />
                <Route path="/help/employers" element={<HelpEmployersPage />} />

                {/* Legal Pages */}
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />
                <Route path="/copyright" element={<CopyrightPage />} />
                <Route path="/safe-job-search" element={<SafeJobSearchPage />} />

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

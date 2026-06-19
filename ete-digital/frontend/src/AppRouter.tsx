/**
 * App Router
 * Main routing configuration with React.lazy code splitting
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import GoogleAnalytics from './components/GoogleAnalytics';
import ScrollToTop from './components/layout/ScrollToTop';

// ---- Loading Fallback ----
const LoadingFallback = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading JobsRow...</p>
    </div>
);

// ---- Auth Pages ----
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const EmailVerificationPage = lazy(() => import('./pages/auth/EmailVerificationPage'));
const OAuthCallbackPage = lazy(() => import('./pages/auth/OAuthCallbackPage'));

// ---- Misc Pages ----
const DashboardPage = lazy(() => import('./pages/candidate/DashboardPage'));
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));

// ---- Jobs Pages ----
const JobSearchPage = lazy(() => import('./pages/jobs/JobSearchPage'));
const JobDetailsPage = lazy(() => import('./pages/jobs/JobDetailsPage'));

// ---- Candidate Pages ----
const TryoutDetailsPage = lazy(() => import('./pages/candidate/TryoutDetailsPage'));
const MyTryoutsPage = lazy(() => import('./pages/candidate/MyTryoutsPage'));
const TryoutPaymentPage = lazy(() => import('./pages/candidate/TryoutPaymentPage'));
const VaultDashboardPage = lazy(() => import('./pages/candidate/VaultDashboardPage'));
const VaultItemFormPage = lazy(() => import('./pages/candidate/VaultItemFormPage'));
const ShareManagementPage = lazy(() => import('./pages/candidate/ShareManagementPage'));
const MyApplicationsPage = lazy(() => import('./pages/candidate/MyApplicationsPage'));

// ---- Public Pages ----
const SharedVaultPage = lazy(() => import('./pages/public/SharedVaultPage'));
const CopyrightPage = lazy(() => import('./pages/public/CopyrightPage'));
const HowItWorksPage = lazy(() => import('./pages/public/HowItWorksPage'));

// ---- HR Pages (formerly Employer) ----
const HRJobsPage = lazy(() => import('./pages/hr/EmployerJobsPage'));
const HRDashboardPage = lazy(() => import('./pages/hr/EmployerDashboardPage'));
const CreateJobPage = lazy(() => import('./pages/hr/CreateJobPage'));
const ApplicationsPage = lazy(() => import('./pages/hr/ApplicationsPage'));
const ApplicationDetailsPage = lazy(() => import('./pages/hr/ApplicationDetailsPage'));
const CreateTryoutPage = lazy(() => import('./pages/hr/CreateTryoutPage'));
const GradeTryoutsPage = lazy(() => import('./pages/hr/GradeTryoutsPage'));
const GradeSubmissionPage = lazy(() => import('./pages/hr/GradeSubmissionPage'));
const AnalyticsDashboardPage = lazy(() => import('./pages/hr/AnalyticsDashboardPage'));
const DomainVerificationPage = lazy(() => import('./pages/hr/DomainVerificationPage'));
const EmployerOnboardingPage = lazy(() => import('./pages/hr/EmployerOnboardingPage'));
const TeamManagementPage = lazy(() => import('./pages/hr/TeamManagementPage'));
const AcceptInvitePage = lazy(() => import('./pages/hr/AcceptInvitePage'));
const BillingPage = lazy(() => import('./pages/hr/BillingPage'));
const BulkJobPostPage = lazy(() => import('./pages/hr/BulkJobPostPage'));
const AuditLogsPage = lazy(() => import('./pages/hr/AuditLogsPage'));

// ---- Admin Pages ----
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminJobsPage = lazy(() => import('./pages/admin/AdminJobsPage'));
const AdminApplicationsPage = lazy(() => import('./pages/admin/AdminApplicationsPage'));
const AdminOrganizationsPage = lazy(() => import('./pages/admin/AdminOrganizationsPage'));

// ---- Marketing Pages ----
const AboutPage = lazy(() => import('./pages/marketing/AboutPage'));
const ContactPage = lazy(() => import('./pages/marketing/ContactPage'));
const FaqPage = lazy(() => import('./pages/marketing/FaqPage'));
const PricingPage = lazy(() => import('./pages/marketing/PricingPage'));
const HelpCenterPage = lazy(() => import('./pages/marketing/HelpCenterPage'));
const HelpJobSeekersPage = lazy(() => import('./pages/marketing/HelpJobSeekersPage'));
const HelpEmployersPage = lazy(() => import('./pages/marketing/HelpEmployersPage'));

// ---- Legal Pages ----
const PrivacyPolicyPage = lazy(() => import('./pages/marketing/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/marketing/TermsPage'));
const CookiePolicyPage = lazy(() => import('./pages/marketing/CookiePolicyPage'));
const SafeJobSearchPage = lazy(() => import('./pages/marketing/SafeJobSearchPage'));

// ---- Settings Pages ----
const SettingsLayout = lazy(() => import('./components/layout/SettingsLayout'));
const ProfileSettingsPage = lazy(() => import('./pages/settings/ProfileSettingsPage'));
const QualificationsPage = lazy(() => import('./pages/settings/QualificationsPage'));
const JobPreferencesPage = lazy(() => import('./pages/settings/JobPreferencesPage'));
const JobFiltersPage = lazy(() => import('./pages/settings/JobFiltersPage'));
const ResumeSettingsPage = lazy(() => import('./pages/settings/ResumeSettingsPage'));
const PasswordSettingsPage = lazy(() => import('./pages/settings/PasswordSettingsPage'));
const PrivacyPage = lazy(() => import('./pages/settings/PrivacyPage'));
const NotificationSettingsPage = lazy(() => import('./pages/settings/NotificationSettingsPage'));
const TwoFactorPage = lazy(() => import('./pages/settings/TwoFactorPage'));
const CompanySettingsPage = lazy(() => import('./pages/settings/CompanySettingsPage'));

// ---- Onboarding ----
const OnboardingWizard = lazy(() => import('./pages/candidate/OnboardingWizard'));

// ---- Company Page ----
const CompanyPage = lazy(() => import('./pages/public/CompanyPage'));

function AcceptInviteGate() {
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ returnTo: `/accept-invite${location.search}` }} replace />;
    }
    return <AcceptInvitePage />;
}

function LegacyAcceptInviteRedirect() {
    const location = useLocation();
    return <Navigate to={`/accept-invite${location.search}`} replace />;
}

export default function AppRouter() {
    const { isAuthenticated, user } = useAuthStore();

    // Redirect authenticated users to their role-appropriate dashboard
    const roleHome =
        user?.role === 'employer' ? '/hr/dashboard'  // 'employer' is the DB value for HR role
        : user?.role === 'admin'  ? '/admin'
        : '/dashboard'; // candidate (default)

    // Gate: new users who haven't completed onboarding are redirected to /onboarding.
    // Admins are exempt (they have no onboarding flow).
    const needsOnboarding =
        isAuthenticated &&
        user?.role !== 'admin' &&
        user?.onboarding_complete === false;

    return (
        <BrowserRouter>
            <ScrollToTop />
            <GoogleAnalytics />
            <Suspense fallback={<LoadingFallback />}>
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

                    {/* Onboarding Wizard (authenticated but onboarding_complete=false) */}
                    <Route
                        path="/onboarding"
                        element={
                            isAuthenticated
                                ? <OnboardingWizard />
                                : <Navigate to="/login" replace />
                        }
                    />

                    {/* Public Company Pages */}
                    <Route path="/companies/:slug" element={<CompanyPage />} />

                    <Route path="/verify-email" element={<EmailVerificationPage />} />

                    {/* OAuth Callback — must be public (no auth guard) */}
                    <Route path="/auth/callback" element={<OAuthCallbackPage />} />

                    {/* Org invite accept — any authenticated user (not HR-only) */}
                    <Route path="/accept-invite" element={<AcceptInviteGate />} />
                    <Route path="/hr/accept-invite" element={<LegacyAcceptInviteRedirect />} />

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

                    {/* Settings — all authenticated roles (candidate, employer, admin) */}
                    <Route
                        element={
                            needsOnboarding
                                ? <Navigate to="/onboarding" replace />
                                : <ProtectedRoute />
                        }
                    >
                        <Route path="/settings" element={<SettingsLayout />}>
                            <Route index element={<Navigate to="/settings/profile" replace />} />
                            <Route path="profile" element={<ProfileSettingsPage />} />
                            <Route path="qualifications" element={<QualificationsPage />} />
                            <Route path="job-preferences" element={<JobPreferencesPage />} />
                            <Route path="job-filters" element={<JobFiltersPage />} />
                            <Route path="resume" element={<ResumeSettingsPage />} />
                            <Route path="password" element={<PasswordSettingsPage />} />
                            <Route path="privacy" element={<PrivacyPage />} />
                            <Route path="notifications" element={<NotificationSettingsPage />} />
                            <Route path="2fa" element={<TwoFactorPage />} />
                            <Route path="company" element={<CompanySettingsPage />} />
                        </Route>
                    </Route>

                    {/* Protected Routes — gate onboarding before any protected content */}
                    <Route
                        element={
                            needsOnboarding
                                ? <Navigate to="/onboarding" replace />
                                : <ProtectedRoute />
                        }
                    >
                        <Route path="/dashboard" element={<DashboardPage />} />

                        {/* Candidate Routes */}
                        <Route path="/dashboard/applications" element={<MyApplicationsPage />} />
                        <Route path="/dashboard/tryouts" element={<MyTryoutsPage />} />
                        <Route path="/tryouts/job/:jobId" element={<TryoutDetailsPage />} />
                        <Route path="/tryouts/:tryoutId" element={<TryoutDetailsPage />} />
                        <Route path="/tryouts/:submissionId/payment" element={<TryoutPaymentPage />} />
                        <Route path="/vault" element={<VaultDashboardPage />} />
                        <Route path="/vault/add" element={<VaultItemFormPage />} />
                        <Route path="/vault/edit/:itemId" element={<VaultItemFormPage />} />
                        <Route path="/vault/shares" element={<ShareManagementPage />} />

                        {/* ── HR Routes (DB role value: 'employer'; Admins also pass through) ── */}
                    </Route>

                    {/* HR-only routes — candidates redirected to /dashboard */}
                    <Route element={<ProtectedRoute requiredRole="employer" />}>
                        <Route path="/hr/jobs" element={<HRJobsPage />} />
                        <Route path="/hr/jobs/create" element={<CreateJobPage />} />
                        <Route path="/hr/applications" element={<ApplicationsPage />} />
                        <Route path="/hr/applications/:applicationId" element={<ApplicationDetailsPage />} />
                        <Route path="/hr/tryouts/create" element={<CreateTryoutPage />} />
                        <Route path="/hr/tryouts/grade" element={<GradeTryoutsPage />} />
                        <Route path="/hr/tryouts/grade/:submissionId" element={<GradeSubmissionPage />} />
                        <Route path="/hr/analytics" element={<AnalyticsDashboardPage />} />
                        <Route path="/hr/dashboard" element={<HRDashboardPage />} />
                        <Route path="/hr/onboarding" element={<EmployerOnboardingPage />} />
                        <Route path="/hr/domain-verify" element={<DomainVerificationPage />} />
                        <Route path="/hr/team" element={<TeamManagementPage />} />
                        <Route path="/hr/billing" element={<BillingPage />} />
                        <Route path="/hr/bulk-post" element={<BulkJobPostPage />} />
                        <Route path="/hr/audit-logs" element={<AuditLogsPage />} />

                        {/* Legacy redirects — keep old /employer/* links working */}
                        <Route path="/employer/dashboard" element={<Navigate to="/hr/dashboard" replace />} />
                        <Route path="/employer/jobs" element={<Navigate to="/hr/jobs" replace />} />
                        <Route path="/employer/applications" element={<Navigate to="/hr/applications" replace />} />
                        <Route path="/employer/analytics" element={<Navigate to="/hr/analytics" replace />} />
                    </Route>

                    {/* Admin-only Routes */}
                    <Route element={<ProtectedRoute requiredRole="admin" />}>
                        <Route path="/admin" element={<AdminDashboardPage />} />
                        <Route path="/admin/users" element={<AdminUsersPage />} />
                        <Route path="/admin/jobs" element={<AdminJobsPage />} />
                        <Route path="/admin/applications" element={<AdminApplicationsPage />} />
                        <Route path="/admin/organizations" element={<AdminOrganizationsPage />} />
                    </Route>

                    {/* 404 - Catch All */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

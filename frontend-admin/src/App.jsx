import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AdminAppLayout from './components/layout/AdminAppLayout';
import PublicOnlyRoute from './components/routing/PublicOnlyRoute';
import ProtectedRoute from './components/routing/ProtectedRoute';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { useTheme } from './components/theme/ThemeContext';
import { bootstrapAuth, clearAuthFeedback } from './features/auth/authSlice';
const AdminArenasPage = lazy(() => import('./pages/admin/AdminArenasPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminDisciplinesPage = lazy(() => import('./pages/admin/AdminDisciplinesPage'));
const AdminHorsesPage = lazy(() => import('./pages/admin/AdminHorsesPage'));
const AdminCoachesPage = lazy(() => import('./pages/admin/AdminCoachesPage'));
const AdminCoachDetailsPage = lazy(() => import('./pages/admin/AdminCoachDetailsPage'));
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage'));
const AdminCourseCreatePage = lazy(() => import('./pages/admin/AdminCourseCreatePage'));
const AdminCourseDetailsPage = lazy(() => import('./pages/admin/AdminCourseDetailsPage'));
const AdminRidersPage = lazy(() => import('./pages/admin/AdminRidersPage'));
const AdminRiderDetailsPage = lazy(() => import('./pages/admin/AdminRiderDetailsPage'));
const AdminStablesPage = lazy(() => import('./pages/stables/AdminStablesPage'));
const AdminStableViewPage = lazy(() => import('./pages/stables/AdminStableViewPage'));
const AdminStableRegistrationsPage = lazy(() => import('./pages/admin/AdminStableRegistrationsPage'));
const AdminForgotPasswordPage = lazy(() => import('./pages/auth/AdminForgotPasswordPage'));
const AdminLoginPage = lazy(() => import('./pages/auth/AdminLoginPage'));
const AdminResetPasswordPage = lazy(() => import('./pages/auth/AdminResetPasswordPage'));
const AdminSignupPage = lazy(() => import('./pages/auth/AdminSignupPage'));
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage'));
const AdminPaymentsPage = lazy(() => import('./pages/admin/AdminPaymentsPage'));
const AdminPayoutsPage = lazy(() => import('./pages/admin/AdminPayoutsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminNotificationsPage = lazy(() => import('./pages/admin/AdminNotificationsPage'));
const AdminProfilePage = lazy(() => import('./pages/admin/AdminProfilePage'));
const AdminOnboardingPage = lazy(() => import('./pages/admin/AdminOnboardingPage'));
const AdminMaintenancePage = lazy(() => import('./pages/admin/AdminMaintenancePage'));
import { Toaster } from 'react-hot-toast';

const AppRoutes = () => {
  const { isDark } = useTheme();

  return (
    <div className={`${isDark ? 'dark' : 'light'} min-h-screen`}>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            zIndex: 9999,
          },
          success: {
            style: {
              background: isDark ? '#1f2937' : '#fff',
              color: isDark ? '#fff' : '#1f2937',
            },
          },
          error: {
            style: {
              background: isDark ? '#1f2937' : '#fff',
              color: isDark ? '#fff' : '#1f2937',
            },
          },
        }} 
      />
      <Suspense
        fallback={
          <div className="grid min-h-screen place-items-center bg-gray-50 dark:bg-gray-950">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              Loading page...
            </div>
          </div>
        }
      >
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/signup" element={<AdminSignupPage />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
            <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminAppLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="stables" element={<AdminStablesPage />} />
              <Route path="stables/:stableId" element={<AdminStableViewPage />} />
              <Route path="stable-registrations" element={<AdminStableRegistrationsPage />} />
              <Route path="arenas" element={<AdminArenasPage />} />
              <Route path="horses" element={<AdminHorsesPage />} />
              <Route path="disciplines" element={<AdminDisciplinesPage />} />
              <Route path="coaches" element={<AdminCoachesPage />} />
              <Route path="coaches/:coachId" element={<AdminCoachDetailsPage />} />
              <Route path="courses" element={<AdminCoursesPage />} />
              <Route path="courses/create" element={<AdminCourseCreatePage />} />
              <Route path="courses/:courseId" element={<AdminCourseDetailsPage />} />
              <Route path="riders" element={<AdminRidersPage />} />
              <Route path="rider/:riderId" element={<AdminRiderDetailsPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="payouts" element={<AdminPayoutsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="profile" element={<AdminProfilePage />} />
              <Route path="onboarding" element={<AdminOnboardingPage />} />
              <Route path="maintenance" element={<AdminMaintenancePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(bootstrapAuth());
    return () => {
      dispatch(clearAuthFeedback());
    };
  }, [dispatch]);

  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;

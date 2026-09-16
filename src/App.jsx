import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { appClient } from '@/api/localClient';

// Public pages
import JobBoard from './pages/JobBoard';
import Application from './pages/Application';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import JobsList from './pages/admin/JobsList';
import JobEditor from './pages/admin/JobEditor';
import JobDetail from './pages/admin/JobDetail';
import ApplicationsList from './pages/admin/ApplicationsList';
import ApplicationDetail from './pages/admin/ApplicationDetail';
import AdminSettings from './pages/admin/AdminSettings';

// Protects admin routes — only admin role can enter
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const canAccess = isAuthenticated && user?.role === 'admin';
  useEffect(() => {
    if (!isLoadingAuth && !canAccess) appClient.auth.redirectToLogin('/');
  }, [isLoadingAuth, canAccess]);
  if (isLoadingAuth) {
    return (
      <div role="status" className="fixed inset-0 flex items-center justify-center">
        <div aria-hidden="true" className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        <span className="sr-only">Checking administrator access…</span>
      </div>
    );
  }
  return canAccess ? children : null;
};

const AppRoutes = () => {
  // Administrator session availability must never gate the public application.
  // Only AdminRoute waits for authentication or initiates a login redirect.
  const isLegacyAdminDomain = typeof window !== 'undefined' && (window.location.hostname === 'admin.geolabs.net' || window.location.hostname.startsWith("admin."));

  return (
    <Routes>
      {isLegacyAdminDomain && <Route path="/" element={<Navigate to="/admin" replace />} />}
      <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/admin/jobs" element={<AdminRoute><JobsList /></AdminRoute>} />
      <Route path="/admin/jobs/new" element={<AdminRoute><JobEditor /></AdminRoute>} />
      <Route path="/admin/jobs/:id" element={<AdminRoute><JobDetail /></AdminRoute>} />
      <Route path="/admin/jobs/:id/edit" element={<AdminRoute><JobEditor /></AdminRoute>} />
      <Route path="/admin/applications" element={<AdminRoute><ApplicationsList /></AdminRoute>} />
      <Route path="/admin/applications/:id" element={<AdminRoute><ApplicationDetail /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      <Route path="/admin/email-templates" element={<Navigate to="/admin/settings" replace />} />
      <Route path="/" element={<JobBoard />} />
      <Route path="/apply/:requisitionId" element={<Application />} />
      <Route path="/apply" element={<Application />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App;

import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

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
import Billing from './pages/admin/Billing';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<JobBoard />} />
      <Route path="/apply/:requisitionId" element={<Application />} />
      <Route path="/apply" element={<Application />} />

      {/* Admin */}
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/jobs" element={<JobsList />} />
      <Route path="/admin/jobs/new" element={<JobEditor />} />
      <Route path="/admin/jobs/:id" element={<JobDetail />} />
      <Route path="/admin/jobs/:id/edit" element={<JobEditor />} />
      <Route path="/admin/applications" element={<ApplicationsList />} />
      <Route path="/admin/applications/:id" element={<ApplicationDetail />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/admin/billing" element={<Billing />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App;
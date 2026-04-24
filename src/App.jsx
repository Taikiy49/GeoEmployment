import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

// Public pages
import JobBoard from './pages/JobBoard';
import Application from './pages/Application';

// Admin pages
import Billing from './pages/admin/Billing';
import Dashboard from './pages/admin/Dashboard';
import JobsList from './pages/admin/JobsList';
import JobEditor from './pages/admin/JobEditor';
import JobDetail from './pages/admin/JobDetail';
import ApplicationsList from './pages/admin/ApplicationsList';
import ApplicationDetail from './pages/admin/ApplicationDetail';
import AdminSettings from './pages/admin/AdminSettings';
import EmailTemplates from './pages/admin/EmailTemplates';

// Billing route — only accessible to taikiy49@gmail.com
const BillingRoute = () => {
  const { user } = useAuth();
  if (user?.email !== 'taikiy49@gmail.com') return <Navigate to="/admin" />;
  return <Billing />;
};

// Protects /admin/* — only admin role can enter
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return null;
  if (!isAuthenticated || user?.role !== 'admin') {
    base44.auth.redirectToLogin('/admin');
    return null;
  }
  return children;
};

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

      {/* Admin — role="admin" required */}
      <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/admin/jobs" element={<AdminRoute><JobsList /></AdminRoute>} />
      <Route path="/admin/jobs/new" element={<AdminRoute><JobEditor /></AdminRoute>} />
      <Route path="/admin/jobs/:id" element={<AdminRoute><JobDetail /></AdminRoute>} />
      <Route path="/admin/jobs/:id/edit" element={<AdminRoute><JobEditor /></AdminRoute>} />
      <Route path="/admin/applications" element={<AdminRoute><ApplicationsList /></AdminRoute>} />
      <Route path="/admin/applications/:id" element={<AdminRoute><ApplicationDetail /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      <Route path="/admin/email-templates" element={<AdminRoute><EmailTemplates /></AdminRoute>} />
      <Route path="/admin/billing" element={<AdminRoute><BillingRoute /></AdminRoute>} />

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
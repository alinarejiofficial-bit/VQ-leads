import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import { useAuthStore } from './store';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { Login } from './layouts/AuthLayout/Login';

// Module Pages
import { Dashboard } from './modules/dashboard';
import { Leads } from './modules/leads';
import { Teams } from './modules/team';
import { Forms } from './modules/forms';
import { PublicForm } from './modules/forms/components/PublicForm';
import { Commissions } from './modules/commissions';
import { TasksPage } from './modules/tasks';
import { Reports } from './modules/reports';
import { Settings } from './modules/settings';
import { Activities } from './modules/activities';
import FollowUps from './modules/followups';
import { Notifications } from './modules/notifications';
import { AuditLogs } from './modules/audit-logs';
// --- AUTH GATES ---
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const user = useAuthStore(state => state.user);
  if (!user || user.profile.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

interface LeaderOrAdminRouteProps {
  children: React.ReactNode;
}

const LeaderOrAdminRoute: React.FC<LeaderOrAdminRouteProps> = ({ children }) => {
  const user = useAuthStore(state => state.user);
  if (!user || (user.profile.role !== 'ADMIN' && user.profile.role !== 'LEADER')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};


// --- CORE APP ---
function App() {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <Router>
      <Routes>
        {/* Public portal submission */}
        <Route 
          path="/public-form/:id" 
          element={
            <AuthLayout>
              <PublicForm />
            </AuthLayout>
          } 
        />
        
        {/* Authentication */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthLayout>
                <Login />
              </AuthLayout>
            )
          } 
        />

        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
          }
        />

        {/* Protected Pages wrapped in AdminLayout */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard user={user!} />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/leads" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Leads user={user!} />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/teams" 
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminLayout>
                  <Teams />
                </AdminLayout>
              </AdminRoute>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/forms" 
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminLayout>
                  <Forms />
                </AdminLayout>
              </AdminRoute>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/commissions" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Commissions user={user!} />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <TasksPage />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/activities" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Activities />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/followups" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <FollowUps />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Notifications />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/audit-logs" 
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminLayout>
                  <AuditLogs />
                </AdminLayout>
              </AdminRoute>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <LeaderOrAdminRoute>
                <AdminLayout>
                  <Reports />
                </AdminLayout>
              </LeaderOrAdminRoute>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminLayout>
                  <Settings />
                </AdminLayout>
              </AdminRoute>
            </ProtectedRoute>
          } 
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Router>
  );
}

export default App;

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

// --- AUTH GATES ---
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) {
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
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// --- CORE APP ---
function App() {
  const user = useAuthStore(state => state.user);

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
            user ? (
              <Navigate to="/" replace />
            ) : (
              <AuthLayout>
                <Login />
              </AuthLayout>
            )
          } 
        />

        {/* Protected Pages wrapped in AdminLayout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              {user && (
                <AdminLayout>
                  <Dashboard user={user} />
                </AdminLayout>
              )}
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/leads" 
          element={
            <ProtectedRoute>
              {user && (
                <AdminLayout>
                  <Leads user={user} />
                </AdminLayout>
              )}
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/teams" 
          element={
            <ProtectedRoute>
              <AdminRoute>
                {user && (
                  <AdminLayout>
                    <Teams />
                  </AdminLayout>
                )}
              </AdminRoute>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/forms" 
          element={
            <ProtectedRoute>
              <AdminRoute>
                {user && (
                  <AdminLayout>
                    <Forms />
                  </AdminLayout>
                )}
              </AdminRoute>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/commissions" 
          element={
            <ProtectedRoute>
              {user && (
                <AdminLayout>
                  <Commissions user={user} />
                </AdminLayout>
              )}
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute>
              {user && (
                <AdminLayout>
                  <TasksPage />
                </AdminLayout>
              )}
            </ProtectedRoute>
          } 
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

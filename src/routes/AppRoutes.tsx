import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage.js';
import { ServicesPage } from '../pages/public/ServicesPage.js';
import { TrackRequestPage } from '../pages/public/TrackRequestPage.js';
import { LoginPage } from '../pages/auth/LoginPage.js';
import { RegisterPage } from '../pages/auth/RegisterPage.js';

// Citizen Pages
import { CitizenDashboard } from '../pages/citizen/CitizenDashboard.js';
import { ApplyDocumentPage } from '../pages/citizen/ApplyDocumentPage.js';
import { MyRequestsPage } from '../pages/citizen/MyRequestsPage.js';
import { RequestDetailsPage } from '../pages/citizen/RequestDetailsPage.js';
import { CitizenProfilePage } from '../pages/citizen/CitizenProfilePage.js';
import { NotificationsPage } from '../pages/citizen/NotificationsPage.js';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard.js';
import { AdminRequestsPage } from '../pages/admin/AdminRequestsPage.js';
import { AdminProcessRequestPage } from '../pages/admin/AdminProcessRequestPage.js';
import { AdminDocumentTypesPage } from '../pages/admin/AdminDocumentTypesPage.js';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage.js';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage.js';
import { AdminProfilePage } from '../pages/admin/AdminProfilePage.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs font-medium">
        Validating departmental credentials...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If citizen tries to access admin or admin tries to access citizen
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/citizen/dashboard'} replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/track-request" element={<TrackRequestPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Citizen Protected Routes */}
      <Route
        path="/citizen/dashboard"
        element={
          <ProtectedRoute allowedRole="citizen">
            <CitizenDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/apply"
        element={
          <ProtectedRoute allowedRole="citizen">
            <ApplyDocumentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/requests"
        element={
          <ProtectedRoute allowedRole="citizen">
            <MyRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/requests/:id"
        element={
          <ProtectedRoute allowedRole="citizen">
            <RequestDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/profile"
        element={
          <ProtectedRoute allowedRole="citizen">
            <CitizenProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/notifications"
        element={
          <ProtectedRoute allowedRole="citizen">
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/requests"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/requests/:id"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminProcessRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/document-types"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDocumentTypesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminAuditLogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

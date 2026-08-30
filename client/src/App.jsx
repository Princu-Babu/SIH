import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InstrumentListPage from './pages/instruments/InstrumentListPage';
import InstrumentFormPage from './pages/instruments/InstrumentFormPage';
import InstrumentDetailPage from './pages/instruments/InstrumentDetailPage';
import TestSessionListPage from './pages/tests/TestSessionListPage';
import NewTestSessionPage from './pages/tests/NewTestSessionPage';
import TestSessionDetailPage from './pages/tests/TestSessionDetailPage';
import TestDataEntryPage from './pages/tests/TestDataEntryPage';
import ReportPage from './pages/reports/ReportPage';
import UserManagementPage from './pages/users/UserManagementPage';
import AuditLogPage from './pages/audit/AuditLogPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected App Routes inside AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Instruments */}
        <Route path="/instruments" element={<InstrumentListPage />} />
        <Route
          path="/instruments/new"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'INSPECTOR']}>
              <InstrumentFormPage />
            </ProtectedRoute>
          }
        />
        <Route path="/instruments/:id" element={<InstrumentDetailPage />} />
        <Route
          path="/instruments/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'INSPECTOR']}>
              <InstrumentFormPage />
            </ProtectedRoute>
          }
        />

        {/* Test Sessions */}
        <Route path="/tests" element={<TestSessionListPage />} />
        <Route
          path="/tests/new"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'INSPECTOR']}>
              <NewTestSessionPage />
            </ProtectedRoute>
          }
        />
        <Route path="/tests/:id" element={<TestSessionDetailPage />} />
        <Route
          path="/tests/:id/:testType"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'INSPECTOR']}>
              <TestDataEntryPage />
            </ProtectedRoute>
          }
        />

        {/* Reports */}
        <Route path="/reports" element={<Navigate to="/tests" replace />} />
        <Route path="/reports/:sessionId" element={<ReportPage />} />

        {/* Admin & Inspector Management */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'INSPECTOR']}>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

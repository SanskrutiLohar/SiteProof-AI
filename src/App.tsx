import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ProjectProvider } from './context/ProjectContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { ProjectDetailsPage } from './pages/admin/ProjectDetailsPage.tsx';
import { ContractorDashboard } from './pages/contractor/ContractorDashboard.tsx';
import { ContractorMilestonePage } from './pages/contractor/ContractorMilestonePage.tsx';

// Root redirect based on role
const RootRedirect: React.FC = () => {
  const { profile, role } = useAuth();
  if (!profile) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={role === 'admin_inspector' ? '/admin/dashboard' : '/contractor/dashboard'} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
            <Navbar />
            <main className="flex-1 pb-16">
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<AuthPage />} />

                {/* Admin / Inspector Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin_inspector']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/project/:projectId"
                  element={
                    <ProtectedRoute allowedRoles={['admin_inspector']}>
                      <ProjectDetailsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Contractor Routes */}
                <Route
                  path="/contractor/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['contractor']}>
                      <ContractorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contractor/project/:projectId"
                  element={
                    <ProtectedRoute allowedRoles={['contractor']}>
                      <ContractorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contractor/milestone/:milestoneId"
                  element={
                    <ProtectedRoute allowedRoles={['contractor']}>
                      <ContractorMilestonePage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

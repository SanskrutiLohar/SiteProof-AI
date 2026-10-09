import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.tsx';
import { AuthPage } from './pages/AuthPage.tsx';

// Placeholder/Landing router redirect based on role
const RootRedirect: React.FC = () => {
  const { profile, role } = useAuth();
  if (!profile) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={role === 'admin_inspector' ? '/admin/dashboard' : '/contractor/dashboard'} replace />;
};

// Temp views for Plan 1 (Plan 2 expands these into full modules)
const TempAdminDashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="p-6 rounded-2xl glass-panel border border-blue-500/30">
        <h1 className="text-xl font-bold text-white mb-2">Inspector Cockpit Initialized</h1>
        <p className="text-xs text-slate-400">Phase 1 Plan 1 RBAC and Auth routing operational. Plan 2 creates Project & BOQ Management.</p>
      </div>
    </div>
  );
};

const TempContractorDashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="p-6 rounded-2xl glass-panel border border-amber-500/30">
        <h1 className="text-xl font-bold text-white mb-2">Contractor Portal Initialized</h1>
        <p className="text-xs text-slate-400">Phase 1 Plan 1 RBAC and Auth routing operational. Plan 2 creates Project & BOQ Management.</p>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<AuthPage />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['admin_inspector']}>
                    <Routes>
                      <Route path="dashboard" element={<TempAdminDashboard />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contractor/*"
                element={
                  <ProtectedRoute allowedRoles={['contractor']}>
                    <Routes>
                      <Route path="dashboard" element={<TempContractorDashboard />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

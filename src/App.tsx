import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

const pageTitles: Record<string, string> = {
  '/': 'Přehled',
  '/projects': 'Projekty',
  '/invoices': 'Faktury',
  '/reports': 'Reporty',
  '/settings': 'Nastavení',
  '/admin': 'Administrace',
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  
  // Get page title from path or default
  const pathWithoutParams = location.pathname.split('/').slice(0, 2).join('/');
  const title = pageTitles[pathWithoutParams] || 'JK Stavby';

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Sidebar onLogout={signOut} />
      <div className="md:ml-[240px] flex flex-col min-h-screen">
        <Header title={title} />
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#5B9AAD]" />
          <p className="text-lg font-medium text-[#475569]">Načítání...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#5B9AAD]" />
          <p className="text-lg font-medium text-[#475569]">Načítání aplikace...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/forgot-password" 
        element={user ? <Navigate to="/" replace /> : <ForgotPassword />} 
      />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

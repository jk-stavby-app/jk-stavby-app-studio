import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

// Lazy loaded pages
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));

const pageTitles: Record<string, string> = {
  '/': 'Přehled',
  '/projects': 'Projekty',
  '/invoices': 'Faktury',
  '/reports': 'Reporty',
  '/settings': 'Nastavení',
  '/admin': 'Administrace',
};

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-[#5B9AAD]" />
      <p className="text-base font-medium text-[#64748B]">Načítání...</p>
    </div>
  </div>
);

const FullPageLoader: React.FC<{ message?: string }> = ({ message = 'Načítání...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-[#5B9AAD]" />
      <p className="text-lg font-medium text-[#64748B]">{message}</p>
    </div>
  </div>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  
  const pathWithoutParams = location.pathname.split('/').slice(0, 2).join('/');
  const title = pageTitles[pathWithoutParams] || 'JK Stavby';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar onLogout={signOut} />
      {/* md:ml-[15rem] matches sidebar width */}
      <div className="md:ml-[15rem] flex flex-col min-h-screen">
        <Header title={title} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader message="Načítání aplikace..." />;
  }

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
        
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;

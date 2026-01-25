
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AiAssistant from './components/AiAssistant';
import { Loader2 } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const pageTitles: { [key: string]: string } = {
    '/': 'Přehled',
    '/projects': 'Projekty',
    '/invoices': 'Přehled faktur',
    '/reports': 'Reporty',
    '/settings': 'Nastavení',
    '/admin': 'Správa uživatelů',
  };

  const isProjectDetail = location.pathname.startsWith('/projects/');
  const currentTitle = isProjectDetail ? 'Detail projektu' : (pageTitles[location.pathname] || 'JK Stavby');

  return (
    <div className="flex min-h-screen bg-[#F4F6F8]">
      <Sidebar onLogout={signOut} />
      <div className="flex-1 flex flex-col md:pl-20 lg:pl-[240px] pb-16 md:pb-0 transition-all duration-300">
        <Header title={currentTitle} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden">
          {children}
        </main>
        <footer className="px-8 py-8 text-center text-[#475569] text-base border-t border-[#E2E5E9] mb-4 md:mb-0 leading-relaxed">
          © 2026 JK Stavební spol. s r.o. | Vytvořil <a href="https://vilim.one" target="_blank" rel="noopener noreferrer" className="text-[#5B9AAD] font-medium hover:text-[#4A8A9D] underline-offset-2 hover:underline focus:underline">vilim.one</a>
        </footer>
      </div>
      <BottomNav />
      {/* Persistent AI Assistant */}
      <AiAssistant />
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const { session, isLoading, signIn } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6F8]">
        <Loader2 className="w-12 h-12 animate-spin text-[#5B9AAD] mb-4" />
        <p className="text-[#475569] font-medium text-lg">Načítání aplikace...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={() => {}} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;

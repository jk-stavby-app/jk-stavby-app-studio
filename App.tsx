
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

const Layout: React.FC<{ children: React.ReactNode; onLogout: () => void }> = ({ children, onLogout }) => {
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
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 flex flex-col md:pl-20 lg:pl-[240px] pb-16 md:pb-0 transition-all duration-300">
        <Header title={currentTitle} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden">
          {children}
        </main>
        <footer className="px-8 py-8 text-center text-[#64748B] text-base border-t border-slate-100 mb-4 md:mb-0">
          2026 JK Stavební spol. s r.o. | Vytvořil <a href="https://vilim.one" target="_blank" rel="noopener noreferrer" className="hover:text-[#5B9AAD] hover:underline transition-colors font-medium">vilim.one</a>
        </footer>
      </div>
      <BottomNav />
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('jk_auth') === 'true';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('jk_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('jk_auth');
  };

  return (
    <HashRouter>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Layout onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </HashRouter>
  );
};

export default App;

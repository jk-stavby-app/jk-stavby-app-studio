import React, { Suspense, lazy, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';

// Components (always loaded)
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

// Lazy loaded pages (code splitting)
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

// Loading spinner component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-[#5B9AAD]" />
      <p className="text-base font-medium text-[#475569]">Načítání...</p>
    </div>
  </div>
);

// Full page loader for auth
const FullPageLoader: React.FC<{ message?: string }> = ({ message = 'Načítání...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-[#5B9AAD]" />
      <p className="text-lg font-medium text-[#475569]">{message}</p>
    </div>
  </div>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  
  const pathWithoutParams = location.pathname.split('/').slice(0, 2).join('/');
  const title = pageTitles[pathWithoutParams] || 'JK Stavby';

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Sidebar onLogout={signOut} />
      <div className="md:ml-[240px] flex flex-col min-h-screen">
        <Header title={title} />
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
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

// ============================================
// MAIN APP COMPONENT
// ============================================

const App: React.FC = () => {
  const { user, isLoading, signOut } = useAuth();

  // ==========================================
  // SESSION KEEP-ALIVE & AUTH LISTENER
  // ==========================================
  
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        return;
      }
      
      if (!data.session) {
        console.log('No active session');
        return;
      }
      
      // Check if token expires soon (within 5 minutes)
      const expiresAt = data.session.expires_at;
      if (expiresAt) {
        const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
        if (expiresIn < 300) {
          console.log('Token expiring soon, refreshing...');
          await supabase.auth.refreshSession();
        }
      }
    } catch (err) {
      console.error('Session check failed:', err);
    }
  }, []);

  useEffect(() => {
    // 1. Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        switch (event) {
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed successfully');
            break;
            
          case 'SIGNED_OUT':
            console.log('User signed out');
            // Clear any cached data
            break;
            
          case 'USER_UPDATED':
            console.log('User updated');
            break;
            
          case 'SIGNED_IN':
            console.log('User signed in');
            break;
        }
      }
    );

    // 2. Initial session check
    refreshSession();

    // 3. Periodic session refresh (every 4 minutes)
    const refreshInterval = setInterval(refreshSession, 4 * 60 * 1000);

    // 4. Refresh on window focus (user returns to tab)
    const handleFocus = () => {
      console.log('Window focused, checking session...');
      refreshSession();
    };
    window.addEventListener('focus', handleFocus);

    // 5. Refresh on online (reconnect after offline)
    const handleOnline = () => {
      console.log('Back online, refreshing session...');
      refreshSession();
    };
    window.addEventListener('online', handleOnline);

    // 6. Handle visibility change (tab becomes visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab visible, checking session...');
        refreshSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshSession]);

  // ==========================================
  // RENDER
  // ==========================================

  if (isLoading) {
    return <FullPageLoader message="Načítání aplikace..." />;
  }

  return (
    <Suspense fallback={<FullPageLoader />}>
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

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;

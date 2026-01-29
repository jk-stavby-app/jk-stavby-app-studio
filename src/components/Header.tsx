import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0]">
      <div className="flex items-center justify-between h-[4.5rem] px-4 md:px-8">
        {/* Page Title - fluid typography */}
        <h1 
          className="font-bold text-[#0F172A] tracking-tight"
          style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}
        >
          {title}
        </h1>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Notifications */}
          <button 
            className="p-2.5 md:p-3 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
            aria-label="Oznámení"
          >
            <Bell size={20} strokeWidth={2} />
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 md:gap-3 p-2 md:pl-3 md:pr-2 rounded-xl hover:bg-[#F1F5F9] transition-colors"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-[#0F172A] leading-tight">
                  {profile?.full_name || 'Uživatel'}
                </p>
                <p className="text-xs text-[#64748B] leading-tight">
                  {profile?.role === 'admin' ? 'Administrátor' : 'Uživatel'}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-[#5B9AAD] to-[#4A8A9D] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#5B9AAD]/20">
                {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </div>
              <ChevronDown 
                size={18} 
                className={`hidden md:block text-[#64748B] transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl shadow-black/5 overflow-hidden z-50">
                {/* User Info - Mobile */}
                <div className="px-4 py-4 border-b border-[#F1F5F9] md:hidden bg-[#FAFBFC]">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {profile?.full_name || 'Uživatel'}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {profile?.email}
                  </p>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                  >
                    <Settings size={18} className="text-[#64748B]" />
                    <span className="font-medium">Nastavení</span>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="font-medium">Odhlásit se</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

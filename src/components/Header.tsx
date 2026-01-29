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
      <div className="flex items-center justify-between h-[4.5rem] px-4 md:px-6">
        {/* Page Title - fluid typography */}
        <h1 
          className="font-semibold text-[#0F172A]"
          style={{ fontSize: 'clamp(1.125rem, 3vw, 1.5rem)' }}
        >
          {title}
        </h1>

        {/* Right Section */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Notifications */}
          <button 
            className="p-2.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
            aria-label="Oznámení"
          >
            <Bell size={20} />
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 md:gap-3 p-2 md:pl-3 rounded-lg hover:bg-[#F1F5F9] transition-colors"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-[#0F172A] leading-tight">
                  {profile?.full_name || 'Uživatel'}
                </p>
                <p className="text-xs text-[#64748B] leading-tight">
                  {profile?.role === 'admin' ? 'Administrátor' : 'Uživatel'}
                </p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-[#5B9AAD] to-[#4A8A9D] rounded-lg flex items-center justify-center text-white font-medium text-sm shadow-sm">
                {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </div>
              <ChevronDown 
                size={16} 
                className={`hidden md:block text-[#64748B] transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#E2E8F0] shadow-lg shadow-black/5 overflow-hidden z-50">
                {/* User Info - Mobile */}
                <div className="px-4 py-3 border-b border-[#F1F5F9] md:hidden">
                  <p className="text-sm font-medium text-[#0F172A]">
                    {profile?.full_name || 'Uživatel'}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {profile?.email}
                  </p>
                </div>

                <div className="py-1.5">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                  >
                    <Settings size={16} className="text-[#64748B]" />
                    <span>Nastavení</span>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Odhlásit se</span>
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

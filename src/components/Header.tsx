import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
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
    <header className="sticky top-0 z-30 bg-[#FAFBFC]/95 backdrop-blur-sm border-b border-[#E2E5E9]">
      <div className="flex items-center justify-between h-16 md:h-20 px-4 md:px-8">
        {/* Page Title */}
        <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">
          {title}
        </h1>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications - placeholder for future */}
          <button 
            className="relative p-2 md:p-3 min-w-[44px] min-h-[44px] rounded-xl text-[#475569] hover:bg-[#F4F6F8] hover:text-[#0F172A] transition-colors flex items-center justify-center"
            aria-label="Oznámení"
          >
            <Bell size={20} />
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 md:gap-3 p-2 md:p-3 min-h-[44px] rounded-xl hover:bg-[#F4F6F8] transition-colors"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-[#0F172A] leading-tight">
                  {profile?.full_name || 'Uživatel'}
                </p>
                <p className="text-xs text-[#475569] leading-tight">
                  {profile?.role === 'admin' ? 'Administrátor' : 'Uživatel'}
                </p>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-[#5B9AAD] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </div>
              <ChevronDown 
                size={16} 
                className={`hidden md:block text-[#475569] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#FAFBFC] rounded-xl border border-[#E2E5E9] shadow-lg overflow-hidden z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-[#E2E5E9] md:hidden">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {profile?.full_name || 'Uživatel'}
                  </p>
                  <p className="text-xs text-[#475569]">
                    {profile?.email}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#0F172A] hover:bg-[#F4F6F8] transition-colors min-h-[44px]"
                  >
                    <Settings size={18} className="text-[#475569]" />
                    Nastavení
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#DC2626] hover:bg-[#FEF2F2] transition-colors min-h-[44px]"
                  >
                    <LogOut size={18} />
                    Odhlásit se
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

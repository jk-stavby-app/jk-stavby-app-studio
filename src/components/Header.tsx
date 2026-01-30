import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, FolderKanban, FileText, BarChart3, 
  Settings, LogOut, Bell, Search, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Přehled' },
  { to: '/projects', icon: FolderKanban, label: 'Projekty' },
  { to: '/invoices', icon: FileText, label: 'Faktury' },
  { to: '/reports', icon: BarChart3, label: 'Reporty' },
  { to: '/admin', icon: Settings, label: 'Nastavení', adminOnly: true },
];

/**
 * MobileNavLink - Položka mobilní navigace
 */
const MobileNavLink: React.FC<{ 
  item: NavItem; 
  onClick: () => void;
}> = ({ item, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === item.to || 
    (item.to !== '/' && location.pathname.startsWith(item.to));

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold transition-all
        ${isActive 
          ? 'bg-[#5B9AAD] text-white shadow-sm' 
          : 'text-[#334155] hover:bg-[#F1F5F9]'
        }
      `}
    >
      <item.icon 
        size={22} 
        strokeWidth={2}
        className={isActive ? 'text-white' : 'text-[#64748B]'} 
      />
      <span className="flex-1">{item.label}</span>
      {isActive && <ChevronRight size={18} className="text-white/70" />}
    </NavLink>
  );
};

/**
 * Header - 2026 Enterprise SaaS Design
 */
const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
      setMobileMenuOpen(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const toggleMobileMenu = (): void => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = (): void => {
    setMobileMenuOpen(false);
  };

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  // Get current page title
  const getCurrentPageTitle = (): string => {
    const currentItem = navItems.find(item => 
      location.pathname === item.to || 
      (item.to !== '/' && location.pathname.startsWith(item.to))
    );
    return currentItem?.label || 'JK Stavby';
  };

  return (
    <>
      {/* Header Bar */}
      <header className="h-[72px] bg-white border-b border-[#E2E8F0] fixed top-0 left-0 right-0 lg:left-[260px] z-30">
        <div className="h-full flex items-center justify-between px-4 sm:px-6">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 -ml-2 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
              aria-label={mobileMenuOpen ? 'Zavřít menu' : 'Otevřít menu'}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-9 h-9 bg-gradient-to-br from-[#5B9AAD] to-[#4A8A9D] rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">JK</span>
              </div>
              <span className="text-base font-bold text-[#0F172A]">
                {getCurrentPageTitle()}
              </span>
            </div>

            {/* Desktop Search */}
            <div className="hidden lg:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                <input
                  type="text"
                  placeholder="Hledat v systému..."
                  className="w-[280px] xl:w-[360px] pl-10 pr-4 h-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#5B9AAD] focus:bg-white focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications */}
            <button 
              className="relative p-2.5 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
              aria-label="Notifikace"
            >
              <Bell size={20} strokeWidth={2} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            {/* User Profile - Desktop */}
            <div 
              onClick={() => navigate('/admin')}
              className="hidden sm:flex items-center gap-3 pl-3 pr-4 py-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] cursor-pointer hover:border-[#5B9AAD]/30 hover:bg-[#F0F9FF] transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E1EFF3] to-[#D1E5EB] text-[#3A6A7D] flex items-center justify-center font-bold text-xs border border-[#5B9AAD]/20">
                {profile?.full_name 
                  ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
                  : 'U'
                }
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-[#0F172A] leading-tight">
                  {profile?.full_name || 'Uživatel'}
                </p>
                <p className="text-xs font-medium text-[#64748B]">
                  {isAdmin ? 'Admin' : 'Uživatel'}
                </p>
              </div>
            </div>

            {/* User Avatar - Mobile only */}
            <div 
              onClick={() => navigate('/admin')}
              className="sm:hidden w-9 h-9 rounded-full bg-gradient-to-br from-[#E1EFF3] to-[#D1E5EB] text-[#3A6A7D] flex items-center justify-center font-bold text-sm border border-[#5B9AAD]/20 cursor-pointer"
            >
              {profile?.full_name 
                ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
                : 'U'
              }
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Panel */}
      <div className={`
        lg:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 
        transform transition-transform duration-300 ease-out shadow-2xl
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Menu Header */}
        <div className="h-[72px] flex items-center justify-between px-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#5B9AAD] to-[#4A8A9D] rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">JK</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-[#0F172A] leading-tight">JK Stavby</h1>
              <p className="text-xs font-medium text-[#64748B]">Management</p>
            </div>
          </div>
          <button 
            onClick={closeMobileMenu}
            className="p-2 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
            aria-label="Zavřít menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mobile Search */}
        <div className="px-4 py-4 border-b border-[#E2E8F0]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
            <input
              type="text"
              placeholder="Hledat..."
              className="w-full pl-10 pr-4 h-11 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#5B9AAD] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-4 py-2 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
            Menu
          </p>
          {filteredNavItems.map((item) => (
            <MobileNavLink 
              key={item.to} 
              item={item} 
              onClick={closeMobileMenu}
            />
          ))}
        </nav>

        {/* Mobile Menu Footer */}
        <div className="px-3 py-4 border-t border-[#E2E8F0] space-y-2">
          {/* User Info */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E1EFF3] to-[#D1E5EB] text-[#3A6A7D] flex items-center justify-center font-bold text-sm border border-[#5B9AAD]/20">
              {profile?.full_name 
                ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
                : 'U'
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0F172A] truncate">
                {profile?.full_name || 'Uživatel'}
              </p>
              <p className="text-xs font-medium text-[#64748B]">
                {isAdmin ? 'Administrátor' : 'Uživatel'}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={22} strokeWidth={2} />
            <span>Odhlásit se</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Header;

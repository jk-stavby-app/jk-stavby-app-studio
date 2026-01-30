import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FolderKanban, FileText, BarChart3, Settings, 
  LogOut, ChevronRight
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
 * NavLinkItem - Jednotlivá položka navigace
 */
const NavLinkItem: React.FC<{ item: NavItem }> = ({ item }) => {
  const location = useLocation();
  const isActive = location.pathname === item.to || 
    (item.to !== '/' && location.pathname.startsWith(item.to));

  return (
    <NavLink
      to={item.to}
      className={`
        group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
        ${isActive 
          ? 'bg-[#5B9AAD] text-white shadow-sm' 
          : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
        }
      `}
    >
      <item.icon 
        size={20} 
        strokeWidth={2}
        className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[#94A3B8] group-hover:text-[#5B9AAD]'}`} 
      />
      <span className="flex-1">{item.label}</span>
      {isActive && (
        <ChevronRight size={16} className="text-white/70" />
      )}
    </NavLink>
  );
};

/**
 * Sidebar - 2026 Enterprise SaaS Design
 */
const Sidebar: React.FC = () => {
  const { profile, isAdmin, signOut } = useAuth();

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden lg:flex flex-col w-[260px] h-screen bg-white border-r border-[#E2E8F0] fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="h-[72px] flex items-center px-5 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#5B9AAD] to-[#4A8A9D] rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">JK</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-[#0F172A] leading-tight">JK Stavby</h1>
            <p className="text-xs font-medium text-[#64748B]">Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-4 py-2 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
          Menu
        </p>
        {filteredNavItems.map((item) => (
          <NavLinkItem key={item.to} item={item} />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-[#E2E8F0] space-y-2">
        {/* User Profile */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E1EFF3] to-[#D1E5EB] text-[#3A6A7D] flex items-center justify-center font-bold text-sm border border-[#5B9AAD]/20">
            {profile?.full_name 
              ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
              : 'U'
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#0F172A] truncate">
              {profile?.full_name || 'Uživatel'}
            </p>
            <p className="text-xs font-medium text-[#64748B] truncate">
              {isAdmin ? 'Administrátor' : 'Uživatel'}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} strokeWidth={2} />
          <span>Odhlásit se</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Folder, FileText, BarChart3, Settings, Users, LogOut } from 'lucide-react';

interface SidebarProps {
  onLogout?: () => void;
}

const SidebarItem: React.FC<{
  to: string;
  icon: React.ElementType;
  label: string;
}> = ({ to, icon: Icon, label }) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 mx-3 rounded-xl transition-all duration-200 group text-base
        ${isActive 
          ? 'bg-[#5B9AAD] text-[#F8FAFC]' 
          : 'text-[#475569] hover:bg-[#F4F6F8] hover:text-[#0F172A]'
        }
      `}
    >
      <Icon size={20} className="shrink-0" aria-hidden="true" />
      <span className="font-medium tracking-normal whitespace-nowrap">{label}</span>
    </NavLink>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('jk_auth');
      window.location.reload();
    }
  };

  return (
    <nav 
      className="fixed left-0 top-0 bottom-0 bg-[#FAFBFC] border-r border-[#E2E5E9] hidden md:flex flex-col z-50 w-[240px]" 
      role="navigation" 
      aria-label="Hlavní navigace"
    >
      <div className="p-6 border-b border-[#E2E5E9]">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#5B9AAD] rounded-lg flex items-center justify-center">
            <span className="text-[#F8FAFC] font-semibold text-sm">JK</span>
          </div>
          <span className="text-lg font-semibold text-[#0F172A]">JK Stavby</span>
        </Link>
      </div>

      <ul className="flex-1 py-4 space-y-1 overflow-y-auto">
        <SidebarItem to="/" icon={Home} label="Přehled" />
        <SidebarItem to="/projects" icon={Folder} label="Projekty" />
        <SidebarItem to="/invoices" icon={FileText} label="Faktury" />
        <SidebarItem to="/reports" icon={BarChart3} label="Reporty" />
        <SidebarItem to="/admin" icon={Users} label="Administrace" />
      </ul>

      <div className="p-4 border-t border-[#E2E5E9] space-y-1">
        <SidebarItem to="/settings" icon={Settings} label="Nastavení" />
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#DC2626] hover:bg-[#FEF2F2] transition-all duration-200 group text-base min-h-[44px]"
        >
          <LogOut size={20} className="shrink-0" aria-hidden="true" />
          <span className="font-medium">Odhlásit se</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;

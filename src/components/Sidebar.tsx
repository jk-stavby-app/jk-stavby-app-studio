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
        flex items-center gap-3 px-3.5 py-2.5 mx-3 rounded-xl transition-all duration-200
        ${isActive 
          ? 'bg-[#5B9AAD] text-white shadow-sm' 
          : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
        }
      `}
    >
      <Icon size={18} className="shrink-0" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
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
      className="fixed left-0 top-0 bottom-0 bg-white hidden md:flex flex-col z-50 w-[15rem] border-r border-[#E2E8F0]" 
      role="navigation" 
      aria-label="Hlavní navigace"
    >
      {/* Logo Section */}
      <div className="h-[4.5rem] px-5 flex items-center border-b border-[#F1F5F9]">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-[#5B9AAD] to-[#4A8A9D] rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-semibold text-sm">JK</span>
          </div>
          <span className="text-lg font-semibold text-[#0F172A]">JK Stavby</span>
        </Link>
      </div>

      {/* Navigation Items */}
      <ul className="flex-1 py-5 space-y-0.5 overflow-y-auto">
        <SidebarItem to="/" icon={Home} label="Přehled" />
        <SidebarItem to="/projects" icon={Folder} label="Projekty" />
        <SidebarItem to="/invoices" icon={FileText} label="Faktury" />
        <SidebarItem to="/reports" icon={BarChart3} label="Reporty" />
        <SidebarItem to="/admin" icon={Users} label="Administrace" />
      </ul>

      {/* Bottom Section */}
      <div className="p-3 border-t border-[#F1F5F9] space-y-0.5">
        <SidebarItem to="/settings" icon={Settings} label="Nastavení" />
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 mx-3 rounded-xl text-[#DC2626] hover:bg-[#FEF2F2] transition-all duration-200"
          style={{ width: 'calc(100% - 1.5rem)' }}
        >
          <LogOut size={18} className="shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium">Odhlásit se</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;

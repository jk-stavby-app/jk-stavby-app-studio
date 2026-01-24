
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Folder, FileText, BarChart3, Settings, Users, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  onLogout?: () => void;
}

const SidebarItem: React.FC<{
  to: string;
  icon: React.ElementType;
  label: string;
  isCollapsed: boolean;
}> = ({ to, icon: Icon, label, isCollapsed }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
      ${isActive 
        ? 'bg-[#5B9AAD] text-white' 
        : 'text-[#64748B] hover:bg-[#5B9AAD]/10 hover:text-[#5B9AAD]'
      }
    `}
  >
    <Icon size={22} className="shrink-0" />
    {!isCollapsed && <span className="font-medium text-base whitespace-nowrap">{label}</span>}
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('jk_auth');
      window.location.reload();
    }
  };

  return (
    <aside 
      className={`fixed left-0 top-0 bottom-0 bg-white border-r border-slate-100 hidden md:flex flex-col z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-[240px]'}`}
    >
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#5B9AAD] rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0 border border-[#5B9AAD]/20">
          JK
        </div>
        {!isCollapsed && (
          <span className="font-bold text-xl text-[#0F172A] tracking-tight whitespace-nowrap">JK Stavby</span>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 mt-4">
        <SidebarItem to="/" icon={Home} label="Přehled" isCollapsed={isCollapsed} />
        <SidebarItem to="/projects" icon={Folder} label="Projekty" isCollapsed={isCollapsed} />
        <SidebarItem to="/invoices" icon={FileText} label="Faktury" isCollapsed={isCollapsed} />
        <SidebarItem to="/reports" icon={BarChart3} label="Reporty" isCollapsed={isCollapsed} />
        <SidebarItem to="/admin" icon={Users} label="Admin" isCollapsed={isCollapsed} />
      </nav>

      <div className="px-3 mb-4">
        <div className="h-px bg-slate-100 w-full" />
      </div>

      {/* User & Bottom Nav */}
      <div className="px-3 pb-6 space-y-1">
        <SidebarItem to="/settings" icon={Settings} label="Nastavení" isCollapsed={isCollapsed} />
        
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-all duration-200 group"
        >
          <LogOut size={22} className="shrink-0" />
          {!isCollapsed && <span className="font-medium text-base">Odhlásit se</span>}
        </button>

        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-4 w-full flex items-center justify-center py-2 text-[#64748B] hover:text-[#5B9AAD] hover:bg-slate-50 rounded-lg transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : (
            <div className="flex items-center gap-2">
              <ChevronLeft size={18} />
              <span className="text-sm font-bold uppercase tracking-wider">Sbalit</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

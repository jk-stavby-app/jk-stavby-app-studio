import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Folder, FileText, BarChart3, Settings, Users, LogOut } from 'lucide-react';

interface SidebarProps {
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('jk_auth');
      window.location.reload();
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
    ${isActive 
      ? 'bg-[#5B9AAD] text-white shadow-sm' 
      : 'text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
    }
  `;

  return (
    <nav 
      className="fixed left-0 top-0 bottom-0 bg-white hidden md:flex flex-col z-50 w-60 border-r border-[#E2E8F0]" 
      role="navigation" 
      aria-label="Hlavní navigace"
    >
      {/* Logo Section */}
      <div className="h-[4.5rem] px-5 flex items-center border-b border-[#F1F5F9]">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-[#5B9AAD] to-[#4A8A9D] rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">JK</span>
          </div>
          <span className="text-lg font-bold text-[#0F172A]">JK Stavby</span>
        </Link>
      </div>

      {/* Navigation Items */}
      <ul className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <li><NavLink to="/" className={navLinkClass}><Home size={20} /><span className="text-[15px] font-semibold">Přehled</span></NavLink></li>
        <li><NavLink to="/projects" className={navLinkClass}><Folder size={20} /><span className="text-[15px] font-semibold">Projekty</span></NavLink></li>
        <li><NavLink to="/invoices" className={navLinkClass}><FileText size={20} /><span className="text-[15px] font-semibold">Faktury</span></NavLink></li>
        <li><NavLink to="/reports" className={navLinkClass}><BarChart3 size={20} /><span className="text-[15px] font-semibold">Reporty</span></NavLink></li>
        <li><NavLink to="/admin" className={navLinkClass}><Users size={20} /><span className="text-[15px] font-semibold">Administrace</span></NavLink></li>
      </ul>

      {/* Bottom Section - STEJNÝ PADDING px-3 jako horní část */}
      <div className="px-3 py-3 border-t border-[#F1F5F9] space-y-1">
        <NavLink to="/settings" className={navLinkClass}>
          <Settings size={20} />
          <span className="text-[15px] font-semibold">Nastavení</span>
        </NavLink>
        
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#DC2626] hover:bg-[#FEF2F2] transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="text-[15px] font-semibold">Odhlásit se</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Folder, FileText, BarChart3, Settings } from 'lucide-react';

const NavItem: React.FC<{ to: string; icon: React.ElementType; label: string }> = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors min-h-[44px]
      ${isActive ? 'text-[#5B9AAD]' : 'text-[#475569]'}
    `}
  >
    <Icon size={20} aria-hidden="true" />
    <span className="text-[11px] font-medium leading-normal">{label}</span>
  </NavLink>
);

const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E2E5E9] flex md:hidden z-50 px-2 pb-safe">
      <NavItem to="/" icon={Home} label="Přehled" />
      <NavItem to="/projects" icon={Folder} label="Projekty" />
      <NavItem to="/invoices" icon={FileText} label="Faktury" />
      <NavItem to="/reports" icon={BarChart3} label="Reporty" />
      <NavItem to="/settings" icon={Settings} label="Nastavení" />
    </nav>
  );
};

export default BottomNav;

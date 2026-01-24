
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Folder, FileText, BarChart3, Settings } from 'lucide-react';

const NavItem: React.FC<{ to: string; icon: React.ElementType; label: string }> = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors
      ${isActive ? 'text-[#5B9AAD]' : 'text-[#64748B]'}
    `}
  >
    <Icon size={20} />
    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
  </NavLink>
);

const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex md:hidden z-50 px-2 pb-safe">
      <NavItem to="/" icon={Home} label="Přehled" />
      <NavItem to="/projects" icon={Folder} label="Projekty" />
      <NavItem to="/invoices" icon={FileText} label="Faktury" />
      <NavItem to="/reports" icon={BarChart3} label="Reporty" />
      <NavItem to="/settings" icon={Settings} label="Nastavení" />
    </nav>
  );
};

export default BottomNav;

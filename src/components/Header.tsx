import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { profile } = useAuth();

  return (
    <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between bg-[#FAFBFC] border-b border-[#E2E5E9]">
      <h1 className="text-2xl font-semibold text-[#0F172A] leading-tight truncate pr-2">{title}</h1>
      
      <div className="flex items-center gap-2 md:gap-6">
        <div className="relative hidden lg:block">
          <label htmlFor="header-search" className="sr-only">Hledat</label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569]" size={18} />
          <input
            id="header-search"
            type="text"
            placeholder="Hledat..."
            className="w-48 xl:w-64 pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] placeholder-[#5C6878] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all font-medium leading-relaxed"
          />
        </div>
        
        <button className="relative p-3 min-w-[44px] min-h-[44px] text-[#475569] hover:bg-[#F8F9FA] rounded-xl transition-colors" aria-label="Notifikace">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#DC2626] rounded-full border-2 border-[#FAFBFC]"></span>
        </button>
        
        <Link 
          to="/settings"
          className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-[#E2E5E9] cursor-pointer group hover:bg-[#F8F9FA] transition-colors py-2 px-3 rounded-xl min-h-[44px]"
        >
          <div className="text-right hidden sm:block">
            <p className="text-base font-semibold text-[#0F172A] leading-tight group-hover:text-[#5B9AAD] transition-colors">
              {profile?.full_name || 'Uživatel'}
            </p>
            <p className="text-sm text-[#475569] font-medium leading-normal">
              {profile?.position || (profile?.role === 'admin' ? 'Administrátor' : 'Člen týmu')}
            </p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#E1EFF3] border-2 border-[#E2E5E9] group-hover:border-[#5B9AAD] flex items-center justify-center transition-all overflow-hidden">
             <span className="text-sm font-bold text-[#3A6A7D]">
               {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
             </span>
          </div>
          <ChevronDown size={14} className="text-[#475569] hidden sm:block group-hover:text-[#5B9AAD] transition-colors" />
        </Link>
      </div>
    </header>
  );
};

export default Header;

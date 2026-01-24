
import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between glass-effect sticky top-0 z-40 border-b border-slate-100">
      <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] truncate pr-2">{title}</h1>
      
      <div className="flex items-center gap-2 md:gap-6">
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
          <input
            type="text"
            placeholder="Hledat..."
            className="pl-10 pr-4 py-2.5 w-48 xl:w-64 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all outline-none text-sm"
          />
        </div>
        
        <button className="relative p-2 text-[#64748B] hover:bg-slate-50 rounded-xl transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <Link 
          to="/settings"
          className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-slate-200 cursor-pointer group hover:bg-slate-50 transition-colors py-2 px-3 rounded-xl"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs md:text-sm font-semibold text-[#0F172A] leading-tight group-hover:text-[#5B9AAD] transition-colors">Marek Janota</p>
            <p className="text-[10px] md:text-xs text-[#64748B]">Director</p>
          </div>
          <img
            src="https://picsum.photos/seed/marek/100/100"
            alt="User avatar"
            className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-slate-50 group-hover:border-[#5B9AAD] transition-all"
          />
          <ChevronDown size={14} className="text-[#64748B] hidden sm:block group-hover:text-[#5B9AAD] transition-colors" />
        </Link>
      </div>
    </header>
  );
};

export default Header;

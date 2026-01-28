import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bell, ChevronDown, Loader2, Folder, FileText, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  title: string;
}

interface SearchResult {
  id: string;
  type: 'project' | 'invoice';
  title: string;
  subtitle: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const [projectsRes, invoicesRes] = await Promise.all([
        supabase
          .from('project_dashboard')
          .select('id, name, code')
          .or(`name.ilike.%${term}%,code.ilike.%${term}%`)
          .limit(5),
        supabase
          .from('project_invoices')
          .select('id, invoice_number, supplier_name, project_name')
          .or(`invoice_number.ilike.%${term}%,supplier_name.ilike.%${term}%`)
          .limit(5)
      ]);

      const results: SearchResult[] = [];

      (projectsRes.data || []).forEach(p => {
        results.push({
          id: p.id,
          type: 'project',
          title: p.name,
          subtitle: `Kód: ${p.code}`
        });
      });

      (invoicesRes.data || []).forEach(i => {
        results.push({
          id: i.id,
          type: 'invoice',
          title: i.invoice_number,
          subtitle: `${i.supplier_name}${i.project_name ? ` • ${i.project_name}` : ''}`
        });
      });

      setSearchResults(results);
      setShowResults(results.length > 0);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'project') {
      navigate(`/projects/${result.id}`);
    } else {
      navigate('/invoices');
    }
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between bg-[#FAFBFC] border-b border-[#E2E5E9]">
      <h1 className="text-xl md:text-2xl font-semibold text-[#0F172A] leading-tight truncate pr-2">{title}</h1>
      
      <div className="flex items-center gap-2 md:gap-6">
        <div className="relative hidden lg:block" ref={searchRef}>
          <label htmlFor="header-search" className="sr-only">Hledat projekty a faktury</label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569]" size={18} />
          <input
            id="header-search"
            type="text"
            placeholder="Hledat projekt, fakturu..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="w-48 xl:w-72 pl-10 pr-10 py-2.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] placeholder-[#5C6878] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all font-medium leading-relaxed"
          />
          
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#0F172A] p-1"
              aria-label="Vymazat hledání"
            >
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
            </button>
          )}

          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E2E5E9] rounded-xl shadow-lg z-50 overflow-hidden">
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FA] transition-colors text-left border-b border-[#E2E5E9] last:border-b-0"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    result.type === 'project' ? 'bg-[#E1EFF3] text-[#5B9AAD]' : 'bg-[#F4F6F8] text-[#475569]'
                  }`}>
                    {result.type === 'project' ? <Folder size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{result.title}</p>
                    <p className="text-xs text-[#475569] truncate">{result.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showResults && searchResults.length === 0 && searchTerm.length >= 2 && !isSearching && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E2E5E9] rounded-xl shadow-lg z-50 p-4 text-center">
              <p className="text-sm text-[#475569]">Žádné výsledky pro "{searchTerm}"</p>
            </div>
          )}
        </div>
        
        <button 
          className="relative p-3 min-w-[44px] min-h-[44px] text-[#475569] hover:bg-[#F8F9FA] rounded-xl transition-colors" 
          aria-label="Notifikace"
        >
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

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Folder, FileText, BarChart3, Search, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SearchResult {
  id: string;
  type: 'project' | 'invoice';
  title: string;
  subtitle: string;
}

/**
 * NavItem - Bottom navigation item
 */
const NavItem: React.FC<{ 
  to: string; 
  icon: React.ElementType; 
  label: string;
}> = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors min-h-[56px]
      ${isActive 
        ? 'text-[#5B9AAD]' 
        : 'text-[#64748B] active:text-[#334155]'
      }
    `}
  >
    <Icon size={22} strokeWidth={2} />
    <span className="text-[11px] font-semibold leading-tight">{label}</span>
  </NavLink>
);

/**
 * SearchResultItem - Individual search result
 */
const SearchResultItem: React.FC<{
  result: SearchResult;
  onClick: () => void;
}> = ({ result, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 bg-white border border-[#E2E8F0] rounded-xl hover:bg-[#F8FAFC] hover:border-[#5B9AAD]/30 transition-all text-left shadow-sm"
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
      result.type === 'project' 
        ? 'bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] text-[#5B9AAD]' 
        : 'bg-[#F1F5F9] text-[#64748B]'
    }`}>
      {result.type === 'project' ? <Folder size={20} /> : <FileText size={20} />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-base font-bold text-[#0F172A] truncate">{result.title}</p>
      <p className="text-sm font-medium text-[#64748B] truncate">{result.subtitle}</p>
    </div>
  </button>
);

/**
 * BottomNav - Mobile bottom navigation with search
 */
const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSearch]);

  const performSearch = useCallback(async (term: string): Promise<void> => {
    if (term.length < 2) {
      setSearchResults([]);
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
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleResultClick = (result: SearchResult): void => {
    if (result.type === 'project') {
      navigate(`/projects/${result.id}`);
    } else {
      navigate('/invoices');
    }
    closeSearch();
  };

  const closeSearch = (): void => {
    setShowSearch(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const openSearch = (): void => {
    setShowSearch(true);
  };

  return (
    <>
      {/* Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-50 bg-[#F8FAFC] lg:hidden">
          {/* Search Header */}
          <div className="flex items-center gap-3 p-4 bg-white border-b border-[#E2E8F0]">
            <button
              onClick={closeSearch}
              className="p-2.5 min-w-[44px] min-h-[44px] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] rounded-xl transition-all flex items-center justify-center"
              aria-label="Zavřít hledání"
            >
              <X size={24} />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Hledat projekt, fakturu..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 h-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-base font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#5B9AAD] focus:bg-white focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all"
              />
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Loading State */}
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-[#5B9AAD] mb-4" />
                <p className="text-sm font-medium text-[#64748B]">Hledání...</p>
              </div>
            )}

            {/* Results */}
            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider px-1 mb-3">
                  Výsledky ({searchResults.length})
                </p>
                {searchResults.map((result) => (
                  <SearchResultItem
                    key={`${result.type}-${result.id}`}
                    result={result}
                    onClick={() => handleResultClick(result)}
                  />
                ))}
              </div>
            )}

            {/* No Results */}
            {!isSearching && searchResults.length === 0 && searchTerm.length >= 2 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search size={28} className="text-[#94A3B8]" />
                </div>
                <p className="text-base font-semibold text-[#334155] mb-1">Žádné výsledky</p>
                <p className="text-sm font-medium text-[#64748B]">
                  Pro &quot;{searchTerm}&quot; nebylo nic nalezeno
                </p>
              </div>
            )}

            {/* Initial State */}
            {!isSearching && searchTerm.length < 2 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search size={28} className="text-[#94A3B8]" />
                </div>
                <p className="text-base font-semibold text-[#334155] mb-1">Rychlé vyhledávání</p>
                <p className="text-sm font-medium text-[#64748B]">
                  Zadejte alespoň 2 znaky pro hledání
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-[#E2E8F0] flex lg:hidden z-40 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgb(0_0_0_/_0.05)]">
        <NavItem to="/" icon={Home} label="Přehled" />
        <NavItem to="/projects" icon={Folder} label="Projekty" />
        
        {/* Search Button */}
        <button
          onClick={openSearch}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors min-h-[56px] text-[#64748B] active:text-[#334155]"
          aria-label="Vyhledávání"
        >
          <div className="w-11 h-11 bg-gradient-to-br from-[#5B9AAD] to-[#4A8A9D] rounded-xl flex items-center justify-center text-white shadow-sm -mt-4">
            <Search size={22} strokeWidth={2} />
          </div>
        </button>
        
        <NavItem to="/invoices" icon={FileText} label="Faktury" />
        <NavItem to="/reports" icon={BarChart3} label="Reporty" />
      </nav>
    </>
  );
};

export default BottomNav;

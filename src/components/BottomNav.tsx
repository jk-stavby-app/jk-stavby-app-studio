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
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSearch]);

  const performSearch = useCallback(async (term: string) => {
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
    closeSearch();
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <>
      {showSearch && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <div className="flex items-center gap-3 p-4 border-b border-[#E2E5E9]">
            <button
              onClick={closeSearch}
              className="p-2 min-w-[44px] min-h-[44px] text-[#475569] hover:bg-[#F8F9FA] rounded-xl transition-colors flex items-center justify-center"
              aria-label="Zavřít hledání"
            >
              <X size={24} />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" size={20} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Hledat projekt, fakturu..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] placeholder-[#5C6878] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#5B9AAD]" />
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center gap-4 p-4 bg-[#FAFBFC] border border-[#E2E5E9] rounded-xl hover:bg-[#F4F6F8] transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      result.type === 'project' ? 'bg-[#E1EFF3] text-[#5B9AAD]' : 'bg-[#F4F6F8] text-[#475569]'
                    }`}>
                      {result.type === 'project' ? <Folder size={20} /> : <FileText size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-[#0F172A] truncate">{result.title}</p>
                      <p className="text-sm text-[#475569] truncate">{result.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!isSearching && searchResults.length === 0 && searchTerm.length >= 2 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#F4F6F8] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-[#5C6878]" />
                </div>
                <p className="text-base text-[#475569]">Žádné výsledky pro "{searchTerm}"</p>
              </div>
            )}

            {!isSearching && searchTerm.length < 2 && (
              <div className="text-center py-8">
                <p className="text-base text-[#475569]">Zadejte alespoň 2 znaky</p>
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E2E5E9] flex md:hidden z-40 px-2 pb-safe">
        <NavItem to="/" icon={Home} label="Přehled" />
        <NavItem to="/projects" icon={Folder} label="Projekty" />
        
        <button
          onClick={() => setShowSearch(true)}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors min-h-[44px] text-[#475569]"
          aria-label="Vyhledávání"
        >
          <Search size={20} aria-hidden="true" />
          <span className="text-[11px] font-medium leading-normal">Hledat</span>
        </button>
        
        <NavItem to="/invoices" icon={FileText} label="Faktury" />
        <NavItem to="/reports" icon={BarChart3} label="Reporty" />
      </nav>
    </>
  );
};

export default BottomNav;

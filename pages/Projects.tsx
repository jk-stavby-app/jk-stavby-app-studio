
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Loader2, X, Calendar, EyeOff, FileText } from 'lucide-react';
import { formatCurrency } from '../constants';
import { supabase, createProject } from '../lib/supabase';
import { Project } from '../types';
import { useToast } from '../components/Toast';

const SkeletonCard = () => (
  <div className="bg-white p-6 rounded-2xl h-[280px] animate-pulse border border-slate-100">
    <div className="flex justify-between mb-6">
      <div className="w-16 h-6 bg-slate-100 rounded-lg"></div>
      <div className="w-20 h-6 bg-slate-100 rounded-lg"></div>
    </div>
    <div className="w-3/4 h-8 bg-slate-100 rounded-lg mb-4"></div>
    <div className="w-full h-3 bg-slate-100 rounded-full mb-6"></div>
    <div className="flex justify-between">
      <div className="w-24 h-10 bg-slate-100 rounded-lg"></div>
      <div className="w-24 h-10 bg-slate-100 rounded-lg"></div>
    </div>
  </div>
);

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const navigate = useNavigate();
  
  const getProgressBarColor = (percent: number) => {
    if (percent > 100) return 'bg-[#EF4444]';
    if (percent >= 80) return 'bg-[#F59E0B]';
    return 'bg-[#10B981]';
  };

  const getCardBackground = (p: Project) => {
    if (p.budget_usage_percent > 100) {
      // Critical - over budget
      return 'bg-[#FEF2F2] border-l-4 border-l-[#EF4444]';
    } else if (p.budget_usage_percent >= 80) {
      // Warning - approaching limit
      return 'bg-[#FFFBEB] border-l-4 border-l-[#F59E0B]';
    } else if (p.status === 'completed') {
      // Completed
      return 'bg-[#F0FDF4] border-l-4 border-l-[#10B981]';
    } else {
      // Normal - active and OK
      return 'bg-[#FAFBFC] border-l-4 border-l-[#5B9AAD]';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[rgba(16,185,129,0.1)] text-[#10B981]';
      case 'completed': return 'bg-[rgba(100,116,139,0.1)] text-[#64748B]';
      case 'on_hold': return 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B]';
      default: return 'bg-[rgba(91,154,173,0.1)] text-[#5B9AAD]';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'AKTIVNÍ';
      case 'completed': return 'DOKONČEN';
      case 'on_hold': return 'POZASTAVEN';
      default: return status.toUpperCase();
    }
  };

  return (
    <div 
      onClick={() => navigate(`/projects/${project.id}`)}
      className={`rounded-2xl p-6 shadow-sm transition-all duration-300 cursor-pointer flex flex-col group animate-in zoom-in hover:shadow-md ${getCardBackground(project)}`}
    >
      {/* Header row - code, year, status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-[#E2E8F0] rounded text-sm font-bold text-[#475569]">
            {project.code}
          </span>
          {project.project_year && (
            <span className="text-sm font-bold text-[#64748B]">
              Rok {project.project_year}
            </span>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${getStatusBadgeStyle(project.status)}`}>
          {getStatusLabel(project.status)}
        </span>
      </div>
      
      {/* Project name - more prominent */}
      <h3 className="text-lg font-semibold text-[#0F172A] mb-4 leading-tight group-hover:text-[#5B9AAD] transition-colors line-clamp-2 min-h-[3.5rem]">
        {project.name}
      </h3>
      
      {/* Budget progress section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#64748B]">Čerpání rozpočtu</span>
          <span className={`text-sm font-bold ${
            project.budget_usage_percent > 100 ? 'text-[#EF4444]' : 
            project.budget_usage_percent >= 80 ? 'text-[#F59E0B]' : 'text-[#0F172A]'
          }`}>
            {project.budget_usage_percent.toFixed(1)}%
          </span>
        </div>
        
        {/* Progress bar with background track */}
        <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${getProgressBarColor(project.budget_usage_percent)}`}
            style={{ width: `${Math.min(project.budget_usage_percent, 100)}%` }}
          />
        </div>
        
        {/* Over budget indicator */}
        {project.budget_usage_percent > 100 && (
          <p className="text-xs text-[#EF4444] mt-1.5 font-bold animate-pulse">
            Přečerpáno o {(project.budget_usage_percent - 100).toFixed(1)}%
          </p>
        )}
      </div>
      
      {/* Financial data - grid layout for better alignment */}
      <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-black/5">
        <div>
          <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider mb-1">Rozpočet</p>
          <p className="text-base font-bold text-[#0F172A]">
            {formatCurrency(project.planned_budget)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider mb-1">Vyčerpáno</p>
          <p className={`text-base font-bold ${
            project.budget_usage_percent > 100 ? 'text-[#EF4444]' : 'text-[#0F172A]'
          }`}>
            {formatCurrency(project.total_costs)}
          </p>
        </div>
      </div>
      
      {/* Invoice count - footer */}
      <div className="pt-3 border-t border-black/5 mt-auto">
        <div className="flex items-center gap-2 text-sm text-[#64748B] font-medium">
          <FileText size={16} />
          <span>{project.invoice_count} faktur celkem</span>
        </div>
      </div>
    </div>
  );
};

const NewProjectModal: React.FC<{ onClose: () => void; onSave: () => void; showToast: any }> = ({ onClose, onSave, showToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    planned_budget: 0,
    status: 'active',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await createProject(formData);
      if (error) throw error;
      showToast('Projekt byl úspěšně vytvořen', 'success');
      onSave();
    } catch (err) {
      showToast('Chyba při vytváření projektu', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-2xl font-bold text-[#0F172A]">Nový projekt</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-[#64748B]"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-base font-bold text-[#64748B]">Název projektu</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#5B9AAD]/30 text-base font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-base font-bold text-[#64748B]">Kód projektu</label>
              <input 
                required
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value})}
                className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#5B9AAD]/30 text-base font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-base font-bold text-[#64748B]">Rozpočet (Kč)</label>
              <input 
                type="number"
                value={formData.planned_budget}
                onChange={e => setFormData({...formData, planned_budget: Number(e.target.value)})}
                className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#5B9AAD]/30 text-base font-medium"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-base font-bold text-[#64748B]">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#5B9AAD]/30 appearance-none text-base font-bold"
              >
                <option value="active">Aktivní</option>
                <option value="completed">Dokončeno</option>
                <option value="on_hold">Pozastaveno</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-[#64748B] font-bold rounded-2xl hover:bg-slate-200 transition-all text-base"
            >
              Zrušit
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-[#5B9AAD] text-white font-bold rounded-2xl shadow-lg shadow-[#5B9AAD]/20 flex items-center justify-center gap-2 hover:bg-[#4A8A9D] transition-all text-base"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} />}
              {loading ? 'Vytvářím...' : 'Vytvořit projekt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Projects: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [hideEmpty, setHideEmpty] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 9;

  const { showToast, ToastComponent } = useToast();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('project_dashboard').select('*');
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      showToast('Nepodařilo se načíst projekty', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const years = useMemo(() => {
    return [...new Set(projects.map(p => p.project_year).filter(Boolean) as number[])].sort((a, b) => b - a);
  }, [projects]);

  const processedProjects = useMemo(() => {
    let result = [...projects];

    // 1. Hide empty: No invoices and zero budget
    if (hideEmpty) {
      result = result.filter(p => p.invoice_count > 0 || p.planned_budget > 0);
    }

    // 2. Status filter
    if (statusFilter) {
      result = result.filter(p => p.status === statusFilter);
    }

    // 3. Year filter
    if (selectedYear) {
      result = result.filter(p => p.project_year === selectedYear);
    }

    // 4. Search filter
    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 5. Activity sorting
    result.sort((a, b) => {
      if (b.total_costs !== a.total_costs) {
        return b.total_costs - a.total_costs;
      }
      if (b.invoice_count !== a.invoice_count) {
        return b.invoice_count - a.invoice_count;
      }
      return a.name.localeCompare(b.name, 'cs');
    });

    return result;
  }, [projects, searchTerm, statusFilter, selectedYear, hideEmpty]);

  const visibleProjects = useMemo(() => {
    return processedProjects.slice(0, currentPage * projectsPerPage);
  }, [processedProjects, currentPage]);

  const hasMore = visibleProjects.length < processedProjects.length;

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const hiddenCount = useMemo(() => {
    return projects.filter(p => p.invoice_count === 0 && p.planned_budget === 0).length;
  }, [projects]);

  return (
    <div className="space-y-6 pb-12">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
          <input
            type="text"
            placeholder="Hledat projekt dle názvu nebo kódu..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl outline-none text-sm focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all shadow-sm h-[44px]"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Hide empty toggle */}
          <label className="flex items-center gap-2 px-4 py-2.5 bg-[#FAFBFC] border border-[#E2E8F0] rounded-xl cursor-pointer min-w-[160px] h-[44px] hover:bg-slate-50 transition-colors shadow-sm">
            <input
              type="checkbox"
              checked={hideEmpty}
              onChange={(e) => {
                setHideEmpty(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 rounded border-[#E2E8F0] text-[#5B9AAD] focus:ring-[#5B9AAD] cursor-pointer"
            />
            <span className="text-sm font-bold text-[#0F172A] whitespace-nowrap">Skrýt prázdné</span>
          </label>

          {/* Year select */}
          <div className="relative">
            <select
              value={selectedYear || ''}
              onChange={(e) => {
                setSelectedYear(e.target.value ? Number(e.target.value) : null);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-[#FAFBFC] border border-[#E2E8F0] rounded-xl min-w-[160px] h-[44px] text-sm text-[#0F172A] font-bold outline-none focus:ring-2 focus:ring-[#5B9AAD]/20 appearance-none cursor-pointer shadow-sm pr-10"
            >
              <option value="">Všechny roky</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" size={14} />
          </div>

          {/* Status select */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-[#FAFBFC] border border-[#E2E8F0] rounded-xl min-w-[160px] h-[44px] text-sm text-[#0F172A] font-bold outline-none focus:ring-2 focus:ring-[#5B9AAD]/20 appearance-none cursor-pointer shadow-sm pr-10"
            >
              <option value="">Všechny stavy</option>
              <option value="active">Aktivní</option>
              <option value="completed">Dokončené</option>
              <option value="on_hold">Pozastavené</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" size={14} />
          </div>

          <button 
            onClick={() => setShowNewModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#5B9AAD] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#5B9AAD]/20 hover:bg-[#4A8A9D] transition-all whitespace-nowrap h-[44px] min-w-[160px]"
          >
            <Plus size={18} />
            Nový projekt
          </button>
        </div>
      </div>

      {hideEmpty && hiddenCount > 0 && (
        <p className="text-sm font-bold text-[#64748B] mb-4 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <EyeOff size={14} />
          Skryto {hiddenCount} prázdných projektů
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {processedProjects.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={40} className="text-slate-200" />
              </div>
              <p className="text-[#64748B] text-lg font-medium">Žádné projekty neodpovídají zvoleným filtrům</p>
            </div>
          )}

          {hasMore && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button
                onClick={handleLoadMore}
                className="px-8 py-3 border-2 border-[#5B9AAD] text-[#5B9AAD] rounded-full font-bold bg-transparent hover:bg-[#5B9AAD]/10 transition-colors"
              >
                Zobrazit další
              </button>
              <span className="text-[#64748B] font-medium">nebo</span>
              <button
                onClick={() => setCurrentPage(Math.ceil(processedProjects.length / projectsPerPage))}
                className="text-[#5B9AAD] hover:text-[#4A8A9D] underline underline-offset-2 transition-colors font-bold"
              >
                Zobrazit všechny ({processedProjects.length})
              </button>
            </div>
          )}

          {!hasMore && processedProjects.length > projectsPerPage && (
            <p className="text-center mt-12 text-[#64748B] font-medium">Všechny projekty zobrazeny</p>
          )}
        </>
      )}

      {showNewModal && (
        <NewProjectModal 
          showToast={showToast}
          onClose={() => setShowNewModal(false)} 
          onSave={() => {
            setShowNewModal(false);
            fetchProjects();
          }} 
        />
      )}
      
      {ToastComponent}
    </div>
  );
};

export default Projects;

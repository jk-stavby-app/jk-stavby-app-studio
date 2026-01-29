import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Loader2, X, FileText, Search as SearchIcon, Calendar, Filter, EyeOff } from 'lucide-react';
import { formatCurrency } from '../constants';
import { supabase, createProject } from '../lib/supabase';
import { Project } from '../types';
import { useToast } from '../components/Toast';

const PROJECTS_PER_PAGE = 12;

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const navigate = useNavigate();
  
  const getCardBg = (p: Project) => {
    if (p.budget_usage_percent > 100) return 'bg-[#FEF2F2]';
    if (p.budget_usage_percent >= 80) return 'bg-[#FEF9EE]';
    if (p.status === 'completed') return 'bg-[#ECFDF5]';
    return 'bg-white';
  };

  const getStatusBadge = (status: Project['status']) => {
    const badgeStyles = {
      active: 'bg-[#ECFDF5] text-[#059669]',
      completed: 'bg-[#F1F5F9] text-[#64748B]',
      on_hold: 'bg-[#FEF9EE] text-[#D97706]',
    };
    const labels = { active: 'aktivní', completed: 'dokončeno', on_hold: 'pozastaveno' };
    
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${badgeStyles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div 
      onClick={() => navigate(`/projects/${project.id}`)}
      className={`rounded-2xl p-5 border border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-md transition-all cursor-pointer flex flex-col group ${getCardBg(project)}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#F1F5F9] rounded-md text-xs font-medium text-[#64748B]">
            {project.code}
          </span>
          {project.project_year && (
            <span className="px-2 py-0.5 bg-[#E0F2FE] rounded-md text-xs font-medium text-[#0369A1]">
              Rok {project.project_year}
            </span>
          )}
        </div>
        {getStatusBadge(project.status)}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-[#0F172A] mb-4 line-clamp-2 group-hover:text-[#5B9AAD] transition-colors min-h-[3rem] leading-normal">
        {project.name}
      </h3>

      {/* Progress */}
      <div className="mb-4 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#64748B]">Čerpání rozpočtu</span>
          <span className="text-sm font-medium text-[#0F172A] tabular-nums">
            {project.budget_usage_percent.toFixed(1)}%
          </span>
        </div>
        <div 
          className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.min(project.budget_usage_percent, 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Čerpání rozpočtu ${project.budget_usage_percent.toFixed(1)}%`}
        >
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              project.budget_usage_percent > 100 ? 'bg-[#DC2626]' : 
              project.budget_usage_percent >= 80 ? 'bg-[#D97706]' : 
              'bg-[#10B981]'
            }`}
            style={{ width: `${Math.min(project.budget_usage_percent, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E2E8F0]">
        <div>
          <p className="text-xs text-[#64748B] mb-0.5">Rozpočet</p>
          <p className="text-sm font-semibold text-[#0F172A] tabular-nums">
            {formatCurrency(project.planned_budget)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#64748B] mb-0.5">Vyčerpáno</p>
          <p className={`text-sm font-semibold tabular-nums ${
            project.budget_usage_percent > 100 ? 'text-[#DC2626]' : 'text-[#0F172A]'
          }`}>
            {formatCurrency(project.total_costs)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
        <FileText size={14} aria-hidden="true" />
        <span>{project.invoice_count} faktur celkem</span>
      </div>
    </div>
  );
};

const NewProjectModal: React.FC<{ onClose: () => void; onSave: () => void; showToast: any }> = ({ onClose, onSave, showToast }) => {
  const [formData, setFormData] = useState({ name: '', code: '', planned_budget: 0, status: 'active' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await createProject(formData);
      if (error) throw error;
      showToast('Projekt vytvořen', 'success');
      onSave();
    } catch (err) {
      showToast('Chyba při vytváření', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/20 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] w-full max-w-xl shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E2E8F0]">
          <h2 id="modal-title" className="text-lg font-semibold text-[#0F172A]">
            Nový projekt
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
            aria-label="Zavřít"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm text-[#64748B] font-medium">
              Název projektu
            </label>
            <input 
              id="name" 
              type="text"
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 focus:bg-white transition-all" 
              placeholder="Zadejte název"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="code" className="text-sm text-[#64748B] font-medium">
                Kód projektu
              </label>
              <input 
                id="code" 
                type="text"
                required 
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value})} 
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 focus:bg-white transition-all" 
                placeholder="Např. PRJ-001"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="budget" className="text-sm text-[#64748B] font-medium">
                Plánovaný rozpočet (Kč)
              </label>
              <input 
                id="budget" 
                type="number" 
                required 
                value={formData.planned_budget} 
                onChange={e => setFormData({...formData, planned_budget: Number(e.target.value)})} 
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 focus:bg-white transition-all" 
              />
            </div>
          </div>
          <div className="flex gap-3 pt-5 mt-5 border-t border-[#E2E8F0]">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2.5 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl text-sm font-medium hover:bg-[#F8FAFC] transition-colors"
            >
              Zrušit
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 py-2.5 bg-[#5B9AAD] text-white rounded-xl text-sm font-medium hover:bg-[#4A8A9D] transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Vytvořit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Projects: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hideEmpty, setHideEmpty] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_dashboard')
        .select('*')
        .order('last_invoice_date', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const years = useMemo(() => {
    const y = projects.map(p => p.project_year).filter((y): y is number => y !== null);
    return Array.from(new Set(y)).sort((a, b) => Number(b) - Number(a));
  }, [projects]);

  const processedProjects = useMemo(() => {
    return projects
      .filter(p => !hideEmpty || p.total_costs > 0 || p.planned_budget > 0)
      .filter(p => !selectedYear || p.project_year === selectedYear)
      .filter(p => !statusFilter || p.status === statusFilter)
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [projects, searchTerm, hideEmpty, selectedYear, statusFilter]);

  const hiddenCount = useMemo(() => {
    if (!hideEmpty) return 0;
    return projects
      .filter(p => !selectedYear || p.project_year === selectedYear)
      .filter(p => !statusFilter || p.status === statusFilter)
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(p => p.total_costs === 0 && p.planned_budget === 0).length;
  }, [projects, hideEmpty, selectedYear, statusFilter, searchTerm]);

  const visibleProjects = useMemo(() => {
    return processedProjects.slice(0, Number(currentPage) * Number(PROJECTS_PER_PAGE));
  }, [processedProjects, currentPage]);

  const hasMore = visibleProjects.length < processedProjects.length;

  const handleLoadMore = () => setCurrentPage(prev => Number(prev) + 1);
  const handleShowAll = () => setCurrentPage(Math.ceil(processedProjects.length / Number(PROJECTS_PER_PAGE)));

  // Consistent button/input styles
  const inputBaseStyle = "h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 focus:bg-white transition-all";
  const selectStyle = `${inputBaseStyle} pr-9 appearance-none cursor-pointer`;

  return (
    <div className="space-y-6 pb-12 animate-in">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} aria-hidden="true" />
          <input
            type="text"
            placeholder="Hledat projekt dle názvu nebo kódu..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className={`${inputBaseStyle} w-full pl-10 pr-4`}
            aria-label="Vyhledat projekt"
          />
        </div>
        
        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hide empty checkbox - FIXED SIZE */}
          <label className={`flex items-center gap-2 ${inputBaseStyle} cursor-pointer hover:border-[#CBD5E1]`}>
            <input
              type="checkbox"
              checked={hideEmpty}
              onChange={(e) => { setHideEmpty(e.target.checked); setCurrentPage(1); }}
              className="w-4 h-4 rounded border-[#CBD5E1] bg-white text-[#5B9AAD] focus:ring-[#5B9AAD] focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-sm font-medium text-[#0F172A] whitespace-nowrap">Skrýt prázdné</span>
          </label>

          {/* Year filter */}
          <div className="relative">
            <select
              value={selectedYear || ''}
              onChange={(e) => { setSelectedYear(e.target.value ? Number(e.target.value) : null); setCurrentPage(1); }}
              className={selectStyle}
              aria-label="Filtrovat podle roku"
            >
              <option value="">Všechny roky</option>
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" size={16} aria-hidden="true" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className={selectStyle}
              aria-label="Filtrovat podle stavu"
            >
              <option value="">Všechny stavy</option>
              <option value="active">Aktivní</option>
              <option value="completed">Dokončené</option>
              <option value="on_hold">Pozastavené</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" size={16} aria-hidden="true" />
          </div>

          {/* New project button */}
          <button 
            onClick={() => setShowNewModal(true)}
            className="flex items-center justify-center gap-2 h-11 px-4 bg-[#5B9AAD] text-white rounded-xl text-sm font-medium hover:bg-[#4A8A9D] focus:ring-2 focus:ring-[#5B9AAD]/50 focus:ring-offset-2 transition-all whitespace-nowrap"
          >
            <Plus size={18} aria-hidden="true" />
            <span>Nový projekt</span>
          </button>
        </div>
      </div>

      {/* Hidden count info */}
      {hideEmpty && hiddenCount > 0 && (
        <p className="text-sm text-[#64748B] flex items-center gap-2">
          <EyeOff size={16} aria-hidden="true" />
          Skryto {hiddenCount} prázdných projektů
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#64748B]">
          <Loader2 className="animate-spin text-[#5B9AAD] mb-4" size={36} />
          <p className="text-sm font-medium">Načítání projektů...</p>
        </div>
      ) : (
        <>
          {visibleProjects.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleProjects.map(p => <ProjectCard key={p.id} project={p} />)}
              </div>

              {/* Pagination */}
              {hasMore && (
                <div className="flex items-center justify-center gap-4 mt-10">
                  <button
                    onClick={handleLoadMore}
                    className="px-6 py-2.5 border border-[#5B9AAD] text-[#5B9AAD] rounded-full text-sm font-medium hover:bg-[#5B9AAD]/5 focus:ring-2 focus:ring-[#5B9AAD]/50 transition-all"
                  >
                    Zobrazit další
                  </button>
                  <span className="text-sm text-[#64748B]">nebo</span>
                  <button
                    onClick={handleShowAll}
                    className="text-sm text-[#5B9AAD] hover:text-[#4A8A9D] underline underline-offset-2 font-medium transition-colors"
                  >
                    Zobrazit všechny ({processedProjects.length})
                  </button>
                </div>
              )}

              {!hasMore && processedProjects.length > PROJECTS_PER_PAGE && (
                <p className="text-center mt-10 text-sm text-[#64748B]">
                  Zobrazeny všechny projekty ({processedProjects.length})
                </p>
              )}
            </>
          ) : (
            <div className="py-16 text-center bg-white rounded-2xl border border-[#E2E8F0] border-dashed">
              <div className="w-16 h-16 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <SearchIcon size={28} className="text-[#94A3B8]" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-1">
                Žádné projekty nenalezeny
              </h3>
              <p className="text-sm text-[#64748B] mb-5">
                Zkuste upravit filtry nebo vytvořte nový projekt.
              </p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedYear(null);
                  setStatusFilter('');
                  setHideEmpty(false);
                  setCurrentPage(1);
                }}
                className="px-5 py-2.5 bg-[#5B9AAD] text-white rounded-xl text-sm font-medium hover:bg-[#4A8A9D] transition-colors"
              >
                Zrušit filtry
              </button>
            </div>
          )}
        </>
      )}

      {showNewModal && <NewProjectModal onClose={() => setShowNewModal(false)} onSave={() => { setShowNewModal(false); fetchProjects(); }} showToast={showToast} />}
      {ToastComponent}
    </div>
  );
};

export default Projects;

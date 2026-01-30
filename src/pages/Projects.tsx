import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Folder, Search, Loader2, TrendingUp, ChevronRight, ChevronDown,
  Calendar, DollarSign, BarChart3, Filter, Plus, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Project } from '../types';
import { formatCurrency } from '../constants';

const ITEMS_PER_PAGE = 50;

/**
 * UNIFIED StatCard - 2026 Enterprise SaaS Daniel Vilim
 */
const ProjectStatCard: React.FC<{
  label: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning';
}> = ({ label, value, subValue, icon: Icon, variant = 'default' }) => {
  const iconStyles = {
    default: 'bg-[#F0F9FF] text-[#5B9AAD]',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${iconStyles[variant]}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="text-[1.05rem] sm:text-[1.15rem] font-semibold text-[#334155] leading-tight">{label}</h4>
        <p className="text-[1.1rem] sm:text-[1.2rem] font-bold text-[#0F172A] tabular-nums">{value}</p>
        {subValue && (
          <p className="text-xs font-semibold text-[#64748B] mt-1">{subValue}</p>
        )}
      </div>
    </div>
  );
};

/**
 * StatusBadge for projects
 */
const ProjectStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    paused: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  const labels: Record<string, string> = {
    active: 'Ve výstavbě',
    completed: 'Dokončeno',
    paused: 'Pozastaveno',
  };
  const dotColors: Record<string, string> = {
    active: 'bg-emerald-500',
    completed: 'bg-blue-500',
    paused: 'bg-amber-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.active}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors.active}`} />
      {labels[status] || 'Aktivní'}
    </span>
  );
};

/**
 * BudgetProgressBar
 */
const BudgetProgressBar: React.FC<{ percent: number }> = ({ percent }) => {
  const getColor = () => {
    if (percent > 90) return 'bg-red-500';
    if (percent > 70) return 'bg-amber-500';
    return 'bg-[#5B9AAD]';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-[#64748B]">Čerpání rozpočtu</span>
        <span className={`text-xs font-bold ${percent > 90 ? 'text-red-600' : percent > 70 ? 'text-amber-600' : 'text-[#0F172A]'}`}>
          {percent.toFixed(1)}%
        </span>
      </div>
      <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
};

/**
 * ProjectCard - Mobile & Grid view
 */
const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-lg hover:border-[#5B9AAD]/30 transition-all cursor-pointer group"
  >
    {/* Header */}
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="px-2 py-0.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md text-xs font-bold text-[#64748B]">
            {project.code}
          </span>
          <ProjectStatusBadge status={project.status} />
        </div>
        <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#5B9AAD] transition-colors line-clamp-2">
          {project.name}
        </h3>
      </div>
      <ChevronRight size={20} className="text-[#CBD5E1] group-hover:text-[#5B9AAD] transition-colors shrink-0 mt-1" />
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Rozpočet</p>
        <p className="text-sm font-bold text-[#0F172A] tabular-nums">{formatCurrency(project.planned_budget)}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Čerpáno</p>
        <p className="text-sm font-bold text-[#5B9AAD] tabular-nums">{formatCurrency(project.total_costs)}</p>
      </div>
    </div>

    {/* Progress */}
    <BudgetProgressBar percent={project.budget_usage_percent} />
  </div>
);

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [hideEmpty, setHideEmpty] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Get available years from projects
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    projects.forEach(p => {
      if (p.created_at) {
        years.add(new Date(p.created_at).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [projects]);

  // Fetch projects with pagination
  const fetchProjects = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;

      // Get total count
      if (reset) {
        const { count } = await supabase
          .from('project_dashboard')
          .select('*', { count: 'exact', head: true });
        setTotalCount(count || 0);
      }

      const { data, error } = await supabase
        .from('project_dashboard')
        .select('*')
        .order('total_costs', { ascending: false })
        .range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1);

      if (error) throw error;

      const newProjects = data || [];

      if (reset) {
        setProjects(newProjects);
      } else {
        setProjects(prev => [...prev, ...newProjects]);
      }

      setHasMore(newProjects.length === ITEMS_PER_PAGE);
      setOffset(currentOffset + newProjects.length);

    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProjects(true);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProjects(false);
    }
  };

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Search filter
      const matchesSearch = 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      // Year filter
      const projectYear = project.created_at ? new Date(project.created_at).getFullYear().toString() : '';
      const matchesYear = yearFilter === 'all' || projectYear === yearFilter;

      // Hide empty filter (projects with 0 costs)
      const matchesEmpty = !hideEmpty || project.total_costs > 0;
      
      return matchesSearch && matchesStatus && matchesYear && matchesEmpty;
    });
  }, [projects, searchTerm, statusFilter, yearFilter, hideEmpty]);

  // Calculate stats from ALL projects (not filtered)
  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    totalBudget: projects.reduce((sum, p) => sum + (p.planned_budget || 0), 0),
    totalSpent: projects.reduce((sum, p) => sum + (p.total_costs || 0), 0),
    avgUtilization: projects.length > 0 
      ? projects.reduce((sum, p) => sum + (p.budget_usage_percent || 0), 0) / projects.length 
      : 0,
  }), [projects]);

  // Handle new project (placeholder - would open modal or navigate)
  const handleNewProject = () => {
    // TODO: Implement new project creation
    alert('Funkce pro vytvoření nového projektu bude dostupná v příští verzi.');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5B9AAD] mb-4" />
        <p className="text-base font-semibold text-[#64748B]">Načítání projektů...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Projekty</h1>
          <p className="text-sm font-medium text-[#64748B] mt-1">
            Celkem {totalCount.toLocaleString('cs-CZ')} projektů v systému
          </p>
        </div>
        <button 
          onClick={handleNewProject}
          className="flex items-center justify-center gap-2 h-11 px-5 bg-[#5B9AAD] text-white rounded-xl text-sm font-semibold hover:bg-[#4A8A9D] transition-all shadow-sm w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Nový projekt</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <ProjectStatCard 
          label="Celkem projektů" 
          value={stats.total.toString()}
          subValue={`${stats.active} aktivních`}
          icon={Folder} 
        />
        <ProjectStatCard 
          label="Celkový rozpočet" 
          value={formatCurrency(stats.totalBudget)}
          icon={DollarSign}
          variant="success"
        />
        <ProjectStatCard 
          label="Celkem čerpáno" 
          value={formatCurrency(stats.totalSpent)}
          icon={TrendingUp}
        />
        <ProjectStatCard 
          label="Prům. využití" 
          value={`${stats.avgUtilization.toFixed(1)}%`}
          icon={BarChart3}
          variant={stats.avgUtilization > 80 ? 'warning' : 'default'}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
            <input
              type="text"
              placeholder="Hledat projekt dle názvu nebo kódu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 h-11 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 focus:bg-white transition-all"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'completed' | 'paused')}
              className="h-11 pl-11 pr-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] focus:bg-white appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="all">Všechny statusy</option>
              <option value="active">Ve výstavbě</option>
              <option value="completed">Dokončeno</option>
              <option value="paused">Pozastaveno</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" size={18} />
          </div>

          {/* Year Filter */}
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" size={16} />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-11 pl-11 pr-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] focus:bg-white appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="all">Všechny roky</option>
              {availableYears.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" size={18} />
          </div>

          {/* Hide Empty Toggle */}
          <button
            onClick={() => setHideEmpty(!hideEmpty)}
            className={`h-11 px-4 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all border ${
              hideEmpty 
                ? 'bg-[#5B9AAD] text-white border-[#5B9AAD]' 
                : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#5B9AAD] hover:text-[#5B9AAD]'
            }`}
          >
            {hideEmpty ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="hidden sm:inline">{hideEmpty ? 'Skryty prázdné' : 'Skrýt prázdné'}</span>
          </button>
        </div>

        {/* Active filters summary */}
        {(statusFilter !== 'all' || yearFilter !== 'all' || hideEmpty || searchTerm) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#E2E8F0] flex-wrap">
            <span className="text-xs font-semibold text-[#64748B]">Aktivní filtry:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-[#F0F9FF] text-[#5B9AAD] rounded-lg text-xs font-semibold">
                Hledání: "{searchTerm}"
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2 py-1 bg-[#F0F9FF] text-[#5B9AAD] rounded-lg text-xs font-semibold">
                Status: {statusFilter === 'active' ? 'Ve výstavbě' : statusFilter === 'completed' ? 'Dokončeno' : 'Pozastaveno'}
              </span>
            )}
            {yearFilter !== 'all' && (
              <span className="px-2 py-1 bg-[#F0F9FF] text-[#5B9AAD] rounded-lg text-xs font-semibold">
                Rok: {yearFilter}
              </span>
            )}
            {hideEmpty && (
              <span className="px-2 py-1 bg-[#F0F9FF] text-[#5B9AAD] rounded-lg text-xs font-semibold">
                Bez prázdných
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setYearFilter('all');
                setHideEmpty(false);
              }}
              className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              Zrušit vše
            </button>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-12 text-center">
          <Folder size={48} className="mx-auto text-[#CBD5E1] mb-4" />
          <p className="text-base font-semibold text-[#64748B]">Žádné projekty nenalezeny</p>
          <p className="text-sm font-medium text-[#94A3B8] mt-1">Zkuste upravit vyhledávání nebo filtry</p>
        </div>
      ) : (
        <>
          {/* Grid for cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>

          {/* Footer with count + Load More */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm px-5 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm font-medium text-[#64748B]">
                Zobrazeno <span className="font-bold text-[#0F172A]">{filteredProjects.length}</span> z <span className="font-bold text-[#0F172A]">{totalCount.toLocaleString('cs-CZ')}</span> projektů
              </p>
              
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center justify-center gap-2 h-10 px-5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#5B9AAD] transition-all disabled:opacity-50 w-full sm:w-auto"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Načítání...</span>
                    </>
                  ) : (
                    <span>Načíst dalších {ITEMS_PER_PAGE}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Projects;

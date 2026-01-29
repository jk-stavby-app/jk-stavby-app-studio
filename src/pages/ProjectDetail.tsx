import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Wallet, TrendingUp, Calendar, Loader2, Home, ChevronRight, Pencil, Check,
  FileText, LayoutDashboard, History, FileCheck, ShieldCheck, MapPin
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { supabase } from '../lib/supabase';
import { budgetService } from '../lib/userService';
import { Project, Invoice } from '../types';
import { formatCurrency, formatDate } from '../constants';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import BudgetHistory from '../components/BudgetHistory';

type TabType = 'overview' | 'history' | 'documents';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile, isAdmin } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { showToast, ToastComponent } = useToast();

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState(0);
  const [budgetReason, setBudgetReason] = useState('');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [projRes, invRes] = await Promise.all([
        supabase.from('project_dashboard').select('*').eq('id', id).single(),
        supabase.from('project_invoices').select('*').eq('project_id', id).order('date_issue', { ascending: true })
      ]);
      if (projRes.data) {
        setProject(projRes.data);
        setBudgetValue(projRes.data.planned_budget || 0);
      }
      setInvoices(invRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSaveBudget = async () => {
    if (!project || !profile) return;
    
    if (budgetValue === project.planned_budget) {
      setIsEditingBudget(false);
      return;
    }

    if (!budgetReason.trim()) {
      showToast('Zadejte důvod změny rozpočtu', 'error');
      return;
    }
    
    setIsSavingBudget(true);
    try {
      await budgetService.updateBudget(
        project.id,
        profile.id,
        project.planned_budget,
        budgetValue,
        budgetReason
      );
      
      await fetchData();
      setIsEditingBudget(false);
      setBudgetReason('');
      showToast('Rozpočet byl úspěšně uložen', 'success');
    } catch (err) {
      console.error('Error saving budget:', err);
      showToast('Chyba při ukládání rozpočtu', 'error');
    } finally {
      setIsSavingBudget(false);
    }
  };

  const chartData = useMemo(() => {
    let sum = 0;
    return invoices.map(inv => {
      sum += inv.total_amount;
      return { date: formatDate(inv.date_issue), total: sum };
    });
  }, [invoices]);

  if (loading || !project) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#5B9AAD]" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in pb-12">
      {/* Breadcrumbs - FIXED: consistent styling, no uppercase, proper truncate */}
      <nav 
        className="flex items-center gap-2 text-sm text-[#64748B]"
        aria-label="Breadcrumb"
      >
        <Link 
          to="/" 
          className="flex items-center gap-1.5 hover:text-[#5B9AAD] transition-colors"
        >
          <Home size={14} aria-hidden="true" />
          <span>Přehled</span>
        </Link>
        <ChevronRight size={14} className="text-[#CBD5E1]" aria-hidden="true" />
        <Link 
          to="/projects" 
          className="hover:text-[#5B9AAD] transition-colors"
        >
          Projekty
        </Link>
        <ChevronRight size={14} className="text-[#CBD5E1]" aria-hidden="true" />
        <span 
          className="text-[#0F172A] font-medium truncate max-w-[200px] sm:max-w-[300px]"
          title={project.name}
        >
          {project.name}
        </span>
      </nav>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5 pb-5 border-b border-[#E2E8F0]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#64748B]">
              {project.code}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              project.status === 'active' ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#F1F5F9] text-[#64748B]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'active' ? 'bg-[#059669]' : 'bg-[#64748B]'}`}></span>
              {project.status === 'active' ? 'Ve výstavbě' : project.status === 'completed' ? 'Dokončeno' : 'Pozastaveno'}
            </span>
          </div>
          <h1 
            className="font-bold text-[#0F172A] tracking-tight"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}
          >
            {project.name}
          </h1>
          <div className="flex items-center gap-4 text-sm text-[#64748B] flex-wrap">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-[#5B9AAD]" aria-hidden="true" />
              Lokalita neuvedena
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#5B9AAD]" aria-hidden="true" />
              Zahájeno 2024
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] w-full lg:w-auto">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={LayoutDashboard} label="Přehled" />
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Audit Log" />
          <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={FileText} label="Dokumentace" />
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Budget Card with Edit */}
            <div className={`bg-white rounded-2xl p-5 border transition-all ${isEditingBudget ? 'border-[#5B9AAD] ring-4 ring-[#5B9AAD]/10' : 'border-[#E2E8F0]'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#64748B]">Smluvní rozpočet</span>
                <div className="flex items-center gap-1">
                  {isAdmin && !isEditingBudget && (
                    <button 
                      onClick={() => setIsEditingBudget(true)} 
                      className="p-1.5 text-[#5B9AAD] hover:bg-[#F0F9FF] rounded-lg transition-colors"
                      aria-label="Upravit rozpočet"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  <div className="w-9 h-9 bg-[#F0F9FF] rounded-xl flex items-center justify-center text-[#5B9AAD]">
                    <Wallet size={18} />
                  </div>
                </div>
              </div>

              {isEditingBudget && isAdmin ? (
                <div className="space-y-3">
                  <input
                    type="number"
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-base text-[#0F172A] font-semibold focus:outline-none focus:border-[#5B9AAD] transition-all"
                    aria-label="Nová hodnota rozpočtu"
                  />
                  <textarea
                    value={budgetReason}
                    onChange={(e) => setBudgetReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all min-h-[70px] resize-none"
                    placeholder="Důvod úpravy rozpočtu..."
                    aria-label="Důvod změny"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setIsEditingBudget(false); setBudgetValue(project.planned_budget); setBudgetReason(''); }} 
                      className="flex-1 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl text-xs font-medium hover:bg-[#F8FAFC]"
                    >
                      Zrušit
                    </button>
                    <button 
                      onClick={handleSaveBudget} 
                      disabled={isSavingBudget} 
                      className="flex-1 py-2 bg-[#5B9AAD] text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1 hover:bg-[#4A8A9D]"
                    >
                      {isSavingBudget ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Uložit
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0F172A] mb-1 tabular-nums">
                    {formatCurrency(project.planned_budget)}
                  </h3>
                  <p className="text-xs text-[#5B9AAD] font-medium flex items-center gap-1">
                    <ShieldCheck size={12} aria-hidden="true" />
                    Schváleno investorem
                  </p>
                </div>
              )}
            </div>

            <StatCard label="Čerpání k dnešku" value={formatCurrency(project.total_costs)} icon={TrendingUp} />
            <StatCard 
              label="Zůstatek financí" 
              value={formatCurrency(project.planned_budget - project.total_costs)} 
              icon={FileCheck} 
              subValue={project.planned_budget > 0 ? `${((project.planned_budget - project.total_costs) / project.planned_budget * 100).toFixed(1)}% zbývá` : undefined} 
            />
            <StatCard 
              label="Efektivita nákladů" 
              value={`${project.budget_usage_percent.toFixed(1)}%`} 
              icon={TrendingUp} 
              isWarning={project.budget_usage_percent > 90} 
            />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#E2E8F0]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <h3 className="text-base font-semibold text-[#0F172A]">Finanční progres stavby</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#5B9AAD]" />
                  <span className="text-xs text-[#64748B]">Skutečnost</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                  <span className="text-xs text-[#64748B]">Limit</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] md:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B9AAD" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#5B9AAD" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 11 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 11 }} 
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #E2E8F0', 
                      backgroundColor: 'white', 
                      fontSize: '13px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }} 
                    formatter={(val: number) => [formatCurrency(val), 'Náklady']}
                  />
                  <ReferenceLine 
                    y={project.planned_budget} 
                    stroke="#DC2626" 
                    strokeDasharray="6 4" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#5B9AAD" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                    animationDuration={1000} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#E2E8F0] animate-in">
          <BudgetHistory projectId={id!} />
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in">
          <DocumentCard title="Projektová dokumentace" count={12} lastUpdate="včera" icon={FileText} />
          <DocumentCard title="Smlouvy a dodatky" count={4} lastUpdate="před 3 dny" icon={ShieldCheck} />
          <DocumentCard title="Stavební deník (Digitální)" count={86} lastUpdate="dnes v 08:30" icon={Check} />
          <div className="lg:col-span-3 py-12 text-center bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] border-dashed">
            <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Správa souborů</p>
            <p className="text-sm text-[#0F172A] mb-5">Modul pro nahrávání dokumentace bude dostupný ve verzi 2.1</p>
            <button 
              disabled 
              className="px-5 py-2.5 bg-[#E2E8F0] text-[#94A3B8] rounded-xl text-sm font-medium cursor-not-allowed"
            >
              Nahrát dokument
            </button>
          </div>
        </div>
      )}

      {ToastComponent}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ElementType; label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 lg:flex-none ${
      active ? 'bg-[#5B9AAD] text-white' : 'text-[#64748B] hover:bg-[#E2E8F0]/50'
    }`}
  >
    <Icon size={16} aria-hidden="true" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const StatCard: React.FC<{ label: string; value: string; icon: React.ElementType; isWarning?: boolean; subValue?: string }> = ({ label, value, icon: Icon, isWarning, subValue }) => (
  <div className={`bg-white rounded-2xl p-5 border transition-all ${isWarning ? 'border-[#FECACA] bg-[#FEF2F2]' : 'border-[#E2E8F0]'}`}>
    <div className="flex items-center justify-between mb-3">
      <span className={`text-xs font-medium ${isWarning ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>{label}</span>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isWarning ? 'bg-[#DC2626] text-white' : 'bg-[#F0F9FF] text-[#5B9AAD]'}`}>
        <Icon size={18} aria-hidden="true" />
      </div>
    </div>
    <div className="space-y-0.5">
      <h3 className={`text-xl font-bold tracking-tight tabular-nums ${isWarning ? 'text-[#DC2626]' : 'text-[#0F172A]'}`}>{value}</h3>
      {subValue && <p className="text-xs text-[#64748B]">{subValue}</p>}
    </div>
  </div>
);

const DocumentCard: React.FC<{ title: string; count: number; lastUpdate: string; icon: React.ElementType }> = ({ title, count, lastUpdate, icon: Icon }) => (
  <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-md transition-all cursor-pointer group">
    <div className="w-10 h-10 bg-[#F0F9FF] text-[#5B9AAD] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#5B9AAD] group-hover:text-white transition-all">
      <Icon size={20} aria-hidden="true" />
    </div>
    <h4 className="text-base font-semibold text-[#0F172A] mb-0.5">{title}</h4>
    <p className="text-sm text-[#64748B] mb-4">{count} dokumentů</p>
    <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
      <span>Poslední změna</span>
      <span className="font-medium">{lastUpdate}</span>
    </div>
  </div>
);

export default ProjectDetail;

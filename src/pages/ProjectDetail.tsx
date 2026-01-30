import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Wallet, TrendingUp, Calendar, Loader2, Home, ChevronRight, Pencil, Check, X,
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

/**
 * UNIFIED StatCard - 2026 Enterprise SaaS
 * Font-weight: minimum 500
 * Gestalt: Proximity - icon grouped with content
 */
const StatCard: React.FC<{ 
  label: string; 
  value: string; 
  icon: React.ElementType; 
  variant?: 'default' | 'warning' | 'success';
  subValue?: string;
}> = ({ label, value, icon: Icon, variant = 'default', subValue }) => {
  const styles = {
    default: {
      card: 'border-[#E2E8F0] bg-white',
      icon: 'bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] text-[#5B9AAD]',
      label: 'text-[#334155]',
      value: 'text-[#0F172A]',
    },
    warning: {
      card: 'border-red-200 bg-red-50/50',
      icon: 'bg-red-100 text-red-600',
      label: 'text-red-700',
      value: 'text-red-700',
    },
    success: {
      card: 'border-emerald-200 bg-emerald-50/50',
      icon: 'bg-emerald-100 text-emerald-600',
      label: 'text-emerald-700',
      value: 'text-emerald-700',
    },
  };

  const s = styles[variant];

  return (
    <div className={`rounded-2xl p-4 sm:p-5 border shadow-sm hover:shadow-md transition-all ${s.card}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${s.icon}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
      <div className="space-y-1">
        <h4 className={`text-[1.05rem] sm:text-[1.15rem] font-semibold leading-tight ${s.label}`}>{label}</h4>
        <p className={`text-[1.1rem] sm:text-[1.2rem] font-bold tabular-nums ${s.value}`}>{value}</p>
        {subValue && (
          <p className="text-xs font-semibold text-[#64748B] mt-1">{subValue}</p>
        )}
      </div>
    </div>
  );
};

/**
 * ProjectStatusBadge
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
 * TabButton
 */
const TabButton: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  label: string;
}> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold transition-all flex-1 lg:flex-none ${
      active 
        ? 'bg-[#5B9AAD] text-white shadow-sm' 
        : 'text-[#64748B] hover:bg-[#E2E8F0]/50 hover:text-[#334155]'
    }`}
  >
    <Icon size={18} />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

/**
 * DocumentCard
 */
const DocumentCard: React.FC<{ 
  title: string; 
  count: number; 
  lastUpdate: string; 
  icon: React.ElementType;
}> = ({ title, count, lastUpdate, icon: Icon }) => (
  <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#5B9AAD]/30 transition-all cursor-pointer group">
    <div className="w-11 h-11 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] text-[#5B9AAD] rounded-xl flex items-center justify-center mb-4 group-hover:from-[#5B9AAD] group-hover:to-[#4A8A9D] group-hover:text-white transition-all shadow-sm">
      <Icon size={20} />
    </div>
    <h4 className="text-base font-bold text-[#0F172A] mb-1">{title}</h4>
    <p className="text-sm font-medium text-[#64748B] mb-4">{count} dokumentů</p>
    <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
      <span className="text-xs font-medium text-[#94A3B8]">Poslední změna</span>
      <span className="text-xs font-semibold text-[#334155]">{lastUpdate}</span>
    </div>
  </div>
);

/**
 * InvoiceCard - Mobile view for invoices
 */
const InvoiceCard: React.FC<{ invoice: Invoice }> = ({ invoice }) => (
  <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm font-bold text-[#0F172A]">{invoice.invoice_number}</p>
      <p className="text-sm font-bold text-[#0F172A] tabular-nums">{formatCurrency(invoice.total_amount)}</p>
    </div>
    <p className="text-sm font-medium text-[#64748B]">{invoice.supplier_name}</p>
    <p className="text-xs font-medium text-[#94A3B8] mt-1">{formatDate(invoice.date_issue)}</p>
  </div>
);

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  useEffect(() => { 
    fetchData(); 
  }, [id]);

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
      await budgetService.updateBudget(project.id, profile.id, project.planned_budget, budgetValue, budgetReason);
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

  const handleCancelEdit = () => {
    setIsEditingBudget(false);
    setBudgetValue(project?.planned_budget || 0);
    setBudgetReason('');
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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5B9AAD] mb-4" />
        <p className="text-base font-semibold text-[#64748B]">Načítání projektu...</p>
      </div>
    );
  }

  const remainingBudget = project.planned_budget - project.total_costs;
  const isOverBudget = project.budget_usage_percent > 90;

  return (
    <div className="space-y-6 animate-in pb-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1.5 text-[#64748B] hover:text-[#5B9AAD] transition-colors font-medium">
          <Home size={14} />
          <span>Přehled</span>
        </Link>
        <ChevronRight size={14} className="text-[#CBD5E1]" />
        <Link to="/projects" className="text-[#64748B] hover:text-[#5B9AAD] transition-colors font-medium">
          Projekty
        </Link>
        <ChevronRight size={14} className="text-[#CBD5E1]" />
        <span className="text-[#0F172A] font-semibold truncate max-w-[200px] sm:max-w-[300px]">
          {project.name}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5 pb-5 border-b border-[#E2E8F0]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#64748B]">
              {project.code}
            </span>
            <ProjectStatusBadge status={project.status} />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0F172A] tracking-tight">
            {project.name}
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-[#64748B] flex-wrap">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-[#5B9AAD]" />
              Lokalita neuvedena
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#5B9AAD]" />
              Zahájeno 2024
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] w-full lg:w-auto">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={LayoutDashboard} label="Přehled" />
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Audit Log" />
          <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={FileText} label="Dokumenty" />
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Budget Card - Editable */}
            <div className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm transition-all ${
              isEditingBudget ? 'border-[#5B9AAD] ring-4 ring-[#5B9AAD]/10' : 'border-[#E2E8F0] hover:shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] rounded-xl flex items-center justify-center text-[#5B9AAD] shadow-sm">
                  <Wallet size={20} />
                </div>
                {isAdmin && !isEditingBudget && (
                  <button 
                    onClick={() => setIsEditingBudget(true)} 
                    className="p-2 text-[#5B9AAD] hover:bg-[#F0F9FF] rounded-lg transition-colors"
                    aria-label="Upravit rozpočet"
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>

              {isEditingBudget && isAdmin ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1 block">Nový rozpočet</label>
                    <input
                      type="number"
                      value={budgetValue}
                      onChange={(e) => setBudgetValue(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-base font-bold text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1 block">Důvod změny</label>
                    <textarea
                      value={budgetReason}
                      onChange={(e) => setBudgetReason(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 min-h-[70px] resize-none"
                      placeholder="Popište důvod úpravy rozpočtu..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCancelEdit} 
                      className="flex-1 h-10 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl text-sm font-semibold hover:bg-[#F8FAFC] transition-all flex items-center justify-center gap-1.5"
                    >
                      <X size={16} />
                      Zrušit
                    </button>
                    <button 
                      onClick={handleSaveBudget} 
                      disabled={isSavingBudget} 
                      className="flex-1 h-10 bg-[#5B9AAD] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-[#4A8A9D] disabled:opacity-50 transition-all"
                    >
                      {isSavingBudget ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Uložit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <h4 className="text-[1.05rem] sm:text-[1.15rem] font-semibold text-[#334155] leading-tight">Smluvní rozpočet</h4>
                  <p className="text-[1.1rem] sm:text-[1.2rem] font-bold text-[#0F172A] tabular-nums">{formatCurrency(project.planned_budget)}</p>
                  <p className="text-xs font-semibold text-[#5B9AAD] flex items-center gap-1 mt-1">
                    <ShieldCheck size={12} />
                    Schváleno investorem
                  </p>
                </div>
              )}
            </div>

            <StatCard 
              label="Čerpání k dnešku" 
              value={formatCurrency(project.total_costs)} 
              icon={TrendingUp} 
            />
            <StatCard 
              label="Zůstatek financí" 
              value={formatCurrency(remainingBudget)} 
              icon={FileCheck}
              variant={remainingBudget < 0 ? 'warning' : 'default'}
              subValue={project.planned_budget > 0 ? `${((remainingBudget / project.planned_budget) * 100).toFixed(1)}% zbývá` : undefined}
            />
            <StatCard 
              label="Efektivita nákladů" 
              value={`${project.budget_usage_percent.toFixed(1)}%`} 
              icon={TrendingUp} 
              variant={isOverBudget ? 'warning' : 'default'}
            />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <h3 className="text-[1.1rem] font-bold text-[#0F172A]">Finanční progres stavby</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#5B9AAD]" />
                  <span className="text-xs font-semibold text-[#64748B]">Skutečnost</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-[#64748B]">Limit</span>
                </div>
              </div>
            </div>
            <div className="h-[280px] sm:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B9AAD" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#5B9AAD" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} 
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} 
                    width={45}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #E2E8F0', 
                      backgroundColor: 'white',
                      fontSize: '13px',
                      fontWeight: 600,
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} 
                    formatter={(val: number) => [formatCurrency(val), 'Náklady']}
                  />
                  <ReferenceLine y={project.planned_budget} stroke="#EF4444" strokeDasharray="6 4" strokeWidth={2} />
                  <Area type="monotone" dataKey="total" stroke="#5B9AAD" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-[1.1rem] font-bold text-[#0F172A]">Poslední faktury</h3>
                <p className="text-sm font-medium text-[#64748B]">Posledních 5 faktur projektu</p>
              </div>
              <button 
                onClick={() => navigate('/invoices')}
                className="text-sm font-semibold text-[#5B9AAD] hover:text-[#4A8A9D] transition-colors"
              >
                Zobrazit vše →
              </button>
            </div>
            
            {invoices.length === 0 ? (
              <div className="p-12 text-center">
                <FileText size={48} className="mx-auto text-[#CBD5E1] mb-4" />
                <p className="text-sm font-semibold text-[#64748B]">Žádné faktury</p>
              </div>
            ) : (
              <>
                {/* MOBILE: Card View */}
                <div className="md:hidden p-4 space-y-3 bg-[#F8FAFC]">
                  {invoices.slice(-5).reverse().map((inv) => (
                    <InvoiceCard key={inv.id} invoice={inv} />
                  ))}
                </div>

                {/* DESKTOP: Table View */}
                <div className="hidden md:block">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#F8FAFC]">
                        <th className="px-5 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">Číslo</th>
                        <th className="px-5 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">Dodavatel</th>
                        <th className="px-5 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">Datum</th>
                        <th className="px-5 py-3 text-right text-xs font-bold text-[#64748B] uppercase tracking-wider">Částka</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {invoices.slice(-5).reverse().map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#FAFBFC] transition-colors">
                          <td className="px-5 py-3.5 text-sm font-bold text-[#0F172A]">{inv.invoice_number}</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-[#64748B]">{inv.supplier_name}</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-[#64748B]">{formatDate(inv.date_issue)}</td>
                          <td className="px-5 py-3.5 text-sm font-bold text-[#0F172A] text-right tabular-nums">{formatCurrency(inv.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm animate-in">
          <BudgetHistory projectId={id!} />
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in">
          <DocumentCard title="Projektová dokumentace" count={12} lastUpdate="včera" icon={FileText} />
          <DocumentCard title="Smlouvy a dodatky" count={4} lastUpdate="před 3 dny" icon={ShieldCheck} />
          <DocumentCard title="Stavební deník" count={86} lastUpdate="dnes" icon={Check} />
          
          <div className="sm:col-span-2 lg:col-span-3 py-12 text-center bg-[#F8FAFC] rounded-2xl border-2 border-dashed border-[#E2E8F0]">
            <FileText size={48} className="mx-auto text-[#CBD5E1] mb-4" />
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Správa souborů</p>
            <p className="text-sm font-medium text-[#64748B] mb-5">Modul pro nahrávání dokumentace bude dostupný ve verzi 2.1</p>
            <button disabled className="px-5 py-2.5 bg-[#E2E8F0] text-[#94A3B8] rounded-xl text-sm font-semibold cursor-not-allowed">
              Nahrát dokument
            </button>
          </div>
        </div>
      )}

      {ToastComponent}
    </div>
  );
};

export default ProjectDetail;

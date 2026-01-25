
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Wallet, TrendingUp, Calendar, Loader2, Home, ChevronRight, Pencil, Check, Clock, Info, 
  ArrowUpRight, ArrowDownRight, FileText, LayoutDashboard, History, FileCheck, ShieldCheck, MapPin, Sparkles, Wand2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { supabase } from '../lib/supabase';
import { budgetService } from '../lib/userService';
import { aiService } from '../lib/aiService';
import { Project, Invoice } from '../types';
import { formatCurrency, formatDate } from '../constants';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import BudgetHistory from '../components/BudgetHistory';

type TabType = 'overview' | 'history' | 'documents' | 'ai';

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

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const runAiAnalysis = async () => {
    if (!project) return;
    setIsAnalyzing(true);
    try {
      const result = await aiService.analyzeProject(project, invoices);
      setAiAnalysis(result);
      showToast('AI analýza dokončena', 'success');
    } catch (err) {
      showToast('Chyba AI analýzy', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  if (loading || !project) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5B9AAD]" size={40} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm font-bold text-[#5C6878] uppercase tracking-wider">
        <Link to="/" className="hover:text-[#5B9AAD] flex items-center gap-1.5 transition-colors"><Home size={14} /> Přehled</Link>
        <ChevronRight size={10} className="text-[#CDD1D6]" />
        <Link to="/projects" className="hover:text-[#5B9AAD] transition-colors">Projekty</Link>
        <ChevronRight size={10} className="text-[#CDD1D6]" />
        <span className="text-[#0F172A] truncate max-w-[200px]">{project.name}</span>
      </nav>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-[#E2E5E9]">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-[#F4F6F8] border border-[#E2E5E9] rounded-xl text-sm font-bold text-[#475569] uppercase tracking-widest">
               {project.code}
             </span>
             <span className={`px-3 py-1 rounded-xl text-sm font-bold uppercase tracking-widest ${
              project.status === 'active' ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#F1F5F9] text-[#475569]'
            }`}>
              {project.status === 'active' ? '● Ve výstavbě' : project.status === 'completed' ? 'Dokončeno' : 'Pozastaveno'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">{project.name}</h1>
          <div className="flex items-center gap-4 text-sm font-medium text-[#475569]">
            <span className="flex items-center gap-1.5"><MapPin size={16} className="text-[#5B9AAD]" /> Lokalita neuvedena</span>
            <span className="flex items-center gap-1.5"><Calendar size={16} className="text-[#5B9AAD]" /> Zahájeno 2024</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-[#F4F6F8] rounded-2xl border border-[#E2E5E9] w-full md:w-auto">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={LayoutDashboard} label="Přehled" />
          <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={Sparkles} label="AI Analýza" />
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Audit Log" />
          <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={FileText} label="Dokumentace" />
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`bg-[#FAFBFC] rounded-3xl p-6 border transition-all ${isEditingBudget ? 'border-[#5B9AAD] ring-8 ring-[#5B9AAD]/5' : 'border-[#E2E5E9]'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#475569] uppercase tracking-widest">Smluvní Rozpočet</span>
                <div className="flex items-center gap-1">
                  {isAdmin && !isEditingBudget && (
                    <button onClick={() => setIsEditingBudget(true)} className="p-2 text-[#5B9AAD] hover:bg-[#E1EFF3] rounded-xl transition-all"><Pencil size={18} /></button>
                  )}
                  <div className="w-10 h-10 bg-[#F0F7F9] rounded-2xl flex items-center justify-center text-[#5B9AAD]"><Wallet size={20} /></div>
                </div>
              </div>

              {isEditingBudget && isAdmin ? (
                <div className="space-y-4">
                  <input
                    type="number"
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-[#E2E5E9] rounded-2xl text-lg text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all font-bold"
                  />
                  <textarea
                    value={budgetReason}
                    onChange={(e) => setBudgetReason(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#E2E5E9] rounded-2xl text-sm text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all min-h-[80px]"
                    placeholder="Důvod úpravy rozpočtu..."
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setIsEditingBudget(false); setBudgetValue(project.planned_budget); setBudgetReason(''); }} className="flex-1 py-2.5 bg-[#FAFBFC] border border-[#E2E5E9] text-[#0F172A] rounded-xl text-xs font-bold uppercase tracking-widest">Zrušit</button>
                    <button onClick={handleSaveBudget} disabled={isSavingBudget} className="flex-1 py-2.5 bg-[#5B9AAD] text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">{isSavingBudget ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Uložit</button>
                  </div>
                </div>
              ) : (
                <div>
                   <h3 className="text-2xl font-bold tracking-tight text-[#0F172A] mb-1">{formatCurrency(project.planned_budget)}</h3>
                   <p className="text-xs font-bold text-[#5B9AAD] uppercase tracking-wider flex items-center gap-1"><ShieldCheck size={12} /> Schváleno investorem</p>
                </div>
              )}
            </div>

            <StatCard label="Čerpání k dnešku" value={formatCurrency(project.total_costs)} icon={TrendingUp} />
            <StatCard label="Zůstatek financí" value={formatCurrency(project.planned_budget - project.total_costs)} icon={FileCheck} subValue={`${((project.planned_budget - project.total_costs) / project.planned_budget * 100).toFixed(1)}% zbývá`} />
            <StatCard label="Efektivita nákladů" value={`${project.budget_usage_percent.toFixed(1)}%`} icon={TrendingUp} isWarning={project.budget_usage_percent > 90} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-[#FAFBFC] rounded-3xl p-8 border border-[#E2E5E9] lg:col-span-2">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">Finanční progres stavby</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#5B9AAD]" />
                      <span className="text-xs font-bold text-[#475569] uppercase">Skutečnost</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#DC2626]" />
                      <span className="text-xs font-bold text-[#475569] uppercase">Limit</span>
                    </div>
                </div>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B9AAD" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#5B9AAD" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E5E9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: '1px solid #E2E5E9', backgroundColor: '#FAFBFC', fontSize: '14px', fontWeight: 'bold', boxShadow: 'none' }} 
                      formatter={(val: any) => [formatCurrency(val), 'Náklady']}
                    />
                    <ReferenceLine y={project.planned_budget} stroke="#DC2626" strokeDasharray="8 6" strokeWidth={2} label={{ value: 'MAX LIMIT', position: 'insideTopRight', fill: '#DC2626', fontSize: 10, fontWeight: '900' }} />
                    <Area type="monotone" dataKey="total" stroke="#5B9AAD" strokeWidth={5} fillOpacity={1} fill="url(#colorTotal)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick AI Preview in Overview */}
            <div className="bg-gradient-to-br from-[#FAFBFC] to-[#F0F7F9] rounded-3xl p-8 border border-[#5B9AAD]/30 relative overflow-hidden flex flex-col justify-center text-center">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#5B9AAD]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-[#5B9AAD]">
                  <Sparkles size={32} />
                </div>
                <h4 className="text-xl font-bold text-[#0F172A]">Potřebujete náhled?</h4>
                <p className="text-sm text-[#475569] font-medium leading-relaxed">
                  Nechte naši AI analyzovat finanční toky této stavby a navrhnout úspory.
                </p>
                <button 
                  onClick={() => setActiveTab('ai')}
                  className="w-full py-4 bg-[#5B9AAD] text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-[#4A8A9D] transition-all flex items-center justify-center gap-2"
                >
                  <Wand2 size={18} />
                  Analyzovat AI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-[#FAFBFC] rounded-3xl p-10 border border-[#E2E5E9] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5B9AAD] via-[#10B981] to-[#5B9AAD] animate-pulse" />
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
                 <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-[#0F172A] flex items-center justify-center md:justify-start gap-3">
                       <Sparkles className="text-[#5B9AAD]" />
                       Smart Project Insights
                    </h3>
                    <p className="text-base font-medium text-[#475569]">Pokročilá analytika nákladů a predikce rizik pomocí Gemini AI</p>
                 </div>
                 <button 
                  onClick={runAiAnalysis}
                  disabled={isAnalyzing}
                  className="px-8 py-4 bg-[#5B9AAD] text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-[#4A8A9D] transition-all disabled:opacity-50 flex items-center gap-3 shadow-lg"
                 >
                   {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                   {isAnalyzing ? 'Provádím audit...' : 'Generovat nový audit'}
                 </button>
              </div>

              {!aiAnalysis && !isAnalyzing && (
                 <div className="text-center py-20 bg-[#F4F6F8] rounded-3xl border border-[#E2E5E9] border-dashed">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-[#CDD1D6] mb-4">
                       <Sparkles size={32} />
                    </div>
                    <p className="text-[#5C6878] font-bold uppercase tracking-widest text-sm">Připraveno k analýze</p>
                    <p className="text-[#0F172A] font-medium mt-1">Klikněte na tlačítko výše pro spuštění AI kontroly stavby.</p>
                 </div>
              )}

              {isAnalyzing && (
                 <div className="space-y-6">
                    <div className="h-6 w-3/4 bg-[#E2E5E9] animate-pulse rounded-lg" />
                    <div className="h-40 w-full bg-[#E2E5E9] animate-pulse rounded-2xl" />
                    <div className="grid grid-cols-3 gap-4">
                       <div className="h-20 bg-[#E2E5E9] animate-pulse rounded-xl" />
                       <div className="h-20 bg-[#E2E5E9] animate-pulse rounded-xl" />
                       <div className="h-20 bg-[#E2E5E9] animate-pulse rounded-xl" />
                    </div>
                 </div>
              )}

              {aiAnalysis && !isAnalyzing && (
                 <div className="prose prose-slate max-w-none prose-p:text-base prose-p:leading-relaxed prose-headings:text-[#0F172A] prose-strong:text-[#5B9AAD] bg-white p-8 rounded-3xl border border-[#E2E5E9] shadow-sm whitespace-pre-wrap font-medium text-[#475569]">
                    {aiAnalysis}
                 </div>
              )}

              <div className="mt-8 flex items-center gap-2 text-xs font-bold text-[#5C6878] uppercase tracking-widest">
                 <Info size={14} className="text-[#5B9AAD]" />
                 AI náhledy jsou generovány na základě dostupných faktur a rozpočtových limitů k dnešnímu dni.
              </div>
           </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-[#FAFBFC] rounded-3xl p-8 border border-[#E2E5E9] animate-in fade-in slide-in-from-bottom-4 duration-500">
           <BudgetHistory projectId={id!} />
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <DocumentCard title="Projektová dokumentace" count={12} lastUpdate="včera" icon={FileText} />
           <DocumentCard title="Smlouvy a dodatky" count={4} lastUpdate="před 3 dny" icon={ShieldCheck} />
           <DocumentCard title="Stavební deník (Digitální)" count={86} lastUpdate="dnes v 08:30" icon={Check} />
           <div className="lg:col-span-3 py-16 text-center bg-[#F8F9FA] rounded-3xl border border-[#E2E5E9] border-dashed">
              <p className="text-[#5C6878] font-bold uppercase tracking-widest text-sm mb-2">Správa souborů</p>
              <p className="text-[#0F172A] font-medium mb-6">Modul pro nahrávání dokumentace bude dostupný ve verzi 2.1</p>
              <button disabled className="px-8 py-3 bg-[#E2E5E9] text-[#5C6878] rounded-2xl text-xs font-bold uppercase tracking-widest cursor-not-allowed">Nahrát dokument</button>
           </div>
        </div>
      )}

      {ToastComponent}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-widest ${
      active ? 'bg-[#5B9AAD] text-white' : 'text-[#475569] hover:bg-[#E2E5E9]/50'
    }`}
  >
    <Icon size={16} />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const StatCard: React.FC<{ label: string; value: string; icon: any; isWarning?: boolean; subValue?: string }> = ({ label, value, icon: Icon, isWarning, subValue }) => (
  <div className={`bg-[#FAFBFC] rounded-3xl p-6 border transition-all ${isWarning ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#E2E5E9]'}`}>
    <div className="flex items-center justify-between mb-4">
      <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isWarning ? 'text-[#DC2626]' : 'text-[#475569]'}`}>{label}</span>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${isWarning ? 'bg-[#DC2626] text-white' : 'bg-[#F0F7F9] text-[#5B9AAD]'}`}>
        <Icon size={18} />
      </div>
    </div>
    <div className="space-y-1">
      <h3 className={`text-2xl font-bold tracking-tight ${isWarning ? 'text-[#DC2626]' : 'text-[#0F172A]'}`}>{value}</h3>
      {subValue && <p className="text-[10px] font-bold text-[#5C6878] uppercase tracking-wider">{subValue}</p>}
    </div>
  </div>
);

const DocumentCard: React.FC<{ title: string; count: number; lastUpdate: string; icon: any }> = ({ title, count, lastUpdate, icon: Icon }) => (
  <div className="bg-[#FAFBFC] p-6 rounded-3xl border border-[#E2E5E9] hover:border-[#5B9AAD]/30 transition-all cursor-pointer group">
     <div className="w-12 h-12 bg-[#F0F7F9] text-[#5B9AAD] rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#5B9AAD] group-hover:text-white transition-all">
        <Icon size={24} />
     </div>
     <h4 className="text-lg font-bold text-[#0F172A] mb-1">{title}</h4>
     <p className="text-sm font-medium text-[#475569] mb-4">{count} dokumentů</p>
     <div className="flex items-center justify-between pt-4 border-t border-[#E2E5E9] text-[10px] font-bold text-[#5C6878] uppercase tracking-widest">
        <span>Poslední změna</span>
        <span>{lastUpdate}</span>
     </div>
  </div>
);

export default ProjectDetail;

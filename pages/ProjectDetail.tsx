import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Wallet, TrendingUp, Calendar, Loader2, Home, ChevronRight, Pencil, Check, Clock, Info, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { supabase } from '../lib/supabase';
import { budgetService } from '../lib/userService';
import { Project, Invoice, BudgetChange } from '../types';
import { formatCurrency, formatDate } from '../constants';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile, isAdmin } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [budgetHistory, setBudgetHistory] = useState<BudgetChange[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast, ToastComponent } = useToast();

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState(0);
  const [budgetReason, setBudgetReason] = useState('');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [projRes, invRes, historyRes] = await Promise.all([
        supabase.from('project_dashboard').select('*').eq('id', id).single(),
        supabase.from('project_invoices').select('*').eq('project_id', id).order('date_issue', { ascending: true }),
        budgetService.getBudgetHistory(id)
      ]);
      if (projRes.data) {
        setProject(projRes.data);
        setBudgetValue(projRes.data.planned_budget || 0);
      }
      setInvoices(invRes.data || []);
      setBudgetHistory(historyRes || []);
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <nav className="flex items-center gap-2 text-base font-medium text-[#475569] leading-relaxed">
        <Link to="/" className="text-[#5B9AAD] hover:text-[#4A8A9D] flex items-center gap-1.5 focus:underline"><Home size={16} /> Přehled</Link>
        <ChevronRight size={12} className="text-[#E2E5E9]" />
        <Link to="/projects" className="text-[#5B9AAD] hover:text-[#4A8A9D] focus:underline">Projekty</Link>
        <ChevronRight size={12} className="text-[#E2E5E9]" />
        <span className="text-[#0F172A] truncate max-w-[200px] font-semibold">{project.name}</span>
      </nav>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-1 tracking-tight">{project.name}</h1>
          <div className="flex items-center gap-3">
            <span className="text-base text-[#475569] font-medium">Interní kód: <span className="text-[#0F172A] font-semibold">{project.code}</span></span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              project.status === 'active' ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#F1F5F9] text-[#475569]'
            }`}>
              {project.status === 'active' ? 'Aktivní stavba' : project.status === 'completed' ? 'Dokončeno' : 'Pozastaveno'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`bg-[#FAFBFC] rounded-2xl p-6 border transition-all ${isEditingBudget ? 'border-[#5B9AAD] ring-4 ring-[#5B9AAD]/10' : 'border-[#E2E5E9]'}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-base text-[#475569] font-bold uppercase tracking-wider">Rozpočet</span>
            <div className="flex items-center gap-2">
              {isAdmin && !isEditingBudget && (
                <button
                  onClick={() => setIsEditingBudget(true)}
                  className="p-2 text-[#5B9AAD] hover:bg-[#E1EFF3] rounded-xl transition-all"
                  aria-label="Upravit rozpočet"
                >
                  <Pencil size={18} />
                </button>
              )}
              <div className="w-10 h-10 bg-[#F0F7F9] rounded-xl flex items-center justify-center text-[#5B9AAD]"><Wallet size={20} /></div>
            </div>
          </div>

          {isEditingBudget && isAdmin ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">Nová částka (Kč)</label>
                <input
                  type="number"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-base text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all font-bold"
                  min={0}
                  step={1000}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">Důvod změny *</label>
                <textarea
                  value={budgetReason}
                  onChange={(e) => setBudgetReason(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] transition-all min-h-[80px]"
                  placeholder="Např. Vícepráce dle dodatku č. 2"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditingBudget(false);
                    setBudgetValue(project.planned_budget || 0);
                    setBudgetReason('');
                  }}
                  className="flex-1 py-2.5 bg-[#FAFBFC] border border-[#E2E5E9] text-[#0F172A] rounded-xl text-sm font-bold hover:bg-[#F4F6F8] transition-colors"
                  disabled={isSavingBudget}
                >
                  Zrušit
                </button>
                <button
                  onClick={handleSaveBudget}
                  disabled={isSavingBudget}
                  className="flex-1 py-2.5 bg-[#5B9AAD] text-[#F8FAFC] rounded-xl text-sm font-bold hover:bg-[#4A8A9D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingBudget ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Uložit
                </button>
              </div>
            </div>
          ) : (
            <h3 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              {formatCurrency(project.planned_budget)}
            </h3>
          )}
        </div>

        <StatCard label="Skutečné náklady" value={formatCurrency(project.total_costs)} icon={TrendingUp} />
        <StatCard 
          label="Zůstatek" 
          value={formatCurrency(project.planned_budget - project.total_costs)} 
          icon={Calendar} 
          subValue={`${((project.planned_budget - project.total_costs) / project.planned_budget * 100).toFixed(1)}% zbývá`}
        />
        <StatCard label="Využití" value={`${project.budget_usage_percent.toFixed(1)}%`} icon={TrendingUp} isWarning={project.budget_usage_percent > 90} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-[#FAFBFC] rounded-2xl p-8 border border-[#E2E5E9] lg:col-span-2">
          <h3 className="text-xl font-bold text-[#0F172A] mb-8 tracking-tight">Kumulativní čerpání</h3>
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
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid #E2E5E9', backgroundColor: '#FAFBFC', fontSize: '14px', fontWeight: 'bold' }} 
                  formatter={(val: any) => [formatCurrency(val), 'Náklady']}
                />
                <ReferenceLine y={project.planned_budget} stroke="#DC2626" strokeDasharray="6 4" label={{ value: 'ROZPOČET', position: 'insideTopRight', fill: '#DC2626', fontSize: 12, fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="total" stroke="#5B9AAD" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#FAFBFC] rounded-2xl border border-[#E2E5E9] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#E2E5E9]">
            <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Clock size={20} className="text-[#5B9AAD]" />
              Historie rozpočtu
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] p-6 space-y-6">
            {budgetHistory.length > 0 ? (
              budgetHistory.map((change, idx) => (
                <div key={change.id} className="relative pl-6 pb-6 last:pb-0">
                  {idx !== budgetHistory.length - 1 && <div className="absolute left-[7px] top-6 bottom-0 w-px bg-[#E2E5E9]" />}
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[#E1EFF3] border-2 border-[#5B9AAD]" />
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-[#0F172A]">{change.admin_name}</p>
                      <span className="text-xs text-[#5C6878] font-medium">{formatDate(change.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded ${
                        change.change_amount > 0 ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#ECFDF5] text-[#059669]'
                      }`}>
                        {change.change_amount > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {formatCurrency(Math.abs(change.change_amount))}
                      </span>
                      <span className="text-xs text-[#5C6878] font-medium">Nový limit: {formatCurrency(change.new_value)}</span>
                    </div>
                    <p className="text-xs text-[#475569] leading-relaxed italic mt-1">"{change.reason || 'Bez udání důvodu'}"</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <Info size={32} className="mx-auto text-[#E2E5E9] mb-3" />
                <p className="text-sm text-[#5C6878] font-medium">Žádné změny v historii</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {ToastComponent}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: any; isWarning?: boolean; subValue?: string }> = ({ label, value, icon: Icon, isWarning, subValue }) => (
  <div className={`bg-[#FAFBFC] rounded-2xl p-6 border transition-all ${isWarning ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#E2E5E9]'}`}>
    <div className="flex items-center justify-between mb-4">
      <span className={`text-xs font-bold uppercase tracking-widest ${isWarning ? 'text-[#DC2626]' : 'text-[#475569]'}`}>{label}</span>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isWarning ? 'bg-[#DC2626] text-white' : 'bg-[#F0F7F9] text-[#5B9AAD]'}`}>
        <Icon size={20} />
      </div>
    </div>
    <div className="space-y-1">
      <h3 className={`text-2xl font-bold tracking-tight ${isWarning ? 'text-[#DC2626]' : 'text-[#0F172A]'}`}>{value}</h3>
      {subValue && <p className="text-xs font-bold text-[#5C6878] uppercase">{subValue}</p>}
    </div>
  </div>
);

export default ProjectDetail;
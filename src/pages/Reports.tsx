import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Calendar, FileText, Loader2, TrendingUp, DollarSign, PieChart as PieIcon } from 'lucide-react';
import { COLORS, formatCurrency } from '../constants';
import { supabase } from '../lib/supabase';
import { Project } from '../types';

interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_budget: number;
  total_spent: number;
  avg_utilization: number;
}

const Reports: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [monthlyInvoices, setMonthlyInvoices] = useState<{date_issue: string, total_amount: number, supplier_name: string}[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchReportData() {
      try {
        setLoading(true);
        
        const [statsRes, projRes, invRes] = await Promise.all([
          // Dashboard stats VIEW
          supabase.from('dashboard_stats').select('*').single(),
          
          // Top 10 projektů - OPRAVA: select('*') místo partial select
          supabase
            .from('project_dashboard')
            .select('*')
            .gt('total_costs', 0)
            .order('total_costs', { ascending: false })
            .limit(10),
          
          // Max 500 faktur pro agregaci
          supabase
            .from('project_invoices')
            .select('date_issue, total_amount, supplier_name')
            .not('project_id', 'is', null)
            .order('date_issue', { ascending: false })
            .limit(500)
        ]);
        
        if (!isMounted) return;
        
        if (statsRes.data) setStats(statsRes.data);
        setProjects(projRes.data || []);
        setMonthlyInvoices(invRes.data || []);
        
      } catch (err) {
        console.error('Reports fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    fetchReportData();
    
    return () => { isMounted = false; };
  }, []);

  const monthlyAggregated = useMemo(() => {
    const months: { [key: string]: number } = {};
    const sortedInvoices = [...monthlyInvoices].sort((a, b) => 
      new Date(a.date_issue).getTime() - new Date(b.date_issue).getTime()
    );
    
    sortedInvoices.forEach(inv => {
      const date = new Date(inv.date_issue);
      const monthLabel = date.toLocaleString('cs-CZ', { month: 'short' });
      months[monthLabel] = (months[monthLabel] || 0) + inv.total_amount;
    });

    return Object.entries(months).map(([month, total]) => ({ month, total }));
  }, [monthlyInvoices]);

  const supplierData = useMemo(() => {
    const suppliers: { [key: string]: number } = {};
    monthlyInvoices.forEach(inv => {
      suppliers[inv.supplier_name] = (suppliers[inv.supplier_name] || 0) + inv.total_amount;
    });
    return Object.entries(suppliers)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [monthlyInvoices]);

  const budgetComparison = useMemo(() => {
    return projects.map(p => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      planned: p.planned_budget,
      actual: p.total_costs
    }));
  }, [projects]);

  const tooltipFormatter = useCallback((value: number) => formatCurrency(value), []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-[#5B9AAD] mb-4" />
        <p className="text-lg font-bold text-[#0F172A] tracking-tight">Připravujeme analytický report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] leading-tight tracking-tight">Obchodní Analytika</h2>
          <p className="text-sm md:text-base font-medium text-[#475569]">Detailní finanční přehled a výkonnost staveb</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-[#FAFBFC] border border-[#E2E5E9] rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-[#0F172A] hover:bg-[#F4F6F8] transition-all uppercase tracking-wider md:tracking-widest min-h-[44px]">
            <Calendar size={18} className="text-[#5B9AAD]" />
            <span className="hidden sm:inline">Období</span> 2026
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-[#5B9AAD] text-[#F8FAFC] rounded-xl md:rounded-2xl text-xs md:text-sm font-bold hover:bg-[#4A8A9D] transition-all uppercase tracking-wider md:tracking-widest min-h-[44px]">
            <FileText size={18} />
            <span className="hidden sm:inline">Stáhnout</span> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <ReportMetric 
          label="Celkové náklady" 
          value={formatCurrency(stats?.total_spent || 0)} 
          icon={DollarSign} 
          trend="+12.4%" 
        />
        <ReportMetric 
          label="Aktivní rozpočty" 
          value={formatCurrency(stats?.total_budget || 0)} 
          icon={TrendingUp} 
        />
        <ReportMetric 
          label="Počet dodavatelů" 
          value={supplierData.length.toString()} 
          icon={PieIcon} 
        />
        <ReportMetric 
          label="Prům. čerpání" 
          value={`${(stats?.avg_utilization || 0).toFixed(1)}%`} 
          icon={TrendingUp} 
          trend="-2.1%" 
          negative 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-[#FAFBFC] rounded-xl md:rounded-2xl p-4 md:p-8 border border-[#E2E5E9]">
          <h3 className="text-lg md:text-xl font-bold text-[#0F172A] mb-6 md:mb-10 tracking-tight">Vývoj finančních toků</h3>
          <div className="h-[250px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyAggregated}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B9AAD" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5B9AAD" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5E9" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} 
                  tickFormatter={(val) => `${(val/1000000).toFixed(1)}M`}
                  width={50}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E5E9', borderRadius: '16px', fontWeight: 'bold' }} 
                  formatter={(value: number) => [tooltipFormatter(value), 'Náklady']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#5B9AAD" 
                  strokeWidth={3} 
                  fill="url(#colorValue)" 
                  animationDuration={1500} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#FAFBFC] rounded-xl md:rounded-2xl p-4 md:p-8 border border-[#E2E5E9]">
          <h3 className="text-lg md:text-xl font-bold text-[#0F172A] mb-6 md:mb-10 tracking-tight">Rozpočet vs. Skutečnost</h3>
          <div className="h-[250px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetComparison} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5E9" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#0F172A', fontSize: 10, fontWeight: 'bold' }} 
                  width={80} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E5E9', borderRadius: '16px', fontWeight: 'bold' }} 
                  formatter={(value: number) => tooltipFormatter(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar dataKey="planned" name="Plán" fill="#E2E5E9" radius={[0, 4, 4, 0]} barSize={16} />
                <Bar dataKey="actual" name="Čerpáno" fill="#5B9AAD" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </d

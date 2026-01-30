import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Calendar, FileText, Loader2, TrendingUp, DollarSign, PieChart as PieIcon } from 'lucide-react';
import { COLORS, formatCurrency } from '../constants';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_budget: number;
  total_spent: number;
  avg_utilization: number;
}

interface ProjectData {
  id: string;
  name: string;
  code: string;
  planned_budget: number;
  total_costs: number;
  budget_usage_percent: number;
}

interface InvoiceData {
  date_issue: string;
  total_amount: number;
  supplier_name: string;
}

interface MonthlyData {
  month: string;
  total: number;
}

interface SupplierData {
  name: string;
  value: number;
}

interface BudgetComparison {
  name: string;
  planned: number;
  actual: number;
}

const Reports: React.FC = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [monthlyInvoices, setMonthlyInvoices] = useState<InvoiceData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchReportData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        
        const [statsRes, projRes, invRes] = await Promise.all([
          supabase.from('dashboard_stats').select('*').single(),
          supabase.from('project_dashboard')
            .select('id, name, code, planned_budget, total_costs, budget_usage_percent')
            .gt('total_costs', 0)
            .order('total_costs', { ascending: false })
            .limit(12),
          supabase.from('project_invoices')
            .select('date_issue, total_amount, supplier_name')
            .not('project_id', 'is', null)
            .order('date_issue', { ascending: false })
            .limit(500)
        ]);
        
        if (!isMounted) return;

        if (statsRes.data) setStats(statsRes.data as DashboardStats);
        if (projRes.data) setProjects(projRes.data as ProjectData[]);
        if (invRes.data) setMonthlyInvoices(invRes.data as InvoiceData[]);
        
      } catch (err) {
        console.error('Reports fetch error:', err);
        if (isMounted) setError('Nepodařilo se načíst data reportů');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchReportData();
    return () => { isMounted = false; };
  }, []);

  const monthlyAggregated = useMemo<MonthlyData[]>(() => {
    if (!monthlyInvoices.length) return [];
    
    const months: Record<string, number> = {};
    const sortedInvoices = [...monthlyInvoices].sort((a, b) => 
      new Date(a.date_issue).getTime() - new Date(b.date_issue).getTime()
    );
    
    sortedInvoices.forEach((inv) => {
      const date = new Date(inv.date_issue);
      const monthLabel = date.toLocaleString('cs-CZ', { month: 'short' });
      months[monthLabel] = (months[monthLabel] || 0) + (inv.total_amount || 0);
    });

    return Object.entries(months).map(([month, total]) => ({ month, total }));
  }, [monthlyInvoices]);

  const supplierData = useMemo<SupplierData[]>(() => {
    if (!monthlyInvoices.length) return [];
    
    const suppliers: Record<string, number> = {};
    monthlyInvoices.forEach((inv) => {
      if (inv.supplier_name) {
        suppliers[inv.supplier_name] = (suppliers[inv.supplier_name] || 0) + (inv.total_amount || 0);
      }
    });
    
    return Object.entries(suppliers)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [monthlyInvoices]);

  const budgetComparison = useMemo<BudgetComparison[]>(() => {
    if (!projects.length) return [];
    return projects.map((p) => ({
      name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
      planned: p.planned_budget || 0,
      actual: p.total_costs || 0
    }));
  }, [projects]);

  const tooltipFormatter = useCallback((value: number): string => formatCurrency(value), []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5B9AAD] mb-4" />
        <p className="text-base font-medium text-[#64748B]">Připravujeme analytický report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-base font-medium text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Obchodní Analytika</h2>
          <p className="text-sm text-[#64748B]">Detailní finanční přehled a výkonnost staveb</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-4 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-all">
            <Calendar size={16} className="text-[#5B9AAD]" />
            <span>Období 2026</span>
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-4 bg-[#5B9AAD] text-white rounded-xl text-sm font-semibold hover:bg-[#4A8A9D] transition-all">
            <FileText size={16} />
            <span>Stáhnout PDF</span>
          </button>
        </div>
      </div>

      {/* Metrics - SPRÁVNÁ HIERARCHIE: Label větší, hodnota pod ním */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportMetric label="Celkové náklady" value={formatCurrency(stats?.total_spent ?? 0)} icon={DollarSign} trend="+12.4%" />
        <ReportMetric label="Aktivní rozpočty" value={formatCurrency(stats?.total_budget ?? 0)} icon={TrendingUp} />
        <ReportMetric label="Počet dodavatelů" value={supplierData.length.toString()} icon={PieIcon} />
        <ReportMetric label="Prům. čerpání" value={`${(stats?.avg_utilization ?? 0).toFixed(1)}%`} icon={TrendingUp} trend="-2.1%" negative />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Area Chart */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]">
          <h3 className="text-base font-semibold text-[#0F172A] mb-5">Vývoj finančních toků</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyAggregated}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B9AAD" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#5B9AAD" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={(val: number) => `${(val / 1000000).toFixed(1)}M`} width={45} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px' }} 
                  formatter={(value: number) => [tooltipFormatter(value), 'Náklady']}
                />
                <Area type="monotone" dataKey="total" stroke="#5B9AAD" strokeWidth={2.5} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - ZVĚTŠENÝ KONTEJNER */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-[#0F172A]">Rozpočet vs. Skutečnost</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#94A3B8]" />
                <span className="text-[#64748B]">Plán</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#5B9AAD]" />
                <span className="text-[#64748B]">Čerpáno</span>
              </div>
            </div>
          </div>
          {/* ZVĚTŠENÝ kontejner - 480px aby se vešlo 12 projektů */}
          <div className="h-[480px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={budgetComparison} 
                layout="vertical" 
                margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#1E3A5F', fontSize: 11, fontWeight: 600 }} 
                  width={95} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px' }} 
                  formatter={(value: number) => tooltipFormatter(value)}
                />
                <Bar dataKey="planned" name="Plán" fill="#94A3B8" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="actual" name="Čerpáno" fill="#5B9AAD" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Suppliers */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]">
        <h3 className="text-base font-semibold text-[#0F172A] mb-5">Klíčoví subdodavatelé</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={supplierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {supplierData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px' }} 
                  formatter={(value: number) => tooltipFormatter(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {supplierData.map((s, idx) => (
              <div key={s.name} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS.chart[idx % COLORS.chart.length] }} />
                  <span className="text-sm font-semibold text-[#0F172A] truncate">{s.name}</span>
                </div>
                <span className="text-sm font-bold text-[#5B9AAD] shrink-0 ml-2 tabular-nums">{formatCurrency(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ReportMetricProps {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  negative?: boolean;
}

/* SPRÁVNÁ HIERARCHIE: Label jako nadpis (větší/výraznější), hodnota pod ním */
const ReportMetric: React.FC<ReportMetricProps> = ({ label, value, icon: Icon, trend, negative }) => (
  <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 bg-[#F0F9FF] text-[#5B9AAD] rounded-xl flex items-center justify-center">
        <Icon size={20} />
      </div>
      {trend && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${negative ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {trend}
        </span>
      )}
    </div>
    <div>
      {/* LABEL - nadpis: větší velikost, výraznější */}
      <h4 className="text-sm font-semibold text-[#475569] mb-1">{label}</h4>
      {/* VALUE - data: největší, bold */}
      <p className="text-xl font-bold text-[#0F172A] tabular-nums">{value}</p>
    </div>
  </div>
);

export default Reports;

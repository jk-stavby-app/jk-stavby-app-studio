import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Calendar, FileText, Loader2, ArrowUpRight, TrendingUp, DollarSign, PieChart as PieIcon } from 'lucide-react';
import { COLORS, formatCurrency } from '../constants';
import { supabase } from '../lib/supabase';
import { Project } from '../types';

const Reports: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [monthlyInvoices, setMonthlyInvoices] = useState<{date_issue: string, total_amount: number, supplier_name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        const [projRes, invRes] = await Promise.all([
          supabase.from('project_dashboard').select('*').gt('total_costs', 0).order('total_costs', { ascending: false }).limit(10),
          supabase.from('project_invoices').select('date_issue, total_amount, supplier_name')
        ]);
        
        setProjects(projRes.data || []);
        setMonthlyInvoices(invRes.data || []);
      } catch (err) {
        console.error('Reports fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportData();
  }, []);

  const monthlyAggregated = useMemo(() => {
    const months: { [key: string]: number } = {};
    const sortedInvoices = [...monthlyInvoices].sort((a, b) => new Date(a.date_issue).getTime() - new Date(b.date_issue).getTime());
    
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-[#5B9AAD] mb-4" />
        <p className="text-lg font-bold text-[#0F172A] tracking-tight">Připravujeme analytický report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#0F172A] leading-tight tracking-tight">Obchodní Analytika</h2>
          <p className="text-base font-medium text-[#475569]">Detailní finanční přehled a výkonnost staveb</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#FAFBFC] border border-[#E2E5E9] rounded-2xl text-sm font-bold text-[#0F172A] hover:bg-[#F4F6F8] transition-all uppercase tracking-widest">
            <Calendar size={18} className="text-[#5B9AAD]" />
            Období 2026
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#5B9AAD] text-[#F8FAFC] rounded-2xl text-sm font-bold hover:bg-[#4A8A9D] transition-all uppercase tracking-widest">
            <FileText size={18} />
            Stáhnout PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ReportMetric label="Celkové náklady" value={formatCurrency(monthlyInvoices.reduce((s, i) => s + i.total_amount, 0))} icon={DollarSign} trend="+12.4%" />
        <ReportMetric label="Aktivní rozpočty" value={formatCurrency(projects.reduce((s, p) => s + p.planned_budget, 0))} icon={TrendingUp} />
        <ReportMetric label="Počet dodavatelů" value={supplierData.length.toString()} icon={PieIcon} />
        <ReportMetric label="Prům. čerpání" value="84.2%" icon={TrendingUp} trend="-2.1%" negative />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#FAFBFC] rounded-2xl p-8 border border-[#E2E5E9]">
          <h3 className="text-xl font-bold text-[#0F172A] mb-10 tracking-tight">Vývoj finančních toků</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyAggregated}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B9AAD" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5B9AAD" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5E9" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 13, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 13, fontWeight: 'bold' }} tickFormatter={(val) => `${(val/1000000).toFixed(1)}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E5E9', borderRadius: '16px', fontWeight: 'bold' }} 
                  formatter={(value: number) => [formatCurrency(value), 'Náklady']}
                />
                <Area type="monotone" dataKey="total" stroke="#5B9AAD" strokeWidth={4} fill="url(#colorValue)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#FAFBFC] rounded-2xl p-8 border border-[#E2E5E9]">
          <h3 className="text-xl font-bold text-[#0F172A] mb-10 tracking-tight">Rozpočet vs. Skutečnost</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetComparison} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5E9" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#0F172A', fontSize: 12, fontWeight: 'bold' }} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E5E9', borderRadius: '16px', fontWeight: 'bold' }} 
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="planned" name="Plán" fill="#E2E5E9" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="actual" name="Čerpáno" fill="#5B9AAD" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-[#FAFBFC] rounded-2xl p-8 border border-[#E2E5E9]">
        <h3 className="text-xl font-bold text-[#0F172A] mb-8 tracking-tight">Klíčoví subdodavatelé</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={supplierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {supplierData.map((_, index) => (
                    <Cell key={index} fill={COLORS.chart[index % COLORS.chart.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E5E9', borderRadius: '16px', fontWeight: 'bold' }} 
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {supplierData.map((s, idx) => (
              <div key={s.name} className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-2xl border border-[#E2E5E9]">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.chart[idx % COLORS.chart.length] }} />
                  <span className="text-base font-bold text-[#0F172A]">{s.name}</span>
                </div>
                <span className="text-base font-bold text-[#5B9AAD]">{formatCurrency(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportMetric: React.FC<{ label: string; value: string; icon: any; trend?: string; negative?: boolean }> = ({ label, value, icon: Icon, trend, negative }) => (
  <div className="bg-[#FAFBFC] p-6 rounded-2xl border border-[#E2E5E9] space-y-4">
    <div className="flex items-center justify-between">
      <div className="w-12 h-12 bg-[#F0F7F9] text-[#5B9AAD] rounded-2xl flex items-center justify-center">
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${negative ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-xs font-bold text-[#5C6878] uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-xl font-bold text-[#0F172A] truncate" title={value}>{value}</h4>
    </div>
  </div>
);

export default Reports;
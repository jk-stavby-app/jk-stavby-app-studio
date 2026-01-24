
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Calendar, FileText, Loader2, ArrowUpRight, TrendingUp } from 'lucide-react';
import { COLORS, formatCurrency } from '../constants';
import { supabase } from '../lib/supabase';
import { Project, Invoice } from '../types';

const Reports: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [monthlyInvoices, setMonthlyInvoices] = useState<{date_issue: string, total_amount: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        const { data: projectsData } = await supabase
          .from('project_dashboard')
          .select('name, planned_budget, total_costs')
          .gt('total_costs', 0)
          .order('total_costs', { ascending: false })
          .limit(10);
        
        const { data: invoicesData } = await supabase
          .from('project_invoices')
          .select('date_issue, total_amount');

        setProjects(projectsData || []);
        setMonthlyInvoices(invoicesData || []);
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
      const monthLabel = new Date(inv.date_issue).toLocaleString('cs-CZ', { month: 'short' });
      months[monthLabel] = (months[monthLabel] || 0) + inv.total_amount;
    });

    return Object.entries(months).map(([month, total]) => ({ month, total }));
  }, [monthlyInvoices]);

  const budgetComparison = useMemo(() => {
    return projects.map(p => ({
      name: p.name,
      planned: p.planned_budget,
      actual: p.total_costs
    }));
  }, [projects]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5B9AAD] mb-4" />
        <p className="text-[#64748B] text-sm md:text-base">Generování reportů...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#0F172A]">Finanční přehled</h2>
          <p className="text-[11px] md:text-sm text-[#64748B]">Analýza nákladů napříč portfoliem</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-[#64748B]">
            <Calendar size={16} />
            Období
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#5B9AAD] text-white rounded-xl text-xs md:text-sm font-semibold shadow-lg shadow-[#5B9AAD]/20">
            <FileText size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Monthly Costs Area Chart */}
        <div className="bento-card p-5 md:p-6 h-[350px] md:h-[450px] flex flex-col">
          <h3 className="text-base md:text-lg font-bold mb-4 md:mb-6">Měsíční náklady (M Kč)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyAggregated}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={(val) => `${(val/1000000).toFixed(1)}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="total" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget vs Actual Comparison */}
        <div className="bento-card p-5 md:p-6 h-[350px] md:h-[450px] flex flex-col">
          <h3 className="text-base md:text-lg font-bold mb-4 md:mb-6">Rozpočet vs. Skutečnost (M Kč)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetComparison} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 9 }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="planned" name="Plán" fill="#94A3B8" radius={[0, 4, 4, 0]} barSize={8} />
                <Bar dataKey="actual" name="Skutečnost" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pb-4">
        <div className="bento-card p-5 md:p-6 bg-emerald-50 border border-emerald-100 flex items-center gap-4">
          <div className="p-2.5 md:p-3 bg-emerald-100 text-emerald-600 rounded-2xl shrink-0">
            <TrendingUp size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Rentabilita</p>
            <h4 className="text-lg md:text-xl font-bold text-emerald-800">14.2%</h4>
          </div>
        </div>
        <div className="bento-card p-5 md:p-6 bg-blue-50 border border-blue-100 flex items-center gap-4">
          <div className="p-2.5 md:p-3 bg-blue-100 text-blue-600 rounded-2xl shrink-0">
            <ArrowUpRight size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-widest mb-0.5">Růst nákladů</p>
            <h4 className="text-lg md:text-xl font-bold text-blue-800">+8.5%</h4>
          </div>
        </div>
        <div className="bento-card p-5 md:p-6 bg-slate-50 border border-slate-100 flex items-center gap-4">
          <div className="p-2.5 md:p-3 bg-slate-200 text-slate-600 rounded-2xl shrink-0">
            <FileText size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-bold text-slate-600 uppercase tracking-widest mb-0.5">Datová báze</p>
            <h4 className="text-lg md:text-xl font-bold text-slate-800">Aktuální</h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

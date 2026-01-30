// Dashboard.tsx - Kompletní přepis podle 2026 Enterprise SaaS standardů Daniel Vilím

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Package, Wallet, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { COLORS, formatCurrency } from '../constants';
import { supabase } from '../lib/supabase';
import { Project, Invoice } from '../types';

interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_budget: number;
  total_spent: number;
  avg_utilization: number;
}

/**
 * UNIFIED StatCard - 2026 Enterprise SaaS
 * Gestalt: Proximity - icon+label grouped, value prominent
 * Font-weight: minimum 500
 * Bento Grid: shadow, border, rounded-2xl
 */
const StatCard: React.FC<{ 
  label: string; 
  value: string; 
  trend?: { val: string; pos: boolean }; 
  icon: React.ElementType;
}> = ({ label, value, trend, icon: Icon }) => (
  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-300">
    {/* Header: Icon + Trend - Gestalt proximity */}
    <div className="flex items-center justify-between mb-4">
      <div className="w-11 h-11 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] rounded-xl flex items-center justify-center text-[#5B9AAD] shadow-sm">
        <Icon size={20} strokeWidth={2} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
          trend.pos 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
            : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {trend.pos ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
          {trend.val}
        </div>
      )}
    </div>
    
    {/* Content: Label + Value - Gestalt proximity */}
    <div className="space-y-1">
      {/* LABEL - nadpis: 1.1-1.2rem, font-semibold (600) */}
      <h4 className="text-[1.05rem] sm:text-[1.15rem] font-semibold text-[#334155] leading-tight">
        {label}
      </h4>
      {/* VALUE - data: slightly smaller, font-bold, high contrast */}
      <p className="text-[1.1rem] sm:text-[1.2rem] font-bold text-[#0F172A] tabular-nums tracking-tight">
        {value}
      </p>
    </div>
    
    {/* Trend context */}
    {trend && (
      <p className="text-xs font-medium text-[#64748B] mt-2">vs minulý měsíc</p>
    )}
  </div>
);

/**
 * StatusBadge - Správné badges místo barevného textu
 */
const StatusBadge: React.FC<{ status: Invoice['payment_status'] }> = ({ status }) => {
  const styles = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
  };
  const labels = { paid: 'Zaplaceno', pending: 'Čekající', overdue: 'Po splatnosti' };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

/**
 * InvoiceCard - Mobile card view (Gestalt: grouping related info)
 */
const InvoiceCard: React.FC<{ invoice: Invoice }> = ({ invoice }) => (
  <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm">
    {/* Header row - číslo + status */}
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#0F172A] truncate">{invoice.invoice_number}</p>
        <p className="text-sm font-medium text-[#64748B] truncate mt-0.5">{invoice.project_name}</p>
      </div>
      <StatusBadge status={invoice.payment_status} />
    </div>
    
    {/* Divider */}
    <div className="border-t border-[#F1F5F9] my-3" />
    
    {/* Footer row - dodavatel + částka */}
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-[#64748B] truncate flex-1">{invoice.supplier_name}</p>
      <p className="text-base font-bold text-[#0F172A] ml-3 tabular-nums">{formatCurrency(invoice.total_amount)}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProjects, setTopProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        const [statsResult, projectsResult, invoicesResult] = await Promise.all([
          supabase.from('dashboard_stats').select('*').single(),
          supabase.from('project_dashboard').select('*').order('total_costs', { ascending: false }).limit(5),
          supabase.from('project_invoices').select('*').not('project_id', 'is', null).order('date_issue', { ascending: false }).limit(5)
        ]);

        if (statsResult.data) setStats(statsResult.data);
        setTopProjects(projectsResult.data || []);
        setInvoices(invoicesResult.data || []);
        
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    return topProjects.map(p => ({ id: p.id, name: p.name, value: p.total_costs }));
  }, [topProjects]);

  const maxVal = useMemo(() => Math.max(...chartData.map(d => d.value), 1), [chartData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5B9AAD] mb-4" />
        <p className="text-base font-semibold text-[#64748B]">Načítání analytiky...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Stats Grid - Bento layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          label="Celkový rozpočet" 
          value={formatCurrency(stats?.total_budget || 0)} 
          icon={Wallet} 
          trend={{ val: '12.5%', pos: true }} 
        />
        <StatCard 
          label="Aktuální náklady" 
          value={formatCurrency(stats?.total_spent || 0)} 
          icon={TrendingUp} 
          trend={{ val: '5.4%', pos: true }} 
        />
        <StatCard 
          label="Aktivní stavby" 
          value={(stats?.active_projects || 0).toString()} 
          icon={Package} 
        />
        <StatCard 
          label="Průměrné čerpání" 
          value={`${(stats?.avg_utilization || 0).toFixed(1)}%`} 
          icon={Users} 
          trend={{ val: '2.1%', pos: false }} 
        />
      </div>

      {/* Charts Section - Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* TOP PROJEKTY - Horizontal Bar Chart (lepší UX než pie) */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[1.1rem] font-bold text-[#0F172A]">Top projekty</h3>
            <span className="text-sm font-semibold text-[#5B9AAD]">Dle nákladů</span>
          </div>
          
          {/* Horizontal bars - lepší čitelnost než pie chart */}
          <div className="space-y-5">
            {chartData.map((item, index) => (
              <div 
                key={item.id} 
                onClick={() => navigate(`/projects/${item.id}`)} 
                className="group cursor-pointer"
              >
                {/* Label + Value row */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm" 
                      style={{ backgroundColor: COLORS.chart[index % COLORS.chart.length] }}
                    />
                    <span className="text-sm font-semibold text-[#1E3A5F] group-hover:text-[#5B9AAD] transition-colors truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#0F172A] shrink-0 tabular-nums">
                    {formatCurrency(item.value)}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ 
                      width: `${Math.min((item.value / maxVal) * 100, 100)}%`,
                      backgroundColor: COLORS.chart[index % COLORS.chart.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer link */}
          <button 
            onClick={() => navigate('/projects')}
            className="w-full mt-6 pt-4 border-t border-[#F1F5F9] text-sm font-semibold text-[#5B9AAD] hover:text-[#4A8A9D] transition-colors text-center"
          >
            Zobrazit všechny projekty →
          </button>
        </div>

        {/* PRŮBĚH ČERPÁNÍ - Compact version */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[1.1rem] font-bold text-[#0F172A]">Průběh čerpání</h3>
            <button 
              onClick={() => navigate('/projects')}
              className="text-sm font-semibold text-[#5B9AAD] hover:text-[#4A8A9D] transition-colors"
            >
              Vše
            </button>
          </div>
          
          <div className="space-y-4">
            {chartData.map((item) => {
              const percent = Math.min((item.value / maxVal) * 100, 100);
              return (
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/projects/${item.id}`)} 
                  className="group cursor-pointer p-3 rounded-xl hover:bg-[#F8FAFC] transition-all"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-bold text-[#1E3A5F] group-hover:text-[#5B9AAD] transition-colors line-clamp-1">
                        {item.name}
                      </span>
                      <span className="text-xs font-medium text-[#94A3B8] block mt-0.5">
                        {percent.toFixed(0)}% z maxima
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#0F172A] shrink-0 tabular-nums">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#5B9AAD] to-[#4A8A9D] rounded-full transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions - Desktop table / Mobile cards */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-5 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-[1.1rem] font-bold text-[#0F172A]">Nedávné transakce</h2>
            <p className="text-sm font-medium text-[#64748B] mt-0.5">Posledních 5 zaúčtovaných faktur</p>
          </div>
          <button 
            onClick={() => navigate('/invoices')} 
            className="h-10 px-4 bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-semibold text-[#0F172A] rounded-xl hover:bg-[#F1F5F9] transition-all w-full sm:w-auto"
          >
            Všechny faktury
          </button>
        </div>
        
        {/* MOBILE: Card View (hidden on md+) */}
        <div className="md:hidden p-4 space-y-3 bg-[#F8FAFC]">
          {invoices.map((inv) => (
            <InvoiceCard key={inv.id} invoice={inv} />
          ))}
        </div>

        {/* DESKTOP: Table View (hidden below md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Identifikátor</th>
                <th className="px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Projekt</th>
                <th className="px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Subdodavatel</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-[#64748B] uppercase tracking-wider">Částka</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-[#64748B] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#FAFBFC] transition-colors">
                  <td className="px-5 py-4 text-sm font-semibold text-[#0F172A]">{inv.invoice_number}</td>
                  <td className="px-5 py-4 text-sm font-medium text-[#334155]">{inv.project_name}</td>
                  <td className="px-5 py-4 text-sm font-medium text-[#64748B]">{inv.supplier_name}</td>
                  <td className="px-5 py-4 text-sm font-bold text-[#0F172A] text-right tabular-nums">
                    {formatCurrency(inv.total_amount)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={inv.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

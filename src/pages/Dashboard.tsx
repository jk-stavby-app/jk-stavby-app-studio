import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Package, Wallet, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
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

/* FIXED: Label as title (larger), value below */
const StatCard: React.FC<{ 
  label: string; 
  value: string; 
  trend?: { val: string; pos: boolean }; 
  icon: React.ElementType;
}> = ({ label, value, trend, icon: Icon }) => (
  <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] transition-all duration-200 hover:shadow-lg hover:shadow-black/5 group">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-semibold text-[#475569]">{label}</span>
      <div className="w-10 h-10 bg-[#F0F9FF] rounded-xl flex items-center justify-center text-[#5B9AAD] group-hover:bg-[#5B9AAD] group-hover:text-white transition-all duration-300">
        <Icon size={20} aria-hidden="true" />
      </div>
    </div>
    <div>
      <p className="text-2xl font-bold text-[#0F172A] tracking-tight tabular-nums">{value}</p>
      {trend && (
        <div className="flex items-center gap-2 mt-2">
          <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-semibold ${
            trend.pos ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'
          }`}>
            {trend.pos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend.val}
          </span>
          <span className="text-xs text-[#94A3B8]">vs m. měsíc</span>
        </div>
      )}
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

  const getStatusBadge = (status: Invoice['payment_status']) => {
    const styles = {
      paid: 'bg-[#ECFDF5] text-[#059669]',
      pending: 'bg-[#FEF9EE] text-[#D97706]',
      overdue: 'bg-[#FEF2F2] text-[#DC2626]',
    };
    const labels = { paid: 'Zaplaceno', pending: 'Čekající', overdue: 'Po splatnosti' };
    return <span className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${styles[status]}`}>{labels[status]}</span>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#64748B]">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#5B9AAD]" />
        <p className="text-base font-medium">Načítání analytiky...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Celkový rozpočet" value={formatCurrency(stats?.total_budget || 0)} icon={Wallet} trend={{ val: '12.5%', pos: true }} />
        <StatCard label="Aktuální náklady" value={formatCurrency(stats?.total_spent || 0)} icon={TrendingUp} trend={{ val: '5.4%', pos: true }} />
        <StatCard label="Aktivní stavby" value={(stats?.active_projects || 0).toString()} icon={Package} />
        <StatCard label="Průměrné čerpání" value={`${(stats?.avg_utilization || 0).toFixed(1)}%`} icon={Users} trend={{ val: '2.1%', pos: false }} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-[#0F172A]">Top projekty</h3>
            <span className="text-xs font-medium text-[#5B9AAD]">Dle nákladů</span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius="50%" outerRadius="75%" paddingAngle={4} dataKey="value" stroke="none">
                  {chartData.map((_, index) => <Cell key={index} fill={COLORS.chart[index % COLORS.chart.length]} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px' }} 
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                  formatter={(value) => <span className="text-[#64748B]">{value.length > 18 ? `${value.substring(0, 18)}...` : value}</span>} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress Bars - FIXED: Dark blue project names */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#0F172A]">Průběh čerpání u klíčových staveb</h3>
            <button 
              onClick={() => navigate('/projects')}
              className="text-xs font-medium text-[#5B9AAD] hover:text-[#4A8A9D] transition-colors"
            >
              Vše
            </button>
          </div>
          <div className="space-y-5">
            {chartData.map((item) => (
              <div key={item.id} onClick={() => navigate(`/projects/${item.id}`)} className="group cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    {/* FIXED: Dark blue color #1E3A5F for project names */}
                    <span className="text-sm font-semibold text-[#1E3A5F] group-hover:text-[#5B9AAD] transition-colors truncate">
                      {item.name}
                    </span>
                    <span className="text-xs text-[#94A3B8]">V projektu od 2024</span>
                  </div>
                  <span className="text-sm font-bold text-[#0F172A] shrink-0 tabular-nums">{formatCurrency(item.value)}</span>
                </div>
                <div className="relative w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#5B9AAD] to-[#4A8A9D] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((item.value / maxVal) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-5 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">Nedávné transakce</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">Posledních 5 zaúčtovaných faktur</p>
          </div>
          <button 
            onClick={() => navigate('/invoices')} 
            className="h-10 px-4 bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-medium text-[#0F172A] rounded-xl hover:bg-[#F1F5F9] transition-all w-full sm:w-auto"
          >
            Všechny faktury
          </button>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-[#F1F5F9]">
          {invoices.map((inv) => (
            <div key={inv.id} className="p-4 hover:bg-[#FAFBFC] transition-colors">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#0F172A] truncate">{inv.invoice_number}</p>
                  <p className="text-xs text-[#64748B] truncate">{inv.project_name}</p>
                </div>
                {getStatusBadge(inv.payment_status)}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-[#94A3B8] truncate flex-1">{inv.supplier_name}</p>
                <p className="text-sm font-bold text-[#0F172A] ml-2 tabular-nums">{formatCurrency(inv.total_amount)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#FAFBFC]">
                <th scope="col" className="px-5 py-3 text-xs font-semibold text-[#64748B]">Identifikátor</th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold text-[#64748B]">Položka / Projekt</th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold text-[#64748B]">Subdodavatel</th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-semibold text-[#64748B]">Finální částka</th>
                <th scope="col" className="px-5 py-3 text-center text-xs font-semibold text-[#64748B]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#FAFBFC] transition-colors">
                  <td className="px-5 py-4 text-sm text-[#0F172A] font-medium">{inv.invoice_number}</td>
                  <td className="px-5 py-4 text-sm text-[#0F172A]">{inv.project_name}</td>
                  <td className="px-5 py-4 text-sm text-[#64748B]">{inv.supplier_name}</td>
                  <td className="px-5 py-4 text-sm text-[#0F172A] text-right font-semibold tabular-nums">{formatCurrency(inv.total_amount)}</td>
                  <td className="px-5 py-4 text-center">{getStatusBadge(inv.payment_status)}</td>
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

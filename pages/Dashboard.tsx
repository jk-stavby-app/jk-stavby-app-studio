
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Package, Wallet, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import { COLORS, formatCurrency } from '../constants';
import { supabase } from '../lib/supabase';
import { Project, Invoice } from '../types';

const StatCard: React.FC<{ 
  label: string; 
  value: string; 
  trend?: { val: string; pos: boolean }; 
  icon: any; 
  highlight?: boolean 
}> = ({ label, value, trend, icon: Icon, highlight }) => (
  <div className={`rounded-2xl p-6 border transition-all duration-300 ${
    highlight 
      ? 'bg-gradient-to-br from-[#5B9AAD] to-[#7CB0C2] text-white border-[#5B9AAD] shadow-lg shadow-[#5B9AAD]/20' 
      : 'bg-[#FAFBFC] border-[#E2E8F0] text-[#0F172A]'
  }`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-2xl ${highlight ? 'bg-white/20' : 'bg-[#5B9AAD]/10 text-[#5B9AAD]'}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${trend.pos ? (highlight ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600') : (highlight ? 'bg-white/10' : 'bg-rose-50 text-rose-600')}`}>
          {trend.pos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend.val}
        </div>
      )}
    </div>
    <p className={`text-base font-medium ${highlight ? 'text-white/80' : 'text-[#64748B]'} mb-1`}>{label}</p>
    <h3 className="text-2xl font-bold truncate">{value}</h3>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const MONO_BLUES = ['#5B9AAD', '#72A9BD', '#89B9CE', '#A1C8DE', '#B8D8EF'];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: projectsData, error: projectsError } = await supabase
          .from('project_dashboard')
          .select('*');
        
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('project_invoices')
          .select('*')
          .order('date_issue', { ascending: false })
          .limit(5);

        if (projectsError) throw projectsError;
        if (invoicesError) throw invoicesError;

        setProjects(projectsData || []);
        setInvoices(invoicesData || []);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError('Nepodařilo se načíst data z databáze.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalBudget = projects.reduce((sum, p) => sum + (p.planned_budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.total_costs || 0), 0);
    const activeCount = projects.filter(p => p.status === 'active').length;
    const avgUtilization = projects.length > 0 
      ? projects.reduce((sum, p) => sum + (p.budget_usage_percent || 0), 0) / projects.length 
      : 0;
    
    return { totalBudget, totalSpent, activeCount, avgUtilization };
  }, [projects]);

  const chartData = useMemo(() => {
    return projects
      .slice()
      .sort((a, b) => b.total_costs - a.total_costs)
      .slice(0, 5)
      .map(p => ({ 
        id: p.id, 
        name: p.name, 
        value: p.total_costs 
      }));
  }, [projects]);

  const maxVal = useMemo(() => {
    return Math.max(...chartData.map(d => d.value), 1);
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#64748B]">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#5B9AAD]" />
        <p className="font-medium text-lg">Načítání dat...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          label="Rozpočet projektů" 
          value={formatCurrency(stats.totalBudget)} 
          icon={Wallet} 
          highlight 
          trend={{ val: '+12%', pos: true }}
        />
        <StatCard 
          label="Celkem vyčerpáno" 
          value={formatCurrency(stats.totalSpent)} 
          icon={TrendingUp} 
          trend={{ val: '+5.4%', pos: true }}
        />
        <StatCard 
          label="Aktivní projekty" 
          value={stats.activeCount.toString()} 
          icon={Package} 
        />
        <StatCard 
          label="Průměrné vytížení" 
          value={`${stats.avgUtilization.toFixed(1)}%`} 
          icon={Users} 
          trend={{ val: '-2.1%', pos: false }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Distribution Chart */}
        <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E8F0] lg:col-span-1">
          <h3 className="text-xl font-bold mb-6 text-[#0F172A]">Rozdělení nákladů</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MONO_BLUES[index % MONO_BLUES.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '14px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-base">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MONO_BLUES[idx % MONO_BLUES.length] }}></div>
                  <span className="text-[#64748B] truncate max-w-[150px]">{item.name}</span>
                </div>
                <span className="font-semibold text-[#0F172A]">{(item.value / 1000000).toFixed(1)}M</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Projects Custom Bar List (Interactive Rows) */}
        <div className="bg-[#FAFBFC] rounded-2xl p-8 border border-[#E2E8F0] lg:col-span-2">
          <h3 className="text-xl font-bold mb-8 text-[#0F172A]">Největší projekty dle nákladů</h3>
          <div className="space-y-4">
            {chartData.map((item) => (
              <div 
                key={item.id}
                onClick={() => navigate(`/projects/${item.id}`)}
                className="group cursor-pointer hover:bg-slate-50 rounded-2xl p-4 -mx-4 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#5B9AAD]/30 focus-visible:ring-offset-2 outline-none"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[16px] font-semibold text-slate-800 group-hover:text-[#5B9AAD] transition-colors truncate max-w-[70%]">
                    {item.name}
                  </span>
                  <span className="text-[14px] font-bold text-[#475569] whitespace-nowrap">
                    {formatCurrency(item.value)}
                  </span>
                </div>
                <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-[#5B9AAD] rounded-full transition-all duration-1000 ease-out group-hover:bg-[#4A8A9D] group-hover:shadow-[0_0_8px_rgba(91,154,173,0.4)]"
                    style={{ width: `${(item.value / maxVal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {chartData.length === 0 && (
              <div className="py-20 text-center text-slate-400 font-medium italic">
                Žádná data k zobrazení
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-[#FAFBFC] rounded-2xl border border-[#E2E8F0] overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#0F172A]">Nedávné faktury</h3>
          <button onClick={() => navigate('/invoices')} className="text-[#5B9AAD] font-semibold text-base hover:underline">Zobrazit vše</button>
        </div>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="text-xs font-semibold text-[#64748B] uppercase tracking-wider border-b border-slate-100 pb-4">
                <th className="px-4 py-3 sticky left-0 bg-[#FAFBFC]">Číslo</th>
                <th className="px-4 py-3">Projekt</th>
                <th className="px-4 py-3">Dodavatel</th>
                <th className="px-4 py-3">Částka</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-5 text-base font-medium text-[#0F172A] sticky left-0 bg-[#FAFBFC] group-hover:bg-slate-50/50">{inv.invoice_number}</td>
                  <td className="px-4 py-5 text-base text-[#475569]">{inv.project_name}</td>
                  <td className="px-4 py-5 text-base text-[#475569]">{inv.supplier_name}</td>
                  <td className="px-4 py-5 text-base font-semibold text-[#0F172A]">{formatCurrency(inv.total_amount)}</td>
                  <td className="px-4 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
                      inv.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                      inv.payment_status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {inv.payment_status === 'paid' ? 'Zaplaceno' : inv.payment_status === 'pending' ? 'Čekající' : 'Po splatnosti'}
                    </span>
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

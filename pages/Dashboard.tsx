import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Package, Wallet, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { COLORS, formatCurrency } from '../constants';
import { supabase } from '../lib/supabase';
import { Project, Invoice } from '../types';

const StatCard: React.FC<{ 
  label: string; 
  value: string; 
  trend?: { val: string; pos: boolean }; 
  icon: any;
}> = ({ label, value, trend, icon: Icon }) => (
  <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E5E9] transition-all hover:border-[#CDD1D6] group">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-bold text-[#475569] uppercase tracking-wider">{label}</span>
      <div className="w-12 h-12 bg-[#F0F7F9] rounded-2xl flex items-center justify-center text-[#5B9AAD] group-hover:bg-[#5B9AAD] group-hover:text-[#F8FAFC] transition-all duration-300">
        <Icon size={24} aria-hidden="true" />
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-3xl font-bold text-[#0F172A] tracking-tight">{value}</p>
      {trend && (
        <div className="flex items-center gap-1.5 pt-1">
          <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-sm font-bold ${
            trend.pos ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'
          }`}>
            {trend.pos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend.val}
          </span>
          <span className="text-sm text-[#5C6878] font-medium">vs m. měsíc</span>
        </div>
      )}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: projectsData } = await supabase.from('project_dashboard').select('*');
        const { data: invoicesData } = await supabase
          .from('project_invoices')
          .select('*')
          .order('date_issue', { ascending: false })
          .limit(5);

        setProjects(projectsData || []);
        setInvoices(invoicesData || []);
      } catch (err) {
        console.error('Fetch error:', err);
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

  const getStatusBadge = (status: Invoice['payment_status']) => {
    const styles = {
      paid: 'bg-[#ECFDF5] text-[#059669] border-[#059669]/20',
      pending: 'bg-[#FEF9EE] text-[#D97706] border-[#D97706]/20',
      overdue: 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/20',
    };
    const labels = {
      paid: 'Zaplaceno',
      pending: 'Čekající',
      overdue: 'Neuhrazeno'
    };
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#475569]">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#5B9AAD]" />
        <p className="text-lg font-semibold tracking-tight">Načítání analytiky...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Celkový rozpočet" value={formatCurrency(stats.totalBudget)} icon={Wallet} trend={{ val: '12.5%', pos: true }} />
        <StatCard label="Aktuální náklady" value={formatCurrency(stats.totalSpent)} icon={TrendingUp} trend={{ val: '5.4%', pos: true }} />
        <StatCard label="Aktivní stavby" value={stats.activeCount.toString()} icon={Package} />
        <StatCard label="Průměrné čerpání" value={`${stats.avgUtilization.toFixed(1)}%`} icon={Users} trend={{ val: '2.1%', pos: false }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-[#FAFBFC] rounded-2xl p-8 border border-[#E2E5E9] lg:col-span-1">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">Top projekty</h3>
            <span className="text-sm font-semibold text-[#5B9AAD] uppercase tracking-wider">Dle nákladů</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS.chart[index % COLORS.chart.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FAFBFC', 
                    border: '1px solid #E2E5E9', 
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#0F172A',
                    boxShadow: 'none'
                  }} 
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  formatter={(value) => <span className="text-sm font-bold text-[#475569] hover:text-[#0F172A] transition-colors">{value}</span>} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#FAFBFC] rounded-2xl p-8 border border-[#E2E5E9] lg:col-span-2">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">Průběh čerpání u klíčových staveb</h3>
            <button 
              onClick={() => navigate('/projects')}
              className="text-sm font-bold text-[#5B9AAD] uppercase tracking-widest hover:text-[#4A8A9D] transition-colors"
            >
              Zobrazit vše
            </button>
          </div>
          <div className="space-y-8">
            {chartData.map((item) => (
              <div 
                key={item.id}
                onClick={() => navigate(`/projects/${item.id}`)}
                className="group cursor-pointer"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-[#0F172A] group-hover:text-[#5B9AAD] transition-colors truncate max-w-[300px]">
                      {item.name}
                    </span>
                    <span className="text-xs font-bold text-[#5C6878] uppercase tracking-wider">V projektu od 2024</span>
                  </div>
                  <span className="text-lg font-bold text-[#0F172A]">
                    {formatCurrency(item.value)}
                  </span>
                </div>
                <div className="relative w-full h-3 bg-[#E2E5E9] rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-[#5B9AAD] rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                    style={{ width: `${(item.value / maxVal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#FAFBFC] rounded-2xl border border-[#E2E5E9] overflow-hidden">
        <div className="flex justify-between items-center p-8 border-b border-[#E2E5E9]">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">Nedávné transakce</h2>
            <p className="text-sm font-medium text-[#5C6878] mt-1">Posledních 5 zaúčtovaných faktur</p>
          </div>
          <button 
            onClick={() => navigate('/invoices')} 
            className="px-6 py-2.5 bg-[#F8F9FA] border border-[#E2E5E9] text-sm font-bold text-[#0F172A] rounded-xl hover:bg-[#E2E5E9] transition-all uppercase tracking-widest"
          >
            Všechny faktury
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E2E5E9]">
                <th scope="col" className="px-8 py-5 text-xs font-bold text-[#475569] uppercase tracking-widest">Identifikátor</th>
                <th scope="col" className="px-8 py-5 text-xs font-bold text-[#475569] uppercase tracking-widest">Položka / Projekt</th>
                <th scope="col" className="px-8 py-5 text-xs font-bold text-[#475569] uppercase tracking-widest">Subdodavatel</th>
                <th scope="col" className="px-8 py-5 text-right text-xs font-bold text-[#475569] uppercase tracking-widest">Finální částka</th>
                <th scope="col" className="px-8 py-5 text-center text-xs font-bold text-[#475569] uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E5E9]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F8F9FA] transition-colors border-b border-[#E2E5E9] group">
                  <td className="px-8 py-5 text-base text-[#0F172A] font-bold">{inv.invoice_number}</td>
                  <td className="px-8 py-5 text-base text-[#0F172A] font-medium">{inv.project_name}</td>
                  <td className="px-8 py-5 text-base text-[#475569] font-medium">{inv.supplier_name}</td>
                  <td className="px-8 py-5 text-base text-[#0F172A] text-right font-bold">{formatCurrency(inv.total_amount)}</td>
                  <td className="px-8 py-5 text-center">
                    {getStatusBadge(inv.payment_status)}
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
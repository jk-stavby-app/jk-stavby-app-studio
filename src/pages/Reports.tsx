import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Calendar, Download, Loader2, TrendingUp, DollarSign, PieChart as PieIcon, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { COLORS, formatCurrency } from '../constants';
import { supabase } from '../lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

/**
 * UNIFIED ReportMetric - 2026 Enterprise SaaS
 * Font-weight: minimum 500
 * Gestalt: Proximity - icon grouped with content
 */
const ReportMetric: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: { val: string; pos: boolean };
}> = ({ label, value, icon: Icon, trend }) => (
  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="w-11 h-11 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] rounded-xl flex items-center justify-center text-[#5B9AAD] shadow-sm">
        <Icon size={20} strokeWidth={2} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
          trend.pos 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {trend.pos ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
          {trend.val}
        </div>
      )}
    </div>
    <div className="space-y-1">
      <h4 className="text-[1.05rem] sm:text-[1.15rem] font-semibold text-[#334155] leading-tight">{label}</h4>
      <p className="text-[1.1rem] sm:text-[1.2rem] font-bold text-[#0F172A] tabular-nums">{value}</p>
    </div>
  </div>
);

/**
 * SupplierCard - Mobile card for suppliers
 */
const SupplierCard: React.FC<{ supplier: SupplierData; index: number }> = ({ supplier, index }) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div 
        className="w-4 h-4 rounded-full shrink-0 shadow-sm" 
        style={{ backgroundColor: COLORS.chart[index % COLORS.chart.length] }} 
      />
      <span className="text-sm font-semibold text-[#0F172A] truncate">{supplier.name}</span>
    </div>
    <span className="text-sm font-bold text-[#5B9AAD] shrink-0 ml-3 tabular-nums">
      {formatCurrency(supplier.value)}
    </span>
  </div>
);

const Reports: React.FC = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [monthlyInvoices, setMonthlyInvoices] = useState<InvoiceData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

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
            .limit(10),
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

  // PDF Export function
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const element = reportRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#F8FAFC'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42);
      pdf.text('JK Stavby - Obchodní Analytika', 14, 15);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Vygenerováno: ${new Date().toLocaleDateString('cs-CZ', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 14, 22);
      
      let heightLeft = imgHeight;
      let position = 30;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `JK-Stavby-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Chyba při generování PDF. Zkuste to prosím znovu.');
    } finally {
      setIsExporting(false);
    }
  };

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
      .slice(0, 6);
  }, [monthlyInvoices]);

  const budgetComparison = useMemo<BudgetComparison[]>(() => {
    if (!projects.length) return [];
    return projects.slice(0, 8).map((p) => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      planned: p.planned_budget || 0,
      actual: p.total_costs || 0
    }));
  }, [projects]);

  const tooltipFormatter = useCallback((value: number): string => formatCurrency(value), []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5B9AAD] mb-4" />
        <p className="text-base font-semibold text-[#64748B]">Připravujeme analytický report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-base font-semibold text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Obchodní analytika</h1>
          <p className="text-sm font-medium text-[#64748B] mt-1">Detailní finanční přehled a výkonnost staveb</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-4 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-all shadow-sm">
            <Calendar size={18} className="text-[#5B9AAD]" />
            <span>2026</span>
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-5 bg-[#5B9AAD] text-white rounded-xl text-sm font-semibold hover:bg-[#4A8A9D] transition-all shadow-sm disabled:opacity-70"
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Generuji...</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>Stáhnout PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report content - captured for PDF */}
      <div ref={reportRef} className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <ReportMetric 
            label="Celkové náklady" 
            value={formatCurrency(stats?.total_spent ?? 0)} 
            icon={DollarSign} 
            trend={{ val: '12.4%', pos: true }}
          />
          <ReportMetric 
            label="Aktivní rozpočty" 
            value={formatCurrency(stats?.total_budget ?? 0)} 
            icon={TrendingUp}
          />
          <ReportMetric 
            label="Počet dodavatelů" 
            value={supplierData.length.toString()} 
            icon={Users}
          />
          <ReportMetric 
            label="Prům. čerpání" 
            value={`${(stats?.avg_utilization ?? 0).toFixed(1)}%`} 
            icon={PieIcon}
            trend={{ val: '2.1%', pos: false }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Area Chart - Finanční toky */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1.1rem] font-bold text-[#0F172A]">Vývoj finančních toků</h3>
              <span className="text-sm font-semibold text-[#5B9AAD]">Měsíční přehled</span>
            </div>
            <div className="h-[280px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyAggregated}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B9AAD" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#5B9AAD" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} 
                    tickFormatter={(val: number) => `${(val / 1000000).toFixed(1)}M`} 
                    width={50} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E2E8F0', 
                      borderRadius: '12px', 
                      fontSize: '13px',
                      fontWeight: 600,
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} 
                    formatter={(value: number) => [tooltipFormatter(value), 'Náklady']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#5B9AAD" 
                    strokeWidth={3} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Horizontal Bar Chart - Rozpočet vs Skutečnost */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1.1rem] font-bold text-[#0F172A]">Rozpočet vs. skutečnost</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#94A3B8]" />
                  <span className="text-xs font-semibold text-[#64748B]">Plán</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#5B9AAD]" />
                  <span className="text-xs font-semibold text-[#64748B]">Čerpáno</span>
                </div>
              </div>
            </div>
            <div className="h-[280px] sm:h-[320px]">
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
                    width={100} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E2E8F0', 
                      borderRadius: '12px', 
                      fontSize: '13px',
                      fontWeight: 600,
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} 
                    formatter={(value: number) => tooltipFormatter(value)}
                  />
                  <Bar dataKey="planned" name="Plán" fill="#94A3B8" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="actual" name="Čerpáno" fill="#5B9AAD" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Suppliers Section */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[1.1rem] font-bold text-[#0F172A]">Klíčoví subdodavatelé</h3>
            <span className="text-sm font-semibold text-[#5B9AAD]">Top {supplierData.length}</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Pie Chart - Desktop only */}
            <div className="hidden lg:block h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supplierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {supplierData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E2E8F0', 
                      borderRadius: '12px', 
                      fontSize: '13px',
                      fontWeight: 600 
                    }} 
                    formatter={(value: number) => tooltipFormatter(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Supplier list - Mobile + Desktop */}
            <div className="space-y-3 lg:col-span-1">
              {supplierData.map((s, idx) => (
                <SupplierCard key={s.name} supplier={s} index={idx} />
              ))}
            </div>
          </div>
        </div>

        {/* Project Performance Table */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0]">
            <h3 className="text-[1.1rem] font-bold text-[#0F172A]">Výkonnost projektů</h3>
            <p className="text-sm font-medium text-[#64748B] mt-1">Detailní přehled čerpání rozpočtů</p>
          </div>
          
          {/* MOBILE: Card View */}
          <div className="lg:hidden p-4 space-y-3 bg-[#F8FAFC]">
            {projects.slice(0, 6).map((project) => (
              <div key={project.id} className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0F172A] truncate">{project.name}</p>
                    <p className="text-xs font-semibold text-[#64748B] mt-0.5">{project.code}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    project.budget_usage_percent > 90 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : project.budget_usage_percent > 70 
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {project.budget_usage_percent.toFixed(0)}%
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-[#F1F5F9]">
                  <div>
                    <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Rozpočet</p>
                    <p className="text-sm font-bold text-[#0F172A] tabular-nums">{formatCurrency(project.planned_budget)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Čerpáno</p>
                    <p className="text-sm font-bold text-[#5B9AAD] tabular-nums">{formatCurrency(project.total_costs)}</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        project.budget_usage_percent > 90 
                          ? 'bg-red-500' 
                          : project.budget_usage_percent > 70 
                            ? 'bg-amber-500'
                            : 'bg-[#5B9AAD]'
                      }`}
                      style={{ width: `${Math.min(project.budget_usage_percent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP: Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Projekt</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Kód</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-[#64748B] uppercase tracking-wider">Rozpočet</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-[#64748B] uppercase tracking-wider">Čerpáno</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-[#64748B] uppercase tracking-wider">Zbývá</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold text-[#64748B] uppercase tracking-wider">Využití</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {projects.slice(0, 8).map((project) => (
                  <tr key={project.id} className="hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-5 py-4 text-sm font-bold text-[#0F172A]">{project.name}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#64748B]">{project.code}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#334155] text-right tabular-nums">
                      {formatCurrency(project.planned_budget)}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-[#5B9AAD] text-right tabular-nums">
                      {formatCurrency(project.total_costs)}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#64748B] text-right tabular-nums">
                      {formatCurrency(project.planned_budget - project.total_costs)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        project.budget_usage_percent > 90 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : project.budget_usage_percent > 70 
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {project.budget_usage_percent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

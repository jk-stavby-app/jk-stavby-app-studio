import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Clock, CheckCircle2, AlertCircle, Search, Download, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Invoice } from '../types';
import { formatCurrency, formatDate } from '../constants';

const ITEMS_PER_PAGE = 50;

/**
 * UNIFIED StatCard - 2026 Enterprise SaaS Daniel Vilim
 */
const InvoiceStatCard: React.FC<{
  label: string;
  value: string;
  count: string;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}> = ({ label, value, count, icon: Icon, variant = 'default' }) => {
  const iconStyles = {
    default: 'bg-[#F0F9FF] text-[#5B9AAD]',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${iconStyles[variant]}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
        <span className="text-xs font-semibold text-[#64748B] bg-[#F8FAFC] px-2 py-1 rounded-lg">{count}</span>
      </div>
      <div className="space-y-1">
        <h4 className="text-[1.05rem] sm:text-[1.15rem] font-semibold text-[#334155] leading-tight">{label}</h4>
        <p className="text-[1.1rem] sm:text-[1.2rem] font-bold text-[#0F172A] tabular-nums">{value}</p>
      </div>
    </div>
  );
};

/**
 * StatusBadge
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
 * InvoiceCard - Mobile card view
 */
const InvoiceCard: React.FC<{ invoice: Invoice }> = ({ invoice }) => (
  <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#0F172A] truncate">{invoice.invoice_number}</p>
        <p className="text-sm font-medium text-[#64748B] truncate mt-0.5">{invoice.project_name}</p>
      </div>
      <StatusBadge status={invoice.payment_status} />
    </div>
    
    <div className="border-t border-[#F1F5F9] my-3" />
    
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Dodavatel</p>
        <p className="text-sm font-medium text-[#64748B] truncate">{invoice.supplier_name}</p>
      </div>
      <div className="text-right ml-3">
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Částka</p>
        <p className="text-base font-bold text-[#0F172A] tabular-nums">{formatCurrency(invoice.total_amount)}</p>
      </div>
    </div>
    
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F1F5F9]">
      <span className="text-xs font-medium text-[#64748B]">Vystaveno</span>
      <span className="text-xs font-semibold text-[#334155]">{formatDate(invoice.date_issue)}</span>
    </div>
  </div>
);

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Initial fetch
  useEffect(() => {
    fetchInvoices(true);
  }, []);

  const fetchInvoices = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;

      // Get count first
      if (reset) {
        const { count } = await supabase
          .from('project_invoices')
          .select('*', { count: 'exact', head: true })
          .not('project_id', 'is', null);
        setTotalCount(count || 0);
      }

      const { data, error } = await supabase
        .from('project_invoices')
        .select('*')
        .not('project_id', 'is', null)
        .order('date_issue', { ascending: false })
        .range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1);

      if (error) throw error;

      const newInvoices = data || [];
      
      if (reset) {
        setInvoices(newInvoices);
      } else {
        setInvoices(prev => [...prev, ...newInvoices]);
      }

      setHasMore(newInvoices.length === ITEMS_PER_PAGE);
      setOffset(currentOffset + newInvoices.length);

    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchInvoices(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = 
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filter === 'all' || inv.payment_status === filter;
      
      return matchesSearch && matchesFilter;
    });
  }, [invoices, searchTerm, filter]);

  const stats = useMemo(() => ({
    total: { count: invoices.length, amount: invoices.reduce((s, i) => s + i.total_amount, 0) },
    paid: { count: invoices.filter(i => i.payment_status === 'paid').length, amount: invoices.filter(i => i.payment_status === 'paid').reduce((s, i) => s + i.total_amount, 0) },
    pending: { count: invoices.filter(i => i.payment_status === 'pending').length, amount: invoices.filter(i => i.payment_status === 'pending').reduce((s, i) => s + i.total_amount, 0) },
    overdue: { count: invoices.filter(i => i.payment_status === 'overdue').length, amount: invoices.filter(i => i.payment_status === 'overdue').reduce((s, i) => s + i.total_amount, 0) },
  }), [invoices]);

  /**
   * Export CSV - s českými znaky (BOM)
   */
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) return;

    // CSV headers
    const headers = ['Číslo faktury', 'Projekt', 'Dodavatel', 'Datum vystavení', 'Částka', 'Status'];
    
    // CSV rows
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      inv.project_name || '',
      inv.supplier_name || '',
      formatDate(inv.date_issue),
      inv.total_amount.toString(),
      inv.payment_status === 'paid' ? 'Zaplaceno' : inv.payment_status === 'pending' ? 'Čekající' : 'Po splatnosti'
    ]);

    // Combine headers and rows with semicolon separator (Excel friendly)
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    // Add BOM for Czech characters in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `faktury-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5B9AAD] mb-4" />
        <p className="text-base font-semibold text-[#64748B]">Načítání faktur...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Faktury</h1>
          <p className="text-sm font-medium text-[#64748B] mt-1">
            Celkem {totalCount.toLocaleString('cs-CZ')} faktur v systému
          </p>
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={filteredInvoices.length === 0}
          className="flex items-center justify-center gap-2 h-11 px-5 bg-[#5B9AAD] text-white rounded-xl text-sm font-semibold hover:bg-[#4A8A9D] transition-all shadow-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} />
          <span>Export CSV ({filteredInvoices.length})</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <InvoiceStatCard 
          label="Fakturováno" 
          value={formatCurrency(stats.total.amount)} 
          count={`${stats.total.count} ks`}
          icon={FileText} 
        />
        <InvoiceStatCard 
          label="Uhrazeno" 
          value={formatCurrency(stats.paid.amount)} 
          count={`${stats.paid.count} ks`}
          icon={CheckCircle2}
          variant="success"
        />
        <InvoiceStatCard 
          label="Čekající" 
          value={formatCurrency(stats.pending.amount)} 
          count={`${stats.pending.count} ks`}
          icon={Clock}
          variant="warning"
        />
        <InvoiceStatCard 
          label="Po splatnosti" 
          value={formatCurrency(stats.overdue.amount)} 
          count={`${stats.overdue.count} ks`}
          icon={AlertCircle}
          variant="danger"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
          <input
            type="text"
            placeholder="Hledat dle čísla, projektu nebo dodavatele..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 h-11 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all"
          />
        </div>
        
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'paid' | 'pending' | 'overdue')}
            className="h-11 pl-4 pr-10 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#5B9AAD] appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="all">Všechny statusy</option>
            <option value="paid">Zaplaceno</option>
            <option value="pending">Čekající</option>
            <option value="overdue">Po splatnosti</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" size={18} />
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        
        {/* MOBILE: Card View */}
        <div className="md:hidden p-4 space-y-3 bg-[#F8FAFC]">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-semibold text-[#64748B]">Žádné faktury nenalezeny</p>
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <InvoiceCard key={inv.id} invoice={inv} />
            ))
          )}
        </div>

        {/* DESKTOP: Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Číslo faktury</th>
                <th className="px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Projekt</th>
                <th className="px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Dodavatel</th>
                <th className="px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Vystaveno</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-[#64748B] uppercase tracking-wider">Částka</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-[#64748B] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-sm font-semibold text-[#64748B]">Žádné faktury nenalezeny</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-5 py-4 text-sm font-bold text-[#0F172A]">{inv.invoice_number}</td>
                    <td className="px-5 py-4 text-sm font-medium text-[#334155]">{inv.project_name}</td>
                    <td className="px-5 py-4 text-sm font-medium text-[#64748B]">{inv.supplier_name}</td>
                    <td className="px-5 py-4 text-sm font-medium text-[#64748B]">{formatDate(inv.date_issue)}</td>
                    <td className="px-5 py-4 text-sm font-bold text-[#0F172A] text-right tabular-nums">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={inv.payment_status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer with count + Load More */}
        <div className="px-5 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-[#64748B]">
              Zobrazeno <span className="font-bold text-[#0F172A]">{filteredInvoices.length}</span> z <span className="font-bold text-[#0F172A]">{totalCount.toLocaleString('cs-CZ')}</span> faktur
            </p>
            
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center justify-center gap-2 h-10 px-5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#5B9AAD] transition-all disabled:opacity-50 w-full sm:w-auto"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Načítání...</span>
                  </>
                ) : (
                  <span>Načíst dalších {ITEMS_PER_PAGE}</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices;

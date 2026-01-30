import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Download, Loader2, CheckCircle, Clock, AlertCircle, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Invoice } from '../types';
import { formatCurrency, formatDate } from '../constants';

/**
 * UNIFIED StatCard pro Invoices
 * Label: 1.125rem (18px), font-semibold (600)
 * Value: 1rem (16px), font-medium (500)
 */
const InvoiceStatCard: React.FC<{
  label: string;
  value: string;
  count: string;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}> = ({ label, value, count, icon: Icon, variant = 'default' }) => {
  const iconStyles = {
    default: 'bg-[#F1F5F9] text-[#64748B]',
    success: 'bg-[#D1FAE5] text-[#059669]',
    warning: 'bg-[#FEF3C7] text-[#D97706]',
    danger: 'bg-[#FEE2E2] text-[#DC2626]',
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0]">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${iconStyles[variant]}`}>
          <Icon size={18} aria-hidden="true" />
        </div>
        <span className="text-[11px] font-medium text-[#94A3B8]">{count}</span>
      </div>
      <div>
        {/* Label - NADPIS: 1.1-1.2rem, font-semibold */}
        <h4 className="text-[1.1rem] sm:text-[1.2rem] font-semibold text-[#1E293B] leading-tight mb-1">{label}</h4>
        {/* Value - DATA: 1rem, font-medium */}
        <p className="text-base font-medium text-[#475569] tabular-nums">{value}</p>
      </div>
    </div>
  );
};

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'project' | 'all_invoices'>('project');

  useEffect(() => {
    async function fetchInvoices() {
      try {
        setLoading(true);
        let query = supabase
          .from('project_invoices')
          .select('*')
          .order('date_issue', { ascending: false });

        if (filter === 'project') {
          query = query.not('project_id', 'is', null);
        }

        const { data, error } = await query;
        if (error) throw error;
        setInvoices(data || []);
      } catch (err) {
        console.error('Error fetching invoices:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, [filter]);

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const term = searchTerm.toLowerCase();
    return invoices.filter(inv => 
      inv.invoice_number?.toLowerCase().includes(term) ||
      inv.project_name?.toLowerCase().includes(term) ||
      inv.supplier_name?.toLowerCase().includes(term)
    );
  }, [invoices, searchTerm]);

  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const paid = invoices.filter(inv => inv.payment_status === 'paid');
    const pending = invoices.filter(inv => inv.payment_status === 'pending');
    const overdue = invoices.filter(inv => inv.payment_status === 'overdue');
    
    return {
      total: { amount: total, count: invoices.length },
      paid: { amount: paid.reduce((s, i) => s + (i.total_amount || 0), 0), count: paid.length },
      pending: { amount: pending.reduce((s, i) => s + (i.total_amount || 0), 0), count: pending.length },
      overdue: { amount: overdue.reduce((s, i) => s + (i.total_amount || 0), 0), count: overdue.length },
    };
  }, [invoices]);

  const getStatusBadge = (status: Invoice['payment_status']) => {
    const config = {
      paid: { bg: 'bg-[#ECFDF5]', text: 'text-[#059669]', label: 'Zaplaceno' },
      pending: { bg: 'bg-[#FEF9EE]', text: 'text-[#D97706]', label: 'Čekající' },
      overdue: { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', label: 'Po splatnosti' },
    };
    const { bg, text, label } = config[status];
    return <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${bg} ${text}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5B9AAD] mb-4" />
        <p className="text-base font-medium text-[#64748B]">Načítání faktur...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Přehled faktur</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setFilter(filter === 'project' ? 'all_invoices' : 'project')}
            className={`flex-1 sm:flex-none h-11 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              filter === 'project' 
                ? 'bg-[#5B9AAD] text-white' 
                : 'bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            Projektové faktury
          </button>
          <button 
            onClick={() => setFilter(filter === 'all_invoices' ? 'project' : 'all_invoices')}
            className={`flex-1 sm:flex-none h-11 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              filter === 'all_invoices' 
                ? 'bg-[#5B9AAD] text-white' 
                : 'bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            Všechny faktury
          </button>
          <button className="h-11 px-4 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-all flex items-center gap-2">
            <Download size={16} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stats - UNIFIED */}
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
          icon={CheckCircle} 
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
        <input
          type="text"
          placeholder="Hledat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 pl-11 pr-4 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#5B9AAD] focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {/* Mobile */}
        <div className="md:hidden divide-y divide-[#F1F5F9]">
          {filteredInvoices.slice(0, 20).map((inv) => (
            <div key={inv.id} className="p-4 hover:bg-[#FAFBFC] transition-colors">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#0F172A] truncate">{inv.invoice_number}</p>
                  <p className="text-xs text-[#64748B] truncate">{inv.project_name || 'Bez projektu'}</p>
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

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#FAFBFC]">
                <th className="px-5 py-3 text-xs font-semibold text-[#64748B]">Faktura</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#64748B]">Přiřazení / Dodavatel</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#64748B]">Částka</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#64748B]">Vystaveno</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#64748B]">Stav</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredInvoices.slice(0, 50).map((inv) => (
                <tr key={inv.id} className="hover:bg-[#FAFBFC] transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-[#0F172A]">{inv.invoice_number}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-[#0F172A]">{inv.project_name || 'Bez projektu'}</p>
                    <p className="text-xs text-[#64748B]">{inv.supplier_name}</p>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#0F172A] tabular-nums">
                    {formatCurrency(inv.total_amount)}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#64748B]">
                    {formatDate(inv.date_issue)}
                  </td>
                  <td className="px-5 py-4">
                    {getStatusBadge(inv.payment_status)}
                  </td>
                  <td className="px-5 py-4">
                    <button className="p-2 text-[#64748B] hover:text-[#5B9AAD] hover:bg-[#F0F9FF] rounded-lg transition-all">
                      <Download size={16} />
                    </button>
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

export default Invoices;

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Clock, CheckCircle2, AlertCircle, Search, Download, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Invoice } from '../types';
import { formatCurrency, formatDate } from '../constants';

const InvoiceStat: React.FC<{ label: string; value: string; count: number; color: string; icon: React.ElementType }> = ({ label, value, count, color, icon: Icon }) => (
  <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E5E9]">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <span className="text-sm text-[#475569] font-medium leading-normal">{count} ks</span>
    </div>
    <p className="text-base text-[#475569] leading-relaxed mb-1">{label}</p>
    <p className="text-2xl font-semibold text-[#0F172A] tracking-tight truncate" title={value}>{value}</p>
  </div>
);

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllInvoices, setShowAllInvoices] = useState(false);

  const fetchInvoices = async (all: boolean) => {
    try {
      setLoading(true);
      let query = supabase
        .from('project_invoices')
        .select('*')
        .order('date_issue', { ascending: false });

      if (!all) {
        query = query.not('project_id', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
    } catch (err: unknown) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(showAllInvoices);
  }, [showAllInvoices]);

  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
    const paidAmount = invoices.filter(i => i.payment_status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0);
    const pendingAmount = invoices.filter(i => i.payment_status === 'pending').reduce((s, i) => s + (i.total_amount || 0), 0);
    const overdueAmount = invoices.filter(i => i.payment_status === 'overdue').reduce((s, i) => s + (i.total_amount || 0), 0);

    return { 
      total: invoices.length, 
      paid: invoices.filter(i => i.payment_status === 'paid').length, 
      pending: invoices.filter(i => i.payment_status === 'pending').length, 
      overdue: invoices.filter(i => i.payment_status === 'overdue').length, 
      totalAmount, paidAmount, pendingAmount, overdueAmount 
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => 
      i.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const getStatusBadge = (status: Invoice['payment_status']) => {
    const styles = {
      paid: 'bg-[#ECFDF5] text-[#059669]',
      pending: 'bg-[#FEF9EE] text-[#D97706]',
      overdue: 'bg-[#FEF2F2] text-[#DC2626]',
    };
    const labels = {
      paid: 'Zaplaceno',
      pending: 'Čekající',
      overdue: 'Po splatnosti'
    };
    return (
      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = ['Číslo faktury', 'Projekt', 'Dodavatel', 'Částka', 'Splatnost', 'Stav'];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      inv.project_name || 'Režie',
      inv.supplier_name,
      inv.total_amount,
      formatDate(inv.date_issue),
      inv.payment_status === 'paid' ? 'Zaplaceno' : inv.payment_status === 'pending' ? 'Čekající' : 'Po splatnosti'
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `faktury-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-2xl font-semibold text-[#0F172A] leading-tight">Přehled faktur</h1>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Invoice type toggle - segmented control */}
          <div className="inline-flex p-1 bg-[#F4F6F8] rounded-xl border border-[#E2E5E9]">
            <button
              onClick={() => setShowAllInvoices(false)}
              className={`px-4 py-2.5 min-h-[40px] rounded-lg text-base font-semibold transition-all ${
                !showAllInvoices 
                  ? 'bg-[#5B9AAD] text-[#F8FAFC]' 
                  : 'bg-transparent text-[#475569] hover:text-[#0F172A] hover:bg-[#FAFBFC]'
              }`}
            >
              Projektové faktury
            </button>
            <button
              onClick={() => setShowAllInvoices(true)}
              className={`px-4 py-2.5 min-h-[40px] rounded-lg text-base font-semibold transition-all ${
                showAllInvoices 
                  ? 'bg-[#5B9AAD] text-[#F8FAFC]' 
                  : 'bg-transparent text-[#475569] hover:text-[#0F172A] hover:bg-[#FAFBFC]'
              }`}
            >
              Všechny faktury
            </button>
          </div>

          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FAFBFC] border border-[#E2E5E9] text-[#0F172A] rounded-xl font-medium text-base hover:bg-[#FDFDFE] hover:border-[#CDD1D6] focus:ring-2 focus:ring-[#5B9AAD]/50 transition-colors w-full sm:w-auto leading-relaxed min-h-[44px]"
          >
            <Download size={18} aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="relative w-full">
        <label htmlFor="search-invoices" className="sr-only">Hledat v fakturách</label>
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#475569]" size={20} aria-hidden="true" />
        <input
          id="search-invoices"
          type="text"
          placeholder="Hledat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-[#FAFBFC] border border-[#E2E5E9] rounded-2xl outline-none text-base text-[#0F172A] placeholder-[#5C6878] focus:border-[#5B9AAD] transition-all font-medium leading-relaxed min-h-[44px]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <InvoiceStat label="Fakturováno" value={formatCurrency(stats.totalAmount)} count={stats.total} color="bg-[#F8F9FA] text-[#475569]" icon={FileText} />
        <InvoiceStat label="Uhrazeno" value={formatCurrency(stats.paidAmount)} count={stats.paid} color="bg-[#ECFDF5] text-[#059669]" icon={CheckCircle2} />
        <InvoiceStat label="Čekající" value={formatCurrency(stats.pendingAmount)} count={stats.pending} color="bg-[#FEF9EE] text-[#D97706]" icon={Clock} />
        <InvoiceStat label="Po splatnosti" value={formatCurrency(stats.overdueAmount)} count={stats.overdue} color="bg-[#FEF2F2] text-[#DC2626]" icon={AlertCircle} />
      </div>

      <div className="bg-[#FAFBFC] rounded-2xl border border-[#E2E5E9] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#475569]">
            <Loader2 className="w-12 h-12 animate-spin text-[#5B9AAD] mb-4" />
            <p className="font-medium text-lg leading-normal">Aktualizace dat...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]" role="table">
              <thead>
                <tr className="bg-[#F4F6F8] border-b border-[#E2E5E9]">
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Faktura</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Přiřazení / Dodavatel</th>
                  <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-[#475569]">Částka</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Vystaveno</th>
                  <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-[#475569]">Stav</th>
                  <th scope="col" className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E5E9]">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F8F9FA] transition-colors group">
                    <td className="px-6 py-4 text-base text-[#0F172A] font-semibold leading-relaxed">{inv.invoice_number}</td>
                    <td className="px-6 py-4">
                      {inv.project_id ? (
                        <div className="text-base text-[#0F172A] font-semibold truncate max-w-[200px] mb-0.5 leading-relaxed">{inv.project_name}</div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-[#F8F9FA] text-[#475569] text-xs font-semibold rounded tracking-normal border border-[#E2E5E9] mb-1 leading-normal">Režie</span>
                      )}
                      <div className="text-base text-[#475569] truncate max-w-[200px] leading-relaxed">{inv.supplier_name}</div>
                    </td>
                    <td className="px-6 py-4 text-base text-[#0F172A] text-right font-semibold leading-relaxed">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-6 py-4 text-base text-[#0F172A] leading-relaxed">{formatDate(inv.date_issue)}</td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(inv.payment_status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-3 min-h-[44px] min-w-[44px] text-[#475569] rounded-xl font-medium hover:bg-[#E2E5E9]/50 hover:text-[#0F172A] transition-colors" aria-label="Stáhnout fakturu">
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;

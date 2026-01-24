
import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Clock, CheckCircle2, AlertCircle, Search, Download, Loader2, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Invoice } from '../types';
import { formatCurrency, formatDate } from '../constants';

const InvoiceStat: React.FC<{ label: string; value: string; count: number; color: string; icon: any }> = ({ label, value, count, color, icon: Icon }) => (
  <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E8F0]">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-2xl ${color}`}>
        <Icon size={22} />
      </div>
      <span className="text-xs font-bold text-[#64748B]">{count} ks</span>
    </div>
    <p className="text-base font-medium text-[#64748B] mb-1">{label}</p>
    <p className="text-2xl font-bold text-[#0F172A] truncate" title={value}>{value}</p>
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
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(showAllInvoices);
  }, [showAllInvoices]);

  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter(i => i.payment_status === 'paid').length;
    const pending = invoices.filter(i => i.payment_status === 'pending').length;
    const overdue = invoices.filter(i => i.payment_status === 'overdue').length;
    
    const totalAmount = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
    const paidAmount = invoices.filter(i => i.payment_status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0);
    const pendingAmount = invoices.filter(i => i.payment_status === 'pending').reduce((s, i) => s + (i.total_amount || 0), 0);
    const overdueAmount = invoices.filter(i => i.payment_status === 'overdue').reduce((s, i) => s + (i.total_amount || 0), 0);

    return { total, paid, pending, overdue, totalAmount, paidAmount, pendingAmount, overdueAmount };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => 
      i.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const exportToCSV = () => {
    const headers = ['Číslo faktury', 'Projekt', 'Dodavatel', 'Částka', 'Splatnost', 'Stav'];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      inv.project_name || 'REŽIE',
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
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-3xl font-bold text-[#0F172A]">Přehled faktur</h1>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="bg-[#FAFBFC] p-1 rounded-full flex border border-[#E2E8F0] w-full sm:w-auto overflow-hidden">
            <button
              onClick={() => setShowAllInvoices(false)}
              className={`flex-1 sm:min-w-[170px] px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                !showAllInvoices 
                  ? 'bg-[#5B9AAD] text-white' 
                  : 'text-[#64748B] bg-transparent hover:text-[#0F172A]'
              }`}
            >
              Projektové faktury
            </button>
            <button
              onClick={() => setShowAllInvoices(true)}
              className={`flex-1 sm:min-w-[170px] px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                showAllInvoices 
                  ? 'bg-[#5B9AAD] text-white' 
                  : 'text-[#64748B] bg-transparent hover:text-[#0F172A]'
              }`}
            >
              Všechny faktury
            </button>
          </div>

          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl text-sm md:text-base font-bold text-[#64748B] hover:bg-slate-50 transition-all w-full sm:w-auto"
          >
            <Download size={18} />
            <span>Export do CSV</span>
          </button>
        </div>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#64748B]" size={20} />
        <input
          type="text"
          placeholder="Hledat fakturu, projekt nebo dodavatele..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-[#FAFBFC] border border-[#E2E8F0] rounded-3xl outline-none text-base focus:ring-2 focus:ring-[#5B9AAD]/20 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <InvoiceStat 
          label="Celková fakturace" 
          value={formatCurrency(stats.totalAmount)} 
          count={stats.total}
          color="bg-slate-100 text-slate-600" 
          icon={FileText} 
        />
        <InvoiceStat 
          label="Uhrazeno" 
          value={formatCurrency(stats.paidAmount)} 
          count={stats.paid}
          color="bg-emerald-50 text-emerald-600" 
          icon={CheckCircle2} 
        />
        <InvoiceStat 
          label="Čekající" 
          value={formatCurrency(stats.pendingAmount)} 
          count={stats.pending}
          color="bg-amber-50 text-amber-600" 
          icon={Clock} 
        />
        <InvoiceStat 
          label="Po splatnosti" 
          value={formatCurrency(stats.overdueAmount)} 
          count={stats.overdue}
          color="bg-rose-50 text-rose-600" 
          icon={AlertCircle} 
        />
      </div>

      <div className="bg-[#FAFBFC] rounded-2xl border border-[#E2E8F0] overflow-hidden p-6 md:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#5B9AAD] mb-4" />
            <p className="text-lg text-[#64748B] font-medium">Aktualizace dat...</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="text-xs font-bold text-[#64748B] uppercase tracking-wider border-b border-slate-100 pb-4">
                  <th className="px-4 py-4 sticky left-0 bg-[#FAFBFC]">Faktura</th>
                  <th className="px-4 py-4">Projekt / Dodavatel</th>
                  <th className="px-4 py-4 text-right">Částka</th>
                  <th className="px-4 py-4">Splatnost</th>
                  <th className="px-4 py-4 text-center">Stav</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-5 sticky left-0 bg-[#FAFBFC] group-hover:bg-slate-50/50">
                      <div className="text-base font-semibold text-[#0F172A]">{inv.invoice_number}</div>
                      <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-tighter">Digitalizováno</div>
                    </td>
                    <td className="px-4 py-5">
                      {inv.project_id ? (
                        <div className="text-base text-[#0F172A] font-semibold truncate max-w-[200px]">{inv.project_name}</div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-[#64748B] text-[10px] font-black rounded-lg uppercase tracking-widest border border-slate-200 mb-1">
                          Režie
                        </span>
                      )}
                      <div className="text-sm text-[#475569] truncate max-w-[200px] font-medium">{inv.supplier_name}</div>
                    </td>
                    <td className="px-4 py-5 text-base font-bold text-right text-[#0F172A]">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-4 py-5 text-base text-[#475569] font-medium">{formatDate(inv.date_issue)}</td>
                    <td className="px-4 py-5 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border ${
                        inv.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        inv.payment_status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {inv.payment_status === 'paid' ? 'Uhrazeno' : inv.payment_status === 'pending' ? 'Čekající' : 'Neuhrazeno'}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <button className="text-[#5B9AAD] hover:bg-[#5B9AAD]/10 p-2.5 rounded-xl transition-colors">
                        <Download size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="w-16 h-16 bg-[#FAFBFC] border border-[#E2E8F0] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter size={24} className="text-[#E2E8F0]" />
                      </div>
                      <p className="text-[#64748B] text-lg font-medium">Nebyly nalezeny žádné faktury splňující kritéria</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;

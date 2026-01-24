
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Wallet, TrendingUp, Calendar, FileText, Loader2, Download, 
  Home, ChevronRight, Calculator, X, Save, AlertCircle, Info, Search, ArrowUpDown, Edit2, Plus
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { supabase, updateProject } from '../lib/supabase';
import { Project, Invoice } from '../types';
import { formatCurrency, formatDate, COLORS } from '../constants';
import { useToast } from '../components/Toast';

const EditModal: React.FC<{ 
  project: Project; 
  onClose: () => void; 
  onSave: () => void; 
  showToast: any 
}> = ({ project, onClose, onSave, showToast }) => {
  const [formData, setFormData] = useState({
    planned_budget: project.planned_budget,
    status: project.status,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      const { data } = await supabase.from('projects').select('notes').eq('id', project.id).single();
      if (data) setFormData(prev => ({ ...prev, notes: data.notes || '' }));
    };
    fetchNotes();
  }, [project.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await updateProject(project.id, formData);
      if (error) throw error;
      showToast('Projekt byl úspěšně aktualizován', 'success');
      onSave();
    } catch (err) {
      showToast('Chyba při ukládání projektu', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-3xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 flex items-center justify-between border-b border-[#E2E8F0]">
          <h3 className="text-2xl font-bold">Nastavení rozpočtu</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-[#64748B]"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-base font-bold text-[#64748B]">Název projektu (nelze měnit)</label>
            <input disabled value={project.name} className="w-full px-5 py-3.5 bg-white border border-[#E2E8F0] text-slate-400 rounded-2xl cursor-not-allowed outline-none text-base" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-base font-bold text-[#64748B]">Plánovaný rozpočet (Kč)</label>
              <input 
                type="number" 
                value={formData.planned_budget}
                onChange={e => setFormData({...formData, planned_budget: Number(e.target.value)})}
                className="w-full px-5 py-3.5 bg-white border border-[#E2E8F0] rounded-2xl outline-none focus:ring-2 focus:ring-[#5B9AAD]/30 text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="text-base font-bold text-[#64748B]">Status projektu</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-5 py-3.5 bg-white border border-[#E2E8F0] rounded-2xl outline-none focus:ring-2 focus:ring-[#5B9AAD]/30 appearance-none text-base font-bold"
              >
                <option value="active">Aktivní</option>
                <option value="completed">Dokončeno</option>
                <option value="on_hold">Pozastaveno</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-base font-bold text-[#64748B]">Poznámky</label>
            <textarea 
              rows={4} 
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full px-5 py-3.5 bg-white border border-[#E2E8F0] rounded-2xl outline-none focus:ring-2 focus:ring-[#5B9AAD]/30 resize-none text-base"
              placeholder="Zadejte doplňující informace k projektu..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 bg-white border border-[#E2E8F0] text-[#64748B] font-bold rounded-2xl hover:bg-slate-50 transition-all text-base"
            >
              Zrušit
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-4 bg-[#5B9AAD] text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-[#4A8A9D] transition-all text-base"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
              {loading ? 'Ukládám...' : 'Uložit změny'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [searchInvoice, setSearchInvoice] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{key: keyof Invoice, direction: 'asc' | 'desc'} | null>(null);
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  const { showToast, ToastComponent } = useToast();

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [projRes, invRes, noteRes] = await Promise.all([
        supabase.from('project_dashboard').select('*').eq('id', id).single(),
        supabase.from('project_invoices').select('*').eq('project_id', id).order('date_issue', { ascending: true }),
        supabase.from('projects').select('notes').eq('id', id).single()
      ]);

      if (projRes.error) throw projRes.error;
      setProject(projRes.data);
      setInvoices(invRes.data || []);
      const n = noteRes.data?.notes || '';
      setNotes(n);
      setEditedNotes(n);
    } catch (err: any) {
      showToast('Nepodařilo se načíst detail projektu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const stats = useMemo(() => {
    if (!project) return { budget: 0, costs: 0, remaining: 0, count: 0, percentage: 0 };
    return {
      budget: project.planned_budget,
      costs: project.total_costs,
      remaining: project.planned_budget - project.total_costs,
      count: project.invoice_count,
      percentage: project.budget_usage_percent
    };
  }, [project]);

  const invoiceStats = useMemo(() => {
    const paid = invoices.filter(i => i.payment_status === 'paid').length;
    const pending = invoices.filter(i => i.payment_status === 'pending').length;
    const overdue = invoices.filter(i => i.payment_status === 'overdue').length;
    const total = invoices.length;
    return { paid, pending, overdue, total };
  }, [invoices]);

  const chartData = useMemo(() => {
    let sum = 0;
    return invoices.map(inv => {
      sum += inv.total_amount;
      return {
        date: formatDate(inv.date_issue),
        total: sum
      };
    });
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    let result = invoices.filter(inv => {
      const matchSearch = inv.invoice_number.toLowerCase().includes(searchInvoice.toLowerCase()) || 
                          inv.supplier_name.toLowerCase().includes(searchInvoice.toLowerCase());
      const matchStatus = statusFilter === 'all' || inv.payment_status === statusFilter;
      return matchSearch && matchStatus;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [invoices, searchInvoice, statusFilter, sortConfig]);

  const handleSort = (key: keyof Invoice) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    try {
      const { error } = await supabase.from('projects').update({ notes: editedNotes }).eq('id', id);
      if (error) throw error;
      setNotes(editedNotes);
      setIsEditingNotes(false);
      showToast('Poznámky byly uloženy', 'success');
    } catch (err) {
      showToast('Chyba při ukládání poznámek', 'error');
    }
  };

  if (loading && !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-[#5B9AAD] mb-4" />
        <p className="text-lg text-[#64748B] font-medium">Načítání detailu projektu...</p>
      </div>
    );
  }

  if (!project) return null;

  const statusMap = {
    active: { label: 'Aktivní', styles: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    completed: { label: 'Dokončeno', styles: 'bg-blue-50 text-blue-600 border-blue-200' },
    on_hold: { label: 'Pozastaveno', styles: 'bg-amber-50 text-amber-600 border-amber-200' }
  };
  const status = statusMap[project.status] || statusMap.active;

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      <nav className="flex items-center gap-3 text-base font-semibold text-[#64748B]">
        <Link to="/" className="hover:text-[#5B9AAD] flex items-center gap-1.5"><Home size={18} /> Přehled</Link>
        <ChevronRight size={14} />
        <Link to="/projects" className="hover:text-[#5B9AAD]">Projekty</Link>
        <ChevronRight size={14} />
        <span className="text-[#0F172A]">{project.name}</span>
      </nav>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <span className={`px-4 py-1 text-xs font-bold rounded-lg uppercase border ${status.styles}`}>
              {status.label}
            </span>
            <span className="text-[#64748B] text-xs font-bold uppercase tracking-widest">Kód zakázky: {project.code}</span>
          </div>
          <h1 className="text-3xl font-bold text-[#0F172A]">{project.name}</h1>
        </div>
        <button 
          onClick={() => setShowEdit(true)}
          className="w-full md:w-auto px-8 py-4 bg-[#FAFBFC] border border-[#E2E8F0] text-[#0F172A] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-base"
        >
          <Calculator size={20} />
          Zadat rozpočet
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E8F0]">
          <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Plánovaný rozpočet</p>
          <h3 className="text-2xl font-bold text-[#0F172A] mb-5">{formatCurrency(stats.budget)}</h3>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-fit"><Wallet size={22} /></div>
        </div>
        <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E8F0]">
          <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Skutečné náklady</p>
          <h3 className={`text-2xl font-bold mb-5 ${stats.percentage > 100 ? 'text-rose-600' : 'text-[#0F172A]'}`}>
            {formatCurrency(stats.costs)}
          </h3>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit"><TrendingUp size={22} /></div>
        </div>
        <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E8F0]">
          <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Zbývá z rozpočtu</p>
          <h3 className={`text-2xl font-bold mb-5 ${stats.remaining < 0 ? 'text-rose-600' : 'text-[#0F172A]'}`}>
            {formatCurrency(stats.remaining)}
          </h3>
          <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl w-fit"><Calendar size={22} /></div>
        </div>
        <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-[#E2E8F0]">
          <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Celkem faktur</p>
          <h3 className="text-2xl font-bold text-[#0F172A] mb-1">{stats.count}</h3>
          
          <div className="w-full h-2 bg-slate-100 rounded-full flex overflow-hidden my-3">
            <div style={{ width: `${invoiceStats.total > 0 ? (invoiceStats.paid / invoiceStats.total) * 100 : 0}%` }} className="bg-[#10B981] h-full" title="Zaplaceno" />
            <div style={{ width: `${invoiceStats.total > 0 ? (invoiceStats.pending / invoiceStats.total) * 100 : 0}%` }} className="bg-[#F59E0B] h-full" title="Čekající" />
            <div style={{ width: `${invoiceStats.total > 0 ? (invoiceStats.overdue / invoiceStats.total) * 100 : 0}%` }} className="bg-[#EF4444] h-full" title="Po splatnosti" />
          </div>
          <p className="text-[10px] text-[#475569] font-semibold whitespace-nowrap">
            {invoiceStats.paid} zaplaceno · {invoiceStats.pending} čekající · {invoiceStats.overdue} po splatnosti
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
        <div className="lg:col-span-1 flex flex-col gap-8">
          <div className="bg-[#FAFBFC] rounded-2xl p-8 border border-[#E2E8F0]">
            <h3 className="text-xl font-bold mb-6">Čerpání rozpočtu</h3>
            <div className="flex justify-between items-end mb-4">
              <span className="text-4xl font-bold text-[#0F172A]">{stats.percentage.toFixed(1)}%</span>
              <span className="text-sm font-bold text-[#64748B] uppercase tracking-wider">Průběh</span>
            </div>
            <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  stats.percentage > 100 ? 'bg-rose-500' : stats.percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(stats.percentage, 100)}%` }}
              />
            </div>
            {stats.percentage > 100 && (
              <div className="mt-6 p-5 bg-rose-50 rounded-2xl flex items-start gap-4 border border-rose-100">
                <AlertCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
                <p className="text-base text-rose-800 leading-relaxed font-semibold">
                  Pozor: Rozpočet byl překročen o {formatCurrency(Math.abs(stats.remaining))}.
                </p>
              </div>
            )}
          </div>

          <div className="bg-[#FAFBFC] rounded-2xl p-8 border border-[#E2E8F0] flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Poznámky k projektu</h3>
              {!isEditingNotes && notes && (
                <button 
                  onClick={() => setIsEditingNotes(true)}
                  className="p-2 text-[#64748B] hover:text-[#5B9AAD] hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <textarea 
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-2xl outline-none focus:border-[#5B9AAD]/30 text-base min-h-[120px] resize-none"
                  placeholder="Zadejte poznámky k projektu..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveNotes}
                    className="flex-1 bg-[#5B9AAD] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#4A8A9D] transition-colors"
                  >
                    <Save size={16} /> Uložit
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingNotes(false);
                      setEditedNotes(notes);
                    }}
                    className="px-4 py-2.5 bg-slate-100 text-[#64748B] rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            ) : (
              <div className="group h-full flex flex-col">
                {notes ? (
                  <div className="p-6 bg-white rounded-2xl border border-[#E2E8F0] flex-1">
                    <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">{notes}</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
                    <p className="text-slate-400 font-medium mb-4 italic">Žádné poznámky</p>
                    <button 
                      onClick={() => setIsEditingNotes(true)}
                      className="flex items-center gap-2 text-[#5B9AAD] font-bold hover:underline"
                    >
                      <Plus size={18} /> Přidat poznámku
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 flex">
          <div className="bg-[#FAFBFC] rounded-2xl p-8 border border-[#E2E8F0] w-full flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h3 className="text-xl font-bold">Vývoj nákladů v čase</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#5B9AAD]" />
                  <span className="text-xs font-bold text-[#64748B]">Skutečné náklady</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0 border-t-2 border-dashed border-slate-400" />
                  <span className="text-xs font-bold text-[#64748B]">Plánovaný rozpočet</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary[500]} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={COLORS.primary[500]} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'none', fontSize: '14px' }}
                    formatter={(val: any) => formatCurrency(val)}
                  />
                  
                  <ReferenceLine 
                    y={stats.budget} 
                    stroke="#94A3B8" 
                    strokeDasharray="5 5" 
                    label={{ 
                      value: formatCurrency(stats.budget), 
                      position: 'right', 
                      fill: '#64748B', 
                      fontSize: 10,
                      fontWeight: 'bold',
                      offset: 10
                    }} 
                  />

                  <Area type="monotone" dataKey="total" stroke={COLORS.primary[500]} strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#FAFBFC] rounded-2xl border border-[#E2E8F0] overflow-hidden p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <h3 className="text-xl font-bold">Přehled faktur projektu</h3>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
              <input 
                placeholder="Hledat fakturu nebo dodavatele..." 
                value={searchInvoice}
                onChange={e => setSearchInvoice(e.target.value)}
                className="pl-12 pr-5 py-3.5 bg-white border border-[#E2E8F0] rounded-2xl outline-none text-base w-full focus:ring-2 focus:ring-[#5B9AAD]/20"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-6 py-3.5 bg-white border border-[#E2E8F0] rounded-2xl outline-none text-base font-bold appearance-none text-[#64748B] min-w-[180px]"
            >
              <option value="all">Všechny stavy</option>
              <option value="paid">Uhrazeno</option>
              <option value="pending">Čekající</option>
              <option value="overdue">Neuhrazeno</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto -mx-8 px-8">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="text-xs font-bold text-[#64748B] uppercase tracking-wider border-b border-slate-50 pb-4">
                <th className="px-4 py-4 cursor-pointer hover:text-[#5B9AAD] group" onClick={() => handleSort('invoice_number')}>
                  Číslo faktury <ArrowUpDown size={12} className="inline ml-1" />
                </th>
                <th className="px-4 py-4 cursor-pointer hover:text-[#5B9AAD] group" onClick={() => handleSort('supplier_name')}>
                  Dodavatel <ArrowUpDown size={12} className="inline ml-1" />
                </th>
                <th className="px-4 py-4 cursor-pointer hover:text-[#5B9AAD] group" onClick={() => handleSort('date_issue')}>
                  Datum vystavení <ArrowUpDown size={12} className="inline ml-1" />
                </th>
                <th className="px-4 py-4 text-right cursor-pointer hover:text-[#5B9AAD] group" onClick={() => handleSort('total_amount')}>
                  Částka <ArrowUpDown size={12} className="inline ml-1" />
                </th>
                <th className="px-4 py-4 text-center">Stav platby</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-6 text-base font-semibold text-[#0F172A]">{inv.invoice_number}</td>
                  <td className="px-4 py-6 text-base text-[#475569] font-medium">{inv.supplier_name}</td>
                  <td className="px-4 py-6 text-base text-[#475569]">{formatDate(inv.date_issue)}</td>
                  <td className="px-4 py-6 text-base font-bold text-right text-[#0F172A]">{formatCurrency(inv.total_amount)}</td>
                  <td className="px-4 py-6 text-center">
                    <span className={`px-4 py-1 text-xs font-bold rounded-full uppercase border ${
                      inv.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      inv.payment_status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {inv.payment_status === 'paid' ? 'Uhrazeno' : inv.payment_status === 'pending' ? 'Čekající' : 'Neuhrazeno'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-[#64748B] text-lg font-medium">Nebyly nalezeny žádné faktury splňující kritéria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEdit && (
        <EditModal 
          project={project} 
          showToast={showToast}
          onClose={() => setShowEdit(false)} 
          onSave={() => {
            setShowEdit(false);
            fetchData();
          }} 
        />
      )}

      {ToastComponent}
    </div>
  );
};

export default ProjectDetail;

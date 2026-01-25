import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2, History, AlertCircle } from 'lucide-react';
import { budgetService } from '../lib/userService';
import { BudgetChange } from '../types';
import { formatCurrency } from '../constants';

interface BudgetHistoryProps {
  projectId: string;
}

const BudgetHistory: React.FC<BudgetHistoryProps> = ({ projectId }) => {
  const [changes, setChanges] = useState<BudgetChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await budgetService.getBudgetHistory(projectId);
        setChanges(data);
      } catch (err) {
        console.error('Error fetching budget history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-[#5B9AAD] mb-2" />
        <p className="text-sm text-[#475569]">Načítání historie...</p>
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-[#F8F9FA] rounded-2xl border border-[#E2E5E9] border-dashed">
        <AlertCircle size={32} className="text-[#CDD1D6] mb-2" />
        <p className="text-sm text-[#5C6878]">Žádné záznamy o změnách rozpočtu.</p>
      </div>
    );
  }

  const visibleChanges = isExpanded ? changes : changes.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={18} className="text-[#5C6878]" />
          <h4 className="text-base font-bold text-[#0F172A]">Historie úprav rozpočtu</h4>
        </div>
        <span className="text-xs font-bold text-[#475569] bg-[#F1F5F9] px-2 py-1 rounded-lg uppercase tracking-wider">
          {changes.length} záznamů
        </span>
      </div>

      <div className="space-y-4 relative">
        {/* Timeline line */}
        <div className="absolute left-[20px] top-6 bottom-6 w-px bg-[#E2E5E9]" />
        
        {visibleChanges.map((change, index) => (
          <div 
            key={change.id} 
            className="relative pl-12 group"
          >
            {/* Timeline dot */}
            <div className={`absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#FAFBFC] z-10 ${
              change.change_amount > 0 ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'
            }`}>
              {change.change_amount > 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
            </div>
            
            <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-[#E2E5E9] transition-all group-hover:border-[#5B9AAD]/30 group-hover:bg-[#FDFDFE]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <p className="text-lg font-bold">
                  <span className={change.change_amount > 0 ? 'text-[#059669]' : 'text-[#DC2626]'}>
                    {change.change_amount > 0 ? '+' : ''}{formatCurrency(change.change_amount)}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-[#5C6878] uppercase tracking-wider">
                    {new Date(change.created_at).toLocaleDateString('cs-CZ', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-3">
                <div className="bg-white/50 p-2 rounded-lg border border-[#E2E5E9]">
                  <p className="text-[10px] font-bold text-[#5C6878] uppercase mb-1">Původní</p>
                  <p className="font-semibold text-[#475569]">{formatCurrency(change.old_value)}</p>
                </div>
                <div className="bg-white/50 p-2 rounded-lg border border-[#E2E5E9]">
                  <p className="text-[10px] font-bold text-[#5C6878] uppercase mb-1">Nový limit</p>
                  <p className="font-semibold text-[#0F172A]">{formatCurrency(change.new_value)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-3 border-t border-[#E2E5E9]">
                <div className="w-6 h-6 rounded-full bg-[#E1EFF3] flex items-center justify-center text-[10px] font-bold text-[#3A6A7D]">
                  {change.admin_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'}
                </div>
                <p className="text-xs text-[#5C6878] font-medium">
                  Změnil: <span className="font-bold text-[#0F172A]">{change.admin_name}</span>
                </p>
              </div>
              
              {change.reason && (
                <div className="mt-3 p-3 bg-white border border-[#E2E5E9] rounded-xl relative">
                   <p className="text-xs text-[#475569] leading-relaxed italic">
                    „{change.reason}“
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {changes.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-2 py-3 bg-[#F4F6F8] rounded-xl text-sm font-bold text-[#5B9AAD] hover:bg-[#E1EFF3] transition-all uppercase tracking-widest"
        >
          {isExpanded ? 'Zobrazit méně' : `Zobrazit celou historii (${changes.length})`}
        </button>
      )}
    </div>
  );
};

export default BudgetHistory;

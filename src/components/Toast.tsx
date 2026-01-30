import React, { useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const icons = {
    success: <CheckCircle2 size={20} className="text-[#10B981]" />,
    error: <AlertCircle size={20} className="text-[#DC2626]" />,
    info: <Info size={20} className="text-[#5B9AAD]" />,
    loading: <Loader2 size={20} className="text-[#5B9AAD] animate-spin" />,
  };

  const backgrounds = {
    success: 'bg-[#ECFDF5] border-[#10B981]/20',
    error: 'bg-[#FEF2F2] border-[#DC2626]/20',
    info: 'bg-[#F0F9FF] border-[#5B9AAD]/20',
    loading: 'bg-[#F0F9FF] border-[#5B9AAD]/20',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-lg ${backgrounds[type]} animate-in`}>
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <p className="text-sm font-medium text-[#0F172A] leading-tight pr-2">{message}</p>
      {type !== 'loading' && (
        <button
          onClick={onClose}
          className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-black/5 rounded-lg transition-all"
          aria-label="Zavřít"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    if (type !== 'loading') {
      setTimeout(() => setToast(null), 4000);
    }
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={hideToast} />
  ) : null;

  return { showToast, hideToast, ToastComponent };
};

export default Toast;

import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl border animate-in slide-in-from-right-10 duration-300 ${
      type === 'success' ? 'bg-[#ECFDF5] text-[#059669] border-[#059669]/30' : 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/30'
    }`}>
      {type === 'success' ? <CheckCircle2 size={22} aria-hidden="true" /> : <XCircle size={22} aria-hidden="true" />}
      <p className="font-medium text-base leading-relaxed">{message}</p>
      <button onClick={onClose} className="ml-4 p-2 hover:bg-black/5 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Zavřít oznámení">
        <X size={18} />
      </button>
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = React.useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType) => setToast({ message, type });
  const hideToast = () => setToast(null);

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={hideToast} />
  ) : null;

  return { showToast, ToastComponent };
};
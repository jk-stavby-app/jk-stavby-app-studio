
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
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
    }`}>
      {type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
      <p className="font-semibold text-sm">{message}</p>
      <button onClick={onClose} className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-colors">
        <X size={16} />
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

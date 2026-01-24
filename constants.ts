
export const COLORS = {
  primary: '#5B9AAD',
  bg: '#F8FAFC',
  text: '#0F172A',
  muted: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

// Currency formatting helper
export const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('cs-CZ', { 
    style: 'currency', 
    currency: 'CZK',
    maximumFractionDigits: 0 
  }).format(amount);

// Date formatting helper
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('cs-CZ').format(new Date(date));

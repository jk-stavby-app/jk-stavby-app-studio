export const COLORS = {
  primary: '#5B9AAD',
  primaryHover: '#4A8A9D',
  primaryLight: '#E1EFF3',
  primaryDark: '#3A6A7D',
  background: '#F4F6F8',
  surface: '#FAFBFC',
  surfaceHover: '#F8F9FA',
  border: '#E2E5E9',
  borderHover: '#CDD1D6',
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#5C6878',
    placeholder: '#5C6878',
  },
  status: {
    success: '#10B981',
    successBg: '#ECFDF5',
    successText: '#059669',
    warning: '#F59E0B',
    warningBg: '#FEF9EE',
    warningText: '#D97706',
    error: '#EF4444',
    errorBg: '#FEF2F2',
    errorText: '#DC2626',
  },
  chart: [
    '#5B9AAD',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#84CC16',
  ],
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};


export const COLORS = {
  // Primary palette (petrol blue)
  primary: {
    50: '#F0F7F9',
    100: '#E1EFF3',
    200: '#C3DFE7',
    300: '#9ECAD6',
    400: '#7CB5C5',
    500: '#5B9AAD',
    600: '#4A8A9D',
    700: '#3A6A7D',
    800: '#2A4A5D',
    900: '#1A2A3D',
  },
  
  // Chart colors (harmonious gradient palette)
  chart: [
    '#5B9AAD', // primary
    '#7CB5C5', // light primary
    '#9ECAD6', // lighter
    '#4A8A9D', // dark primary
    '#3A6A7D', // darker
    '#10B981', // accent green
  ],
  
  // Semantic
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  
  // Neutrals
  white: '#FFFFFF',
  background: '#F8FAFC',
  border: '#E5E7EB',
  borderHover: '#D1D5DB',
  
  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
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

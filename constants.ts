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
    '#4A8A9D', // dark primary
    '#3A6A7D', // darker
    '#10B981', // accent green
    '#9ECAD6', // lighter
  ],
  
  // Semantic
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#D97706',
  warningLight: '#FEF9EE',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  
  // Neutrals (NO pure white - all have subtle cool undertone)
  background: '#F4F6F8',       // App background
  card: '#FAFBFC',             // Card background
  surface: '#F8F9FA',          // Inputs, modals
  elevated: '#FDFDFE',         // Hover states
  border: '#E2E5E9',           // Default border
  borderHover: '#CDD1D6',      // Hover border
  
  // Text (NO pure black - WCAG 2.2 compliant)
  textPrimary: '#0F172A',      // 14.5:1 on card
  textSecondary: '#475569',    // 5.8:1 on card
  textMuted: '#5C6878',        // 4.6:1 on card
  textOnPrimary: '#F8FAFC',    // Text on primary buttons
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
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B9AAD',
          50: '#EEF5F7',
          100: '#D4E6EB',
          200: '#B0D1DA',
          300: '#8BBCC9',
          400: '#71ACB9',
          500: '#5B9AAD',
          600: '#4A8A9D',
          700: '#3A6A7D',
          800: '#2A4A5D',
          900: '#1A2A3D',
        },
        background: '#F4F6F8',
        surface: '#FAFBFC',
      },
      fontFamily: {
        sans: ['Rubik', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-bottom-4': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-from-bottom-8': {
          '0%': { transform: 'translateY(32px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'in': 'fade-in 0.5s ease-out, slide-in-from-bottom-4 0.5s ease-out',
      },
    },
  },
  plugins: [],
}

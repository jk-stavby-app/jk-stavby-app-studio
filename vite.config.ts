import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {
      API_KEY: process.env.API_KEY,
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    },
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
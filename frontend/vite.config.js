import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Configuracion de Vite para EMI Connect.
 *
 * Se fija un objetivo de compilacion conservador (es2015) para que el sistema
 * funcione en navegadores modernos disponibles tambien para Windows 8/8.1
 * (por ejemplo: Chrome 109, Firefox ESR 115, Edge 109). No se utilizan APIs
 * experimentales del navegador.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    open: false,
  },
  preview: {
    port: 4173,
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});

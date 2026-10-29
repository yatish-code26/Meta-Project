import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Minimal, secure Vite config for RouteX Meta Hackathon Travel Recovery Prototype
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The browser uses relative /api URLs. In development Vite forwards them to
// Express; in production Express serves both the API and the built website.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});

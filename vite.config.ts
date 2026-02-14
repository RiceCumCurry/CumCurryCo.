import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listens on 0.0.0.0, enabling access via LAN IP
    port: 3000
  }
});
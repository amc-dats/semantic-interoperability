import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/semantic-interoperability/',
  plugins: [react()],
  server: {
    proxy: {
      // Forwards to the local mock backend (server/index.js) during `npm run dev`.
      // In production the app calls the real Azure Function app instead, via
      // VITE_API_BASE (see src/lib/api.ts).
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})

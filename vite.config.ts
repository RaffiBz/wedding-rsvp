import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project sites are served from a subpath (e.g. /rsvp-raffi-nver/).
// Set VITE_BASE_PATH at build time to that subpath; defaults to '/' for local dev.
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  // expose mode for clarity in config-time logs
  define: {
    __APP_MODE__: JSON.stringify(mode),
  },
}))

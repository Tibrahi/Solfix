import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure correct path resolution for SPA routing
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps in production for security
  },
})

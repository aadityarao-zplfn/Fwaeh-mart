import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // PROPER Vercel configuration
  build: {
    outDir: 'dist',
    // Ensure SPA mode (not SSR)
    ssr: false,
    // Better optimization for production
    minify: 'esbuild',
    // Clear build directory
    emptyOutDir: true
  },
  // Explicitly set base path for assets
  base: '/',
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react']
  }
})

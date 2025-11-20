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
  build: {
    outDir: 'dist',
    ssr: false,
    minify: 'esbuild',
    emptyOutDir: true,
    // Add this for better SPA handling
    rollupOptions: {
      input: './index.html'
    }
  },
  // CRITICAL CHANGE: Use './' for proper asset paths in production
  base: './',
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react']
  },
  // Add this for better development experience
  server: {
    port: 3000,
    open: true
  }
})

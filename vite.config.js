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
    emptyOutDir: true
  },
  base: '/', // KEEP THIS AS '/'
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react']
  }
})

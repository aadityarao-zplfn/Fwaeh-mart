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
    // ADD THIS FOR CACHE BUSTING
    rollupOptions: {
      output: {
        entryFileNames: `[name].[hash].js`,
        chunkFileNames: `[name].[hash].js`,
        assetFileNames: `[name].[hash].[ext]`
      }
    }
  },
  base: '/',
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react']
  }
})

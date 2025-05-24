import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Performance optimizations
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for better caching
          vendor: ['react', 'react-dom'],
          livekit: ['livekit-client'],
          primereact: ['primereact', 'primeicons'],
        },
      },
    },
    // Chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
  },
  // Development optimizations
  server: {
    fs: {
      strict: false,
    },
  },
  // Asset optimizations
  assetsInclude: ['**/*.woff2', '**/*.woff'],
  // CSS optimizations
  css: {
    devSourcemap: false,
  },
  // Preload optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'livekit-client'],
    exclude: ['@vite/client', '@vite/env'],
  },
})

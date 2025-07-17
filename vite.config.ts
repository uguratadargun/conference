import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Copy MediaPipe WASM files to public directory
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@mediapipe/tasks-vision/wasm/*',
          dest: 'wasm/',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      // Development modunda livekit-client'ın kaynak kodunu direkt kullan
      'livekit-client': path.resolve(
        __dirname,
        './libs/livekit-client/src/index.ts'
      ),
      '@livekit/components-core': path.resolve(
        __dirname,
        './libs/@livekit/components-core/src/index.ts'
      ),
      '@livekit/components-react': path.resolve(
        __dirname,
        './libs/@livekit/components-react/src/index.ts'
      ),
      '@livekit/track-processors': path.resolve(
        __dirname,
        './libs/@livekit/track-processors/src/index.ts'
      ),
    },
  },
  build: {
    // Performance optimizations
    target: 'es2020',
    minify: 'terser',
    sourcemap: true, // Source map'leri açık tut
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
          primereact: ['primereact'],
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
    sourcemapIgnoreList: false, // Source map'leri ignore etme
  },
  // Asset optimizations
  assetsInclude: ['**/*.woff2', '**/*.woff'],
  // CSS optimizations
  css: {
    devSourcemap: true, // Development'ta CSS source map'lerini aç
  },
  // Preload optimization
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: [
      '@vite/client',
      '@vite/env',
      'livekit-client',
      '@livekit/components-core',
      '@livekit/components-react',
      '@livekit/track-processors',
      // Prevent MediaPipe from being pre-bundled
      '@mediapipe/tasks-vision',
    ], // livekit-client'ı optimize etme
  },
});

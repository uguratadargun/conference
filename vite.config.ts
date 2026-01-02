import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Plugin to fix MediaPipe source map path issue
// Vite looks for vision_bundle_mjs.js.map but the file is vision_bundle.mjs.map
const fixMediaPipeSourceMap = () => {
  return {
    name: 'fix-mediapipe-sourcemap',
    enforce: 'pre' as const,
    resolveId(id: string) {
      // Fix source map resolution
      if (id.includes('vision_bundle_mjs.js.map')) {
        return id.replace('vision_bundle_mjs.js.map', 'vision_bundle.mjs.map');
      }
      return null;
    },
    configureServer(server: any) {
      // Handle source map requests - redirect to correct path
      server.middlewares.use((req: any, _res: any, next: any) => {
        if (req.url?.includes('vision_bundle_mjs.js.map')) {
          // Redirect to correct source map file
          const correctUrl = req.url.replace(
            'vision_bundle_mjs.js.map',
            'vision_bundle.mjs.map'
          );
          req.url = correctUrl;
        }
        next();
      });
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  base: './', // Use relative paths for assets - works with Live Server
  plugins: [
    react(),
    fixMediaPipeSourceMap(),
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
  resolve: {},
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
  },
  // Asset optimizations
  assetsInclude: ['**/*.woff2', '**/*.woff'],
  // CSS optimizations
  css: {
    devSourcemap: true, // Development'ta CSS source map'lerini aç
  },
  // Preload optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'loglevel'],
    esbuildOptions: {
      // Fix for CommonJS packages like loglevel
      mainFields: ['module', 'main'],
    },
    exclude: [
      '@vite/client',
      '@vite/env',
      'livekit-client',
      '@livekit/components-core',
      '@livekit/components-react',
      '@livekit/track-processors',
    ],
  },
});

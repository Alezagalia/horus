import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Horus - Gestión de Hábitos y Productividad',
        short_name: 'Horus',
        description: 'Aplicación web para gestión de hábitos, tareas, eventos y gastos',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Estrategia de caché
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
            },
          },
        ],
        // Precache de assets críticos
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Límite de tamaño de archivos para precache
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
      },
      devOptions: {
        enabled: false, // Deshabilitado en desarrollo para mejor DX
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disabled in production for smaller build (US-109)
    // Optimizaciones de performance (US-109)
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.logs en producción
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Fix Safari 10 bugs
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    // Configuración de chunks (US-109)
    chunkSizeWarningLimit: 400, // Reduced from 500 to enforce smaller chunks
    cssCodeSplit: true, // Split CSS into separate files
    rollupOptions: {
      output: {
        // Code splitting optimizado
        manualChunks: (id) => {
          // React core y routing
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-core';
          }
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }

          // React Query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }

          // Form libraries
          if (
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/@hookform')
          ) {
            return 'forms';
          }

          // Validation
          if (id.includes('node_modules/zod')) {
            return 'validation';
          }

          // UI libraries
          if (
            id.includes('node_modules/@radix-ui') ||
            id.includes('node_modules/emoji-picker-react') ||
            id.includes('node_modules/react-colorful')
          ) {
            return 'ui-libs';
          }

          // Charts/visualization
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'charts';
          }

          // Utilities
          if (id.includes('node_modules/axios') || id.includes('node_modules/date-fns')) {
            return 'utils';
          }

          // State management
          if (id.includes('node_modules/zustand')) {
            return 'state';
          }

          // Keyboard shortcuts
          if (id.includes('node_modules/react-hotkeys-hook')) {
            return 'hotkeys';
          }
        },
        // Nombres de archivos con hash para cache busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Reportar tamaño de chunks
    reportCompressedSize: true,
  },
  // Optimizaciones para desarrollo
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
});

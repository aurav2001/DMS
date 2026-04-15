import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`,
        manualChunks(id) {
          if (id.includes('@ckeditor') || id.includes('mammoth')) {
            return 'editor-vendor';
          }
          if (id.includes('pdf-lib')) {
            return 'pdf-vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})

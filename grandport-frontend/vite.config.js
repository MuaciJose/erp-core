import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function getPackageName(id) {
  const normalized = id.split('node_modules/')[1]
  if (!normalized) {
    return null
  }

  if (normalized.startsWith('@')) {
    const [scope, name] = normalized.split('/')
    return scope && name ? `${scope}/${name}` : normalized
  }

  return normalized.split('/')[0]
}

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          const pkg = getPackageName(id)
          if (!pkg) {
            return 'vendor-misc'
          }

          if (
            pkg === 'react' ||
            pkg === 'react-dom' ||
            pkg === 'react-router' ||
            pkg === 'react-router-dom' ||
            pkg === 'react-is' ||
            pkg === 'scheduler' ||
            pkg === 'use-sync-external-store' ||
            pkg.startsWith('@remix-run/')
          ) {
            return 'vendor-framework'
          }

          if (
            pkg === 'lucide-react' ||
            pkg === 'react-hot-toast' ||
            pkg === 'react-hotkeys-hook' ||
            pkg === 'react-signature-canvas' ||
            pkg === 'react-barcode' ||
            pkg === 'html5-qrcode'
          ) {
            return 'vendor-ui'
          }

          if (pkg === 'axios' || pkg === 'date-fns' || pkg === 'browser-image-compression') {
            return 'vendor-utils'
          }

          return 'vendor-misc'
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // 🚀 'prompt' avisa o usuário quando há uma nova versão do ERP
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'GrandPort ERP',
        short_name: 'GrandPort',
        description: 'Sistema de Gestão Automotiva Profissional',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'screenshot-mobile.png', // Print da tela no Tablet/Celular
            sizes: '720x1280',
            type: 'image/png',
            // Sem form_factor ou setado para algo diferente de wide 🚀 Resolve o erro de "mobile"
            label: 'Checklist de Entrada'
          }
        ]
      }
    })
  ]
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🚀 IMPORTAÇÃO DO PWA
// Esse módulo é gerado automaticamente pelo vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register'

// Registrar o Service Worker para permitir instalação e modo offline
const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
        updateSW(true)
    }
})

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)

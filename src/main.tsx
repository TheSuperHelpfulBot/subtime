import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { notifyAppUpdateAvailable } from './pwaUpdate'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    notifyAppUpdateAvailable(() => updateSW(true))
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

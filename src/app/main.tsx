import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/shared/ui/tokens.css'
import './index.css'
import App from './App.tsx'
import { UiKitPage } from '@/features/ui-kit/UiKitPage'

// /ui-kit é a vitrine do design system, sem login e sem carregar o jogo
const Root = location.pathname === '/ui-kit' ? UiKitPage : App

// Desativa o menu nativo do navegador (botão direito); só os menus do próprio jogo aparecem.
// Campos de texto mantêm o menu nativo para copiar/colar.
document.addEventListener('contextmenu', (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  e.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

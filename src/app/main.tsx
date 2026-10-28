import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/shared/ui/tokens.css'
import './index.css'
import App from './App.tsx'
import { UiKitPage } from '@/features/ui-kit/UiKitPage'

// /ui-kit é a vitrine do design system, sem login e sem carregar o jogo
const Root = location.pathname === '/ui-kit' ? UiKitPage : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

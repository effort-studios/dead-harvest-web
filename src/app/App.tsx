import { useEffect, useMemo } from 'react'
import { useFarmStore } from '@/features/farm/store'
import { GameCanvas } from '@/features/farm/components/GameCanvas'
import { AuthScreen } from '@/features/auth/components/AuthScreen'
import { Hud } from '@/features/farm/components/Hud'
import { Avatar } from '@/features/profile/components/Avatar'
import { readLastUser } from '@/features/profile/render/avatarCache'
import { init, login, logout, register, useSession, verifyEmail } from './session'

// Em modo dev o StrictMode roda o effect 2x; sem isso a inicialização rodaria duas vezes
let started = false

export default function App() {
  const status = useSession((s) => s.status)
  const error = useSession((s) => s.error)

  useEffect(() => {
    if (started) return
    started = true
    init()
  }, [])

  // Relógio na tela: 1 tick por segundo, só depois de carregar o jogo
  useEffect(() => {
    if (status !== 'ready') return
    const id = setInterval(() => useFarmStore.getState().tick(), 1000)
    return () => clearInterval(id)
  }, [status])

  // Nada é salvo pelo front (cada ação já vai para o servidor). Aqui só busca o estado de verdade
  // a cada 30s e ao voltar para a aba, para acertar o relógio e ver o que mudou em outro aparelho.
  useEffect(() => {
    if (status !== 'ready') return
    const sync = () => useFarmStore.getState().sync()
    const onShow = () => document.visibilityState === 'visible' && sync()
    const id = setInterval(sync, 30_000)
    document.addEventListener('visibilitychange', onShow)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onShow)
    }
  }, [status])

  if (status === 'loading') return <LoadingScreen />
  if (status === 'anonymous') return <AuthScreen onLogin={login} onRegister={register} onVerifyEmail={verifyEmail} />
  if (status === 'error') return <p className="error">Não foi possível conectar à API: {error}</p>
  return (
    <div className="game">
      <GameCanvas />
      <Hud onLogout={logout} />
    </div>
  )
}

// Enquanto a API responde: se já houve login neste navegador, mostra o retrato guardado (só visual; quem confirma
// o login é a API). Sem registro, o texto de sempre.
function LoadingScreen() {
  const last = useMemo(() => readLastUser(), [])
  if (!last) return <p>Carregando...</p>
  return (
    <div className="loading-screen">
      <Avatar avatar={last.avatar} size={120} />
      <p>Voltando para a fazenda, {last.displayName}...</p>
    </div>
  )
}

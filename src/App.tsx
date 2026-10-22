import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { GameCanvas } from './ui/GameCanvas'
import { AuthScreen } from './ui/AuthScreen'
import { Hud } from './ui/Hud'

// Em modo dev o StrictMode roda o effect 2x; sem isso a inicialização rodaria duas vezes
let started = false

export default function App() {
  const status = useGameStore((s) => s.status)
  const error = useGameStore((s) => s.error)

  useEffect(() => {
    if (started) return
    started = true
    useGameStore.getState().init()
  }, [])

  // Relógio do jogo: 1 tick por segundo, só depois de carregar o save
  useEffect(() => {
    if (status !== 'ready') return
    const id = setInterval(() => useGameStore.getState().tick(), 1000)
    return () => clearInterval(id)
  }, [status])

  // Salvamento automático: a cada 10s e ao esconder a aba
  useEffect(() => {
    if (status !== 'ready') return
    const save = () => useGameStore.getState().save()
    const onHide = () => document.visibilityState === 'hidden' && save()
    const id = setInterval(save, 10_000)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [status])

  if (status === 'loading') return <p>Carregando...</p>
  if (status === 'anonymous') return <AuthScreen />
  if (status === 'error') return <p className="error">Não foi possível conectar à API: {error}</p>
  return (
    <div className="game">
      <GameCanvas />
      <Hud />
    </div>
  )
}

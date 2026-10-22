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

  // Relógio na tela: 1 tick por segundo, só depois de carregar o jogo
  useEffect(() => {
    if (status !== 'ready') return
    const id = setInterval(() => useGameStore.getState().tick(), 1000)
    return () => clearInterval(id)
  }, [status])

  // Nada é salvo pelo front (cada ação já vai para o servidor). Aqui só busca o estado de verdade
  // a cada 30s e ao voltar para a aba, para acertar o relógio e ver o que mudou em outro aparelho.
  useEffect(() => {
    if (status !== 'ready') return
    const sync = () => useGameStore.getState().sync()
    const onShow = () => document.visibilityState === 'visible' && sync()
    const id = setInterval(sync, 30_000)
    document.addEventListener('visibilitychange', onShow)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onShow)
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

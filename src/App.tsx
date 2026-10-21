import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { GameCanvas } from './ui/GameCanvas'
import { Hud } from './ui/Hud'

// Em modo dev o StrictMode roda o effect 2x; sem isso criaríamos 2 jogadores
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

  if (status === 'loading') return <p>Carregando...</p>
  if (status === 'error') return <p className="error">Não foi possível conectar à API: {error}</p>
  return (
    <div className="game">
      <GameCanvas />
      <Hud />
    </div>
  )
}

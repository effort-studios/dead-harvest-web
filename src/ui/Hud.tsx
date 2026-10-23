import { useEffect } from 'react'
import { CROPS, formatDuration } from '@/features/farm/model/crops'
import { ownedSeeds } from '@/features/farm/model/state'
import { useGameStore } from '../store/gameStore'
import { CropIcon } from './Icons'
import { ProfileMenu } from '@/features/profile/components/ProfileMenu'
import { DayClock } from './DayClock'
import { SideMenu } from './SideMenu'

const HOTBAR_SLOTS = 9

// HUD inspirada na prévia: jogador e dinheiro (canto superior esquerdo),
// dia (canto superior direito), barra de itens (embaixo) e erros de salvamento (embaixo à esquerda).
// Vida, energia, missões e minimapa ainda não existem no jogo e ficam para depois do MVP.
export function Hud() {
  const { data, error, selectedSeed, selectSeed } = useGameStore()

  // Teclas 1 a 9 escolhem o item do slot correspondente (só existem slots para o que o jogador tem)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const { data, selectSeed } = useGameStore.getState()
      const crop = data && ownedSeeds(data.inventory)[Number(e.key) - 1]
      if (crop) selectSeed(crop)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!data) return null
  const owned = ownedSeeds(data.inventory)

  return (
    <>
      {/* Coluna da esquerda: jogador em cima e menu logo abaixo, sem sobrepor */}
      <div className="hud-left">
        <ProfileMenu />
        <SideMenu />
      </div>

      <DayClock time={data.time} day={data.day} />

      <div className="panel hud-hotbar">
        {Array.from({ length: HOTBAR_SLOTS }, (_, i) => {
          const crop = owned[i]
          const info = crop && CROPS[crop]
          return (
            <button
              key={i}
              className={`slot ${crop && crop === selectedSeed ? 'selected' : ''}`}
              disabled={!crop}
              onClick={() => crop && selectSeed(crop)}
              title={info ? `Semente de ${info.name.toLowerCase()} — amadurece em ${formatDuration(info.growSeconds)}, vende por ${info.sellPrice}` : undefined}
            >
              <span className="slot-key">{i + 1}</span>
              {crop && <CropIcon crop={crop} size={34} />}
              {crop && <span className="slot-qty">{data.inventory[crop] ?? 0}</span>}
            </button>
          )
        })}
      </div>

      {error && (
        <div className="hud-save">
          <span className="error">{error}</span>
        </div>
      )}
    </>
  )
}

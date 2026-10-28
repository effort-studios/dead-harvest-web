import { useEffect } from 'react'
import { CROPS, formatDuration } from '@/features/farm/model/crops'
import { FERTILIZER, GROWTH_BONUS, WATERING_CAN } from '@/features/farm/model/production'
import { harvestables, hotbarCount, hotbarItems, type HotbarItem } from '@/features/farm/model/state'
import { serverNow, useFarmStore } from '../store'
import { CropIcon } from './icons'
import { CanIcon, ItemIcon } from './itemIcons'
import { ProfileMenu } from '@/features/profile/components/ProfileMenu'
import { BuildingPanel } from './BuildingPanel'
import { DayClock } from './DayClock'
import { SideMenu } from './SideMenu'
import { MusicPlayer } from './MusicPlayer'

const pct = (bonus: number) => `${Math.round(bonus * 100)}%`

function slotTitle(item: HotbarItem) {
  if (item === 'fertilizer') return `Adubo — clique na terra arada ou na planta: ela cresce ${pct(GROWTH_BONUS.fertilizer)} mais rápido`
  if (item === 'can')
    return `Regador (${WATERING_CAN.charges} cargas) — clique na terra arada ou na planta: ela cresce ${pct(GROWTH_BONUS.water)} mais rápido. Encha no poço`
  const info = CROPS[item]
  return `Semente de ${info.name.toLowerCase()} — amadurece em ${formatDuration(info.growSeconds)}, a colheita vale ${info.sellPrice}`
}

const HOTBAR_SLOTS = 9

// HUD inspirada na prévia: jogador e dinheiro (canto superior esquerdo),
// dia (canto superior direito), barra de itens (embaixo) e erros de salvamento (embaixo à esquerda).
// Vida, energia, missões e minimapa ainda não existem no jogo e ficam para depois do MVP.
export function Hud({ onLogout }: { onLogout: () => void }) {
  const { data, error, selected, select, cancelQueue, harvestAll } = useFarmStore()

  // Teclas 1 a 9 escolhem o item do slot correspondente (só existem slots para o que o jogador tem)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const { data, select } = useFarmStore.getState()
      const item = data && hotbarItems(data)[Number(e.key) - 1]
      if (item) select(item)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!data) return null
  const owned = hotbarItems(data)
  const ready = harvestables(data, serverNow())
  const readyCount = ready.plots.reduce((n, p) => n + p.tiles.length, 0) + ready.trees.length

  return (
    <>
      {/* Coluna da esquerda: jogador em cima e menu logo abaixo, sem sobrepor */}
      <div className="hud-left">
        <ProfileMenu money={data.money} onLogout={onLogout} />
        <SideMenu />
      </div>

      <DayClock time={data.time} day={data.day} />
      <MusicPlayer />
      <BuildingPanel />

      <div className="panel hud-hotbar">
        {Array.from({ length: HOTBAR_SLOTS }, (_, i) => {
          const item = owned[i]
          return (
            <button
              key={i}
              className={`slot ${item && item === selected ? 'selected' : ''}`}
              disabled={!item}
              onClick={() => item && select(item)}
              title={item ? slotTitle(item) : undefined}
            >
              <span className="slot-key">{i + 1}</span>
              {item && (item === 'fertilizer' ? <ItemIcon itemId={FERTILIZER.itemId} size={34} /> : item === 'can' ? <CanIcon size={34} /> : <CropIcon crop={item} size={34} />)}
              {item && <span className="slot-qty">{hotbarCount(data, item)}</span>}
            </button>
          )
        })}
      </div>

      {(error || data.farmer.jobs.length > 0 || readyCount > 0) && (
        <div className="hud-save">
          {readyCount > 0 && (
            <button className="btn" onClick={harvestAll} title="O fazendeiro colhe tudo que está pronto: plantas e árvores">
              Colher tudo ({readyCount})
            </button>
          )}
          {data.farmer.jobs.length > 0 && (
            <button className="btn danger" onClick={cancelQueue} title="Cancela as tarefas que ele ainda não fez; ele para onde está">
              Parar fazendeiro ({data.farmer.jobs.length})
            </button>
          )}
          {error && <span className="error">{error}</span>}
        </div>
      )}
    </>
  )
}

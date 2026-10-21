import { useEffect } from 'react'
import { CROP_ORDER, CROPS } from '../game/crops'
import { useGameStore } from '../store/gameStore'
import { CoinIcon, SunIcon } from './GameIcons'
import { CropIcon } from './CropIcon'
import { Icon } from './Icon'

const HOTBAR_SLOTS = 9

// HUD inspirada na prévia: jogador e dinheiro (canto superior esquerdo),
// dia (canto superior direito), barra de itens (embaixo) e salvar (embaixo à esquerda).
// Vida, energia, missões e minimapa ainda não existem no jogo e ficam para depois do MVP.
export function Hud() {
  const { data, saving, error, save, selectedSeed, selectSeed } = useGameStore()

  // Teclas 1, 2, 3... escolhem a semente do slot correspondente
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const crop = CROP_ORDER[Number(e.key) - 1]
      if (crop) useGameStore.getState().selectSeed(crop)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!data) return null

  return (
    <>
      <div className="panel hud-player">
        <div className="portrait">
          <Icon name="singleplayer" size={26} />
        </div>
        <div>
          <div className="player-name">Convidado</div>
          <div className="money">
            <CoinIcon size={22} /> {data.money}
          </div>
        </div>
      </div>

      <div className="panel hud-clock">
        <SunIcon size={28} />
        <span>Dia {data.day}</span>
      </div>

      <div className="panel hud-hotbar">
        {Array.from({ length: HOTBAR_SLOTS }, (_, i) => {
          const crop = CROP_ORDER[i]
          const info = crop && CROPS[crop]
          return (
            <button
              key={i}
              className={`slot ${crop && crop === selectedSeed ? 'selected' : ''}`}
              disabled={!crop}
              onClick={() => crop && selectSeed(crop)}
              title={info ? `Semente de ${info.name.toLowerCase()} — amadurece em ${info.growTicks}s, vende por ${info.sellPrice}` : undefined}
            >
              <span className="slot-key">{i + 1}</span>
              {crop && <CropIcon crop={crop} size={34} />}
              {crop && <span className="slot-qty">{data.inventory[crop] ?? 0}</span>}
            </button>
          )
        })}
      </div>

      <div className="hud-save">
        <button className="btn" onClick={save} disabled={saving}>
          <Icon name="save" size={16} /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
        {error && <span className="error">{error}</span>}
      </div>
    </>
  )
}

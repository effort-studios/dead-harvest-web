import { SACK_ICON_URL } from '../render/sprites'
import { useGameStore } from '../store/gameStore'

const HOTBAR_SLOTS = 9

// HUD inspirada na prévia: jogador e dinheiro (canto superior esquerdo),
// dia (canto superior direito), barra de itens (embaixo) e salvar (embaixo à esquerda).
// Vida, energia, missões e minimapa ainda não existem no jogo e ficam para depois do MVP.
export function Hud() {
  const { data, saving, error, save } = useGameStore()
  if (!data) return null

  const items = Object.entries(data.inventory)

  return (
    <>
      <div className="panel hud-player">
        <div className="portrait">🧑‍🌾</div>
        <div>
          <div className="player-name">Convidado</div>
          <div className="money">🪙 {data.money}</div>
        </div>
      </div>

      <div className="panel hud-clock">
        <span className="clock-icon">☀️</span>
        <span>Dia {data.day}</span>
      </div>

      <div className="panel hud-hotbar">
        {Array.from({ length: HOTBAR_SLOTS }, (_, i) => {
          const item = items[i]
          return (
            <div key={i} className="slot" title={item?.[0]}>
              <span className="slot-key">{i + 1}</span>
              {item && <img src={SACK_ICON_URL} alt={item[0]} />}
              {item && <span className="slot-qty">{item[1]}</span>}
            </div>
          )
        })}
      </div>

      <div className="hud-save">
        <button className="panel" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : '💾 Salvar'}
        </button>
        {error && <span className="error">{error}</span>}
      </div>
    </>
  )
}

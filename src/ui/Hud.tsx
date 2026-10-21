import { SPRITE } from '../render/sprites'
import { useGameStore } from '../store/gameStore'
import { Sprite } from './Sprite'

// Layout inspirado na prévia: dinheiro no canto superior esquerdo,
// dia no canto superior direito, barra de itens embaixo.
export function Hud() {
  const { data, saving, error, save } = useGameStore()
  if (!data) return null

  return (
    <>
      <div className="hud-box hud-top-left">
        <Sprite index={SPRITE.coin} /> {data.money}
      </div>
      <div className="hud-box hud-top-right">☀️ Dia {data.day}</div>
      <div className="hud-box hud-bottom">
        {Object.entries(data.inventory).map(([crop, qty], i) => (
          <div key={crop} className="slot" title={crop}>
            <span className="slot-key">{i + 1}</span>
            <Sprite index={SPRITE.sprout} />
            <span className="slot-qty">{qty}</span>
          </div>
        ))}
        <button onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        {error && <span className="error">{error}</span>}
      </div>
    </>
  )
}

import { useGameStore } from '../store/gameStore'

// Layout inspirado na prévia: dinheiro no canto superior esquerdo,
// dia no canto superior direito, barra de itens embaixo.
export function Hud() {
  const { data, saving, error, save } = useGameStore()
  if (!data) return null

  return (
    <>
      <div className="hud-box hud-top-left">💰 {data.money}</div>
      <div className="hud-box hud-top-right">☀️ Dia {data.day}</div>
      <div className="hud-box hud-bottom">
        {Object.entries(data.inventory).map(([crop, qty]) => (
          <span key={crop} className="slot">🌱 {crop} x{qty}</span>
        ))}
        <button onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        {error && <span className="error">{error}</span>}
      </div>
    </>
  )
}

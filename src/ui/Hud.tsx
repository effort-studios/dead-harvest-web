import { useGameStore } from '../store/gameStore'

export function Hud() {
  const { data, saving, error, save, addMoney } = useGameStore()
  if (!data) return null

  return (
    <div className="hud">
      <span>Dia {data.day}</span>
      <span>💰 {data.money}</span>
      <span>🌱 {Object.entries(data.inventory).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>
      <button onClick={() => addMoney(10)}>+10 (teste)</button>
      <button onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
      {error && <span className="error">{error}</span>}
    </div>
  )
}

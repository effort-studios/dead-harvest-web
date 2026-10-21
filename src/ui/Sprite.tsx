import { SHEET_COLS, SHEET_URL, SRC_SIZE } from '../render/sprites'

const SCALE = 2

// Mostra um tile do tilemap numa <div> (para usar no HUD)
export function Sprite({ index }: { index: number }) {
  const col = index % SHEET_COLS
  const row = Math.floor(index / SHEET_COLS)
  return (
    <div
      className="sprite"
      style={{
        width: SRC_SIZE * SCALE,
        height: SRC_SIZE * SCALE,
        backgroundImage: `url(${SHEET_URL})`,
        backgroundSize: `${SHEET_COLS * SRC_SIZE * SCALE}px auto`,
        backgroundPosition: `-${col * SRC_SIZE * SCALE}px -${row * SRC_SIZE * SCALE}px`,
      }}
    />
  )
}

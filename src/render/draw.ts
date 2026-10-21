import { GRID_SIZE } from '../game/state'
import type { Tile } from '../game/types'

export const TILE_SIZE = 48
export const CANVAS_SIZE = GRID_SIZE * TILE_SIZE

const COLORS = {
  soil: '#4f8a3c', // grama
  tilled: '#6b4a2b', // terra arada
  furrow: '#4f3720',
  line: 'rgba(0,0,0,0.25)',
  plant: '#7bd957',
}

function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number) {
  ctx.fillStyle = tile.state === 'soil' ? COLORS.soil : COLORS.tilled
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)

  if (tile.state !== 'soil') {
    // sulcos da terra arada
    ctx.fillStyle = COLORS.furrow
    for (let i = 1; i <= 3; i++) ctx.fillRect(x + 6, y + i * 11, TILE_SIZE - 12, 3)
  }
  if (tile.state === 'planted') {
    // brotinho: um círculo verde
    ctx.fillStyle = COLORS.plant
    ctx.beginPath()
    ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 10, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = COLORS.line
  ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1)
}

export function drawWorld(ctx: CanvasRenderingContext2D, grid: Tile[][]) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  grid.forEach((row, r) => row.forEach((tile, c) => drawTile(ctx, tile, c * TILE_SIZE, r * TILE_SIZE)))
}

// Converte um ponto em pixels do canvas em linha/coluna da grade
export function tileFromPoint(x: number, y: number) {
  const col = Math.floor(x / TILE_SIZE)
  const row = Math.floor(y / TILE_SIZE)
  if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE) return null
  return { row, col }
}

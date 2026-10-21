import { GRID_SIZE } from '../game/state'
import type { Tile } from '../game/types'
import { drawSprite, SPRITE } from './sprites'

export const TILE_SIZE = 48 // 16px do sprite ampliado 3x

// O mundo é maior que a plantação: tem casa, cerca e árvores em volta
const WORLD_COLS = 28 // 28x16 = formato widescreen, para ocupar a largura da janela
const WORLD_ROWS = 16
// Posição (em tiles) do canto da plantação dentro do mundo (centralizada)
const FIELD_COL = 9
const FIELD_ROW = 4

export const CANVAS_WIDTH = WORLD_COLS * TILE_SIZE
export const CANVAS_HEIGHT = WORLD_ROWS * TILE_SIZE

function put(ctx: CanvasRenderingContext2D, img: HTMLImageElement, sprite: number, col: number, row: number) {
  drawSprite(ctx, img, sprite, col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE)
}

// Cenário que não muda: grama, casa, cerca e árvores
function drawScenery(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  for (let r = 0; r < WORLD_ROWS; r++) {
    for (let c = 0; c < WORLD_COLS; c++) {
      // variação fixa (sem aleatório) para a grama não "piscar" a cada desenho
      const n = (r * 7 + c * 13) % 11
      put(ctx, img, n === 0 ? SPRITE.grassFlowers : n < 4 ? SPRITE.grassTufts : SPRITE.grass, c, r)
    }
  }

  // Cerca em volta da plantação
  const top = FIELD_ROW - 1
  const bottom = FIELD_ROW + GRID_SIZE
  const left = FIELD_COL - 1
  const right = FIELD_COL + GRID_SIZE
  for (let c = left + 1; c < right; c++) {
    put(ctx, img, SPRITE.fenceTop, c, top)
    put(ctx, img, SPRITE.fenceBottom, c, bottom)
  }
  for (let r = top + 1; r < bottom; r++) {
    put(ctx, img, SPRITE.fenceLeft, left, r)
    put(ctx, img, SPRITE.fenceRight, right, r)
  }
  put(ctx, img, SPRITE.fenceTL, left, top)
  put(ctx, img, SPRITE.fenceTR, right, top)
  put(ctx, img, SPRITE.fenceBL, left, bottom)
  put(ctx, img, SPRITE.fenceBR, right, bottom)

  // Casa (3x3 tiles) acima da cerca
  const house = [
    [SPRITE.roofL, SPRITE.roofM, SPRITE.roofR],
    [SPRITE.roof2L, SPRITE.roof2M, SPRITE.roof2R],
    [SPRITE.window, SPRITE.door, SPRITE.window],
  ]
  const houseCol = FIELD_COL + 4
  house.forEach((row, r) => row.forEach((s, c) => put(ctx, img, s, houseCol + c, r)))

  // Árvores e arbustos: floresta nas laterais, só alguns na borda de cima e de baixo
  const plants = [SPRITE.pine, SPRITE.tree, SPRITE.bush, SPRITE.pine]
  for (let r = 0; r < WORLD_ROWS; r++) {
    for (let c = 0; c < WORLD_COLS; c++) {
      const besideField = c >= left - 1 && c <= right + 1
      const inHouse = r < 3 && c >= houseCol - 1 && c <= houseCol + 3
      if (inHouse) continue
      if (besideField && r !== 0 && r !== WORLD_ROWS - 1) continue // deixa a grama perto da cerca
      const n = (r * 3 + c * 5) % 7
      if (n < 4) put(ctx, img, plants[(r + c) % plants.length], c, r) // posições fixas, sem aleatório
    }
  }
}

function drawTile(ctx: CanvasRenderingContext2D, img: HTMLImageElement, tile: Tile, col: number, row: number) {
  const c = FIELD_COL + col
  const r = FIELD_ROW + row
  if (tile.state === 'soil') return // o cenário já desenhou a grama
  put(ctx, img, SPRITE.dirt, c, r)
  if (tile.state === 'planted') put(ctx, img, SPRITE.sprout, c, r)
}

export function drawWorld(ctx: CanvasRenderingContext2D, img: HTMLImageElement, grid: Tile[][]) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  drawScenery(ctx, img)
  grid.forEach((row, r) => row.forEach((tile, c) => drawTile(ctx, img, tile, c, r)))
}

// Converte um ponto em pixels do canvas em linha/coluna da plantação (ou null se fora dela)
export function tileFromPoint(x: number, y: number) {
  const col = Math.floor(x / TILE_SIZE) - FIELD_COL
  const row = Math.floor(y / TILE_SIZE) - FIELD_ROW
  if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE) return null
  return { row, col }
}

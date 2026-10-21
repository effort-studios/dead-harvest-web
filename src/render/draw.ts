import { CROPS, isCropId, type CropId } from '../game/crops'
import { GRID_SIZE, tilesInMode, type ClickMode } from '../game/state'
import type { Tile } from '../game/types'
import { CROP_SVG_ANCHOR, CROP_SVG_SIZE } from './cropSvgs'
import { isCropSprite, SPRITE_ANCHOR, SPRITE_SIZE, type SpriteName, type Sprites } from './sprites'

// Projeção isométrica: cada tile é um losango com o dobro de largura que de altura.
// A célula (linha r, coluna c) fica no mundo em:
//   x = ORIGIN_X + (c - r) * HALF_W
//   y = ORIGIN_Y + (c + r) * HALF_H
// "Mundo" é o espaço de coordenadas do jogo; a câmera decide qual parte dele aparece na tela.
const SCALE = 0.375 // os sprites têm 256px de largura; no mundo ficam com 96px
const HALF_W = (SPRITE_SIZE.width / 2) * SCALE // 48
const HALF_H = (SPRITE_SIZE.width / 4) * SCALE // 24

// Área principal do mundo (a plantação e os objetos em volta ficam dentro dela)
const WORLD_WIDTH = 1600
const WORLD_HEIGHT = 900
const ORIGIN_X = WORLD_WIDTH / 2
const ORIGIN_Y = 254 // posição do tile (0,0)

// Câmera: ponto do mundo que aparece no centro da tela, mais o zoom
export type Camera = { x: number; y: number; zoom: number }
export type Hover = { row: number; col: number; mode: ClickMode }
export type Size = { width: number; height: number }

export const INITIAL_CAMERA = { x: WORLD_WIDTH / 2, y: 470 }

// Zoom que faz a plantação e o cenário caberem na janela, seja ela pequena ou grande
export function fitZoom({ width, height }: Size) {
  return Math.min(Math.max(Math.min(width / 1500, height / 850), 0.4), 1.6)
}

// Impede o centro da câmera de sair da área do jogo (o mapa não "foge" da tela)
export function clampCamera(x: number, y: number) {
  return {
    x: Math.min(Math.max(x, 200), WORLD_WIDTH - 200),
    y: Math.min(Math.max(y, 150), WORLD_HEIGHT - 150),
  }
}

// Ponto da tela (px relativos ao canvas) -> ponto do mundo
export function screenToWorld(sx: number, sy: number, cam: Camera, size: Size) {
  return {
    x: cam.x + (sx - size.width / 2) / cam.zoom,
    y: cam.y + (sy - size.height / 2) / cam.zoom,
  }
}

function cellToWorld(r: number, c: number) {
  return { x: ORIGIN_X + (c - r) * HALF_W, y: ORIGIN_Y + (c + r) * HALF_H }
}

// Converte um ponto do mundo na célula da plantação (ou null se fora dela).
// É a conta inversa da fórmula acima.
export function tileFromWorld(wx: number, wy: number) {
  const a = (wx - ORIGIN_X) / HALF_W // = c - r
  const b = (wy - ORIGIN_Y) / HALF_H // = c + r
  const col = Math.round((a + b) / 2)
  const row = Math.round((b - a) / 2)
  if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE) return null
  return { row, col }
}

// Item a desenhar: um sprite numa célula
type Item = { r: number; c: number; sprite: SpriteName }

// Objetos soltos em volta da plantação (r/c fora da grade 0..9)
const DECOR: Item[] = [
  { r: -2, c: 3, sprite: 'hayBalesStacked_S' },
  { r: -2, c: 6, sprite: 'hayBales_S' },
  { r: -3, c: 9, sprite: 'sack_S' },
  { r: 4, c: -3, sprite: 'planks_S' },
  { r: 11, c: 2, sprite: 'hayBales_S' },
  { r: 12, c: 6, sprite: 'sack_S' },
  { r: 6, c: 12, sprite: 'planks_S' },
  { r: 3, c: 11, sprite: 'hayBalesStacked_S' },
]

// Tamanho e ponto de apoio (no chão) de cada tipo de sprite, já em coordenadas do mundo
const ISO_FRAME = {
  w: SPRITE_SIZE.width * SCALE,
  h: SPRITE_SIZE.height * SCALE,
  ax: SPRITE_ANCHOR.x * SCALE,
  ay: SPRITE_ANCHOR.y * SCALE,
}
const CROP_SCALE = 1.2 // tamanho do SVG da planta em relação ao pixel do mundo
const CROP_FRAME = {
  w: CROP_SVG_SIZE * CROP_SCALE,
  h: CROP_SVG_SIZE * CROP_SCALE,
  ax: CROP_SVG_ANCHOR.x * CROP_SCALE,
  ay: CROP_SVG_ANCHOR.y * CROP_SCALE,
}

const GRASS = ['#6aa84f', '#65a04b', '#6fae53', '#62994a', '#6cab51']

const FLAT_SPRITES = new Set<SpriteName>(['dirt_S', 'dirtFarmland_S'])

function diamondPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath()
  ctx.moveTo(x, y - h)
  ctx.lineTo(x + w, y)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x - w, y)
  ctx.closePath()
}

type Rect = { left: number; top: number; right: number; bottom: number }

// Grama: losangos verdes (não existe sprite de grama no pacote). Só desenha os visíveis.
function drawGround(ctx: CanvasRenderingContext2D, view: Rect) {
  const w = HALF_W + 0.75 // um pouco maior para não aparecerem frestas entre losangos
  const h = HALF_H + 0.4
  for (let r = -40; r <= 60; r++) {
    for (let c = -40; c <= 60; c++) {
      const { x, y } = cellToWorld(r, c)
      if (x < view.left - w || x > view.right + w || y < view.top - h || y > view.bottom + h) continue
      ctx.fillStyle = GRASS[Math.abs(r * 7 + c * 13) % GRASS.length] // variação fixa, sem aleatório
      ctx.beginPath()
      ctx.moveTo(x, y - h)
      ctx.lineTo(x + w, y)
      ctx.lineTo(x, y + h)
      ctx.lineTo(x - w, y)
      ctx.closePath()
      ctx.fill()
    }
  }
}

// Estágio de crescimento: 0 = broto, 1 = crescendo, 2 = madura
function stageOf(crop: CropId, growth: number): 0 | 1 | 2 {
  const progress = growth / CROPS[crop].growTicks
  return progress >= 1 ? 2 : progress >= 0.4 ? 1 : 0
}

// Sprite da planta no tile. O milho usa o pacote isométrico; tomate e abóbora, os SVGs próprios.
function cropItem(r: number, c: number, crop: CropId, growth: number): Item {
  const stage = stageOf(crop, growth)
  if (crop === 'corn') return { r, c, sprite: (['cornYoung_S', 'cornYoungDouble_S', 'corn_S'] as const)[stage] }
  return { r, c, sprite: `${crop}_${stage}` }
}

// Lista tudo que fica de pé sobre o mapa, na ordem em que cada sprite deve ser desenhado
function buildItems(grid: Tile[][]): Item[] {
  const items: Item[] = [...DECOR]
  const last = GRID_SIZE - 1
  grid.forEach((row, r) =>
    row.forEach((tile, c) => {
      // terra sem arar continua sendo grama; só a arada mostra o sprite de terra
      if (tile.state !== 'soil') items.push({ r, c, sprite: 'dirtFarmland_S' })
      // cerca nas bordas da plantação; as de trás (cima/esquerda) vêm antes da planta
      if (r === 0) items.push({ r, c, sprite: 'fenceLow_S' })
      if (c === 0) items.push({ r, c, sprite: 'fenceLow_E' })
      if (tile.state === 'planted' && isCropId(tile.crop)) items.push(cropItem(r, c, tile.crop, tile.growth))
      // as da frente (baixo/direita) vêm depois, para cobrir a planta
      if (r === last) items.push({ r, c, sprite: 'fenceLow_N' })
      if (c === last) items.push({ r, c, sprite: 'fenceLow_W' })
    }),
  )
  // Quem está mais ao fundo (menor r + c) é desenhado primeiro. O sort é estável,
  // então itens da mesma célula mantêm a ordem em que foram inseridos acima.
  return items.sort((a, b) => a.r + a.c - (b.r + b.c))
}

// pixelRatio = resolução real da tela (telas retina têm 2 ou mais pixels por pixel CSS)
export function drawWorld(
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  grid: Tile[][],
  cam: Camera,
  size: Size,
  pixelRatio: number,
  hover: Hover | null,
) {
  // Transformação: mundo -> tela. Daqui em diante desenhamos em coordenadas do mundo.
  const k = cam.zoom * pixelRatio
  ctx.setTransform(k, 0, 0, k, (size.width / 2 - cam.x * cam.zoom) * pixelRatio, (size.height / 2 - cam.y * cam.zoom) * pixelRatio)
  ctx.imageSmoothingQuality = 'high'

  const topLeft = screenToWorld(0, 0, cam, size)
  const bottomRight = screenToWorld(size.width, size.height, cam, size)
  const view: Rect = { left: topLeft.x, top: topLeft.y, right: bottomRight.x, bottom: bottomRight.y }

  drawGround(ctx, view) // a grama cobre a tela toda, então não precisa limpar antes
  for (const { r, c, sprite } of buildItems(grid)) {
    const { x, y } = cellToWorld(r, c)
    const frame = isCropSprite(sprite) ? CROP_FRAME : ISO_FRAME
    // Terra é uma laje com espessura; recortamos só o topo (losango) para ficar rente à grama
    const flat = FLAT_SPRITES.has(sprite)
    if (flat) {
      ctx.save()
      diamondPath(ctx, x, y, HALF_W + 0.5, HALF_H + 0.25)
      ctx.clip()
    }
    ctx.drawImage(sprites[sprite], x - frame.ax, y - frame.ay, frame.w, frame.h)
    if (flat) ctx.restore()
  }

  // Contorno no tile sob o mouse (ou na linha/coluna inteira com Shift/Ctrl)
  if (hover) {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 3
    for (const t of tilesInMode(hover.mode, hover.row, hover.col)) {
      const { x, y } = cellToWorld(t.row, t.col)
      diamondPath(ctx, x, y, HALF_W, HALF_H)
      ctx.stroke()
    }
  }
}

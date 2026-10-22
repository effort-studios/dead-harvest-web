import { CROPS, isCropId, type CropId } from '../game/crops'
import { GRID_SIZE, tilesInMode, type ClickMode } from '../game/state'
import type { Tile } from '../game/types'
import { CROP_SVG_ANCHOR, CROP_SVG_SIZE } from './cropSvgs'
import { createGrassPattern } from './grass'
import { createSoilTiles, drawGrassFringe, drawSoilEdges, EDGE } from './soil'
import { FRUITS, TREES } from '../game/trees'
import { drawFence, drawProp, TILE_HALF, TREE_HIT, type PropKind } from './props'
import type { SpriteName, Sprites } from './sprites'

// Projeção isométrica: cada tile é um losango com o dobro de largura que de altura.
// A célula (linha r, coluna c) fica no mundo em:
//   x = ORIGIN_X + (c - r) * HALF_W
//   y = ORIGIN_Y + (c + r) * HALF_H
// "Mundo" é o espaço de coordenadas do jogo; a câmera decide qual parte dele aparece na tela.
const HALF_W = TILE_HALF.w // 48: cada tile tem 96 de largura...
const HALF_H = TILE_HALF.h // 24: ...e 48 de altura

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

// Id da árvore sob o ponto (coordenadas do mundo), se houver; a mais da frente ganha
export function treeAt(wx: number, wy: number): string | null {
  const k = 1.5 // mesma escala de PROP_SCALE.tree
  let found: { id: string; depth: number } | null = null
  for (const t of TREES) {
    const { x, y } = cellToWorld(t.r, t.c)
    const nx = (wx - (x + TREE_HIT.dx * k)) / (TREE_HIT.rx * k)
    const ny = (wy - (y + TREE_HIT.dy * k)) / (TREE_HIT.ry * k)
    if (nx * nx + ny * ny <= 1 && (!found || t.r + t.c > found.depth)) found = { id: t.id, depth: t.r + t.c }
  }
  return found?.id ?? null
}

// Lado de um tile onde fica um trecho de cerca (o nome vem do ponto cardeal na grade)
type Edge = 'N' | 'E' | 'S' | 'W'

// Item a desenhar numa célula. Cada item é de um só tipo:
// sprite (planta), soil (terra arada + máscara dos lados que dão para a grama),
// fence (trecho de cerca) ou prop (objeto do cenário)
type Item = { r: number; c: number; sprite?: SpriteName; soil?: number; fence?: Edge; prop?: PropKind; fruitColor?: string }

// Objetos soltos em volta da plantação (r/c fora da grade 0..9)
const prop = (kind: PropKind, r: number, c: number): Item => ({ r, c, prop: kind })
const DECOR: Item[] = [
  prop('hayStack', -2, 3), prop('hay', -2, 6), prop('sack', -3, 9), prop('platform', 4, -3),
  prop('hay', 11, 2), prop('sack', 12, 6), prop('platform', 6, 12), prop('hayStack', 3, 11),
  prop('bush', -3, 6), prop('bush', 5, -2), prop('bush', -2, -1), prop('bush', 13, 9),
  prop('rock', 11, 8), prop('rock', 9, 12), prop('rock', -1, 12), prop('rock', 7, -3),
]

// Tamanho e ponto de apoio (no chão) dos sprites das plantas, em coordenadas do mundo
const CROP_SCALE = 1.2 // tamanho do SVG da planta em relação ao pixel do mundo
const CROP_FRAME = {
  w: CROP_SVG_SIZE * CROP_SCALE,
  h: CROP_SVG_SIZE * CROP_SCALE,
  ax: CROP_SVG_ANCHOR.x * CROP_SCALE,
  ay: CROP_SVG_ANCHOR.y * CROP_SCALE,
}

function diamondPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath()
  ctx.moveTo(x, y - h)
  ctx.lineTo(x + w, y)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x - w, y)
  ctx.closePath()
}

type Rect = { left: number; top: number; right: number; bottom: number }

// Grama: textura repetida cobrindo a área visível. O padrão é definido em coordenadas do
// mundo, então acompanha o mapa quando a câmera se move.
let grassPattern: CanvasPattern | null = null

function drawGround(ctx: CanvasRenderingContext2D, view: Rect) {
  grassPattern ??= createGrassPattern(ctx)
  ctx.fillStyle = grassPattern ?? '#69ab4d'
  ctx.fillRect(view.left - 2, view.top - 2, view.right - view.left + 4, view.bottom - view.top + 4)
}

// Estágio de crescimento: 0 = broto, 1 = crescendo, 2 = madura
function stageOf(crop: CropId, growth: number): 0 | 1 | 2 {
  const progress = growth / CROPS[crop].growTicks
  return progress >= 1 ? 2 : progress >= 0.4 ? 1 : 0
}

// Sprite da planta no tile (SVGs de src/render/cropSvgs.ts)
function cropItem(r: number, c: number, crop: CropId, growth: number): Item {
  return { r, c, sprite: `${crop}_${stageOf(crop, growth)}` }
}

const tilled = (grid: Tile[][], r: number, c: number) => (grid[r]?.[c]?.state ?? 'soil') !== 'soil'

// Quais lados do tile não têm terra arada ao lado (viram borda com a grama)
function soilEdges(grid: Tile[][], r: number, c: number) {
  let mask = 0
  if (!tilled(grid, r - 1, c)) mask |= EDGE.north
  if (!tilled(grid, r, c + 1)) mask |= EDGE.east
  if (!tilled(grid, r + 1, c)) mask |= EDGE.south
  if (!tilled(grid, r, c - 1)) mask |= EDGE.west
  return mask
}

// Terra arada: desenhada por código (soil.ts) uma vez, em alta resolução
const SOIL_GEO = { halfW: HALF_W, halfH: HALF_H }
let soilTiles: HTMLCanvasElement[] | null = null

// Lista tudo que fica de pé sobre o mapa, na ordem em que cada item deve ser desenhado
function buildItems(grid: Tile[][], readyTrees: ReadonlySet<string>): Item[] {
  const items: Item[] = [...DECOR]
  // árvores frutíferas: mostram as frutas só quando há o que colher
  for (const t of TREES) {
    items.push({ r: t.r, c: t.c, prop: 'tree', fruitColor: readyTrees.has(t.id) ? FRUITS[t.fruit].color : undefined })
  }
  const last = GRID_SIZE - 1
  grid.forEach((row, r) =>
    row.forEach((tile, c) => {
      // terra sem arar continua sendo grama; só a arada (ou plantada) mostra terra
      if (tile.state !== 'soil') items.push({ r, c, soil: soilEdges(grid, r, c) })
      // cerca nas bordas da plantação; as de trás (cima/esquerda) vêm antes da planta
      if (r === 0) items.push({ r, c, fence: 'N' })
      if (c === 0) items.push({ r, c, fence: 'W' })
      if (tile.state === 'planted' && isCropId(tile.crop)) items.push(cropItem(r, c, tile.crop, tile.growth))
      // as da frente (baixo/direita) vêm depois, para cobrir a planta
      if (r === last) items.push({ r, c, fence: 'S' })
      if (c === last) items.push({ r, c, fence: 'E' })
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
  readyTrees: ReadonlySet<string>,
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

  const items = buildItems(grid, readyTrees)
  // 1ª passada: a terra, que é chão. Assim ela nunca cobre plantas ou cercas de outros tiles.
  soilTiles ??= createSoilTiles(SOIL_GEO, 3, (w, h) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    return canvas
  })
  for (const { r, c, soil } of items) {
    if (soil === undefined) continue
    const { x, y } = cellToWorld(r, c)
    ctx.drawImage(soilTiles[(r * 7 + c * 13) % soilTiles.length], x - HALF_W, y - HALF_H, HALF_W * 2, HALF_H * 2)
    drawSoilEdges(ctx, x, y, SOIL_GEO, soil)
    drawGrassFringe(ctx, x, y, SOIL_GEO, soil)
  }
  // 2ª passada: tudo que fica de pé, do fundo para a frente
  for (const { r, c, sprite, fence, prop: kind, fruitColor } of items) {
    const { x, y } = cellToWorld(r, c)
    if (fence) {
      // pontas do lado do losango: N = topo->direita, E = direita->baixo, S = baixo->esquerda, W = esquerda->topo
      const top: [number, number] = [x, y - HALF_H]
      const right: [number, number] = [x + HALF_W, y]
      const bottom: [number, number] = [x, y + HALF_H]
      const left: [number, number] = [x - HALF_W, y]
      const [a, b] = { N: [top, right], E: [right, bottom], S: [bottom, left], W: [left, top] }[fence]
      drawFence(ctx, a[0], a[1], b[0], b[1])
    } else if (kind) {
      drawProp(ctx, kind, x, y, fruitColor)
    } else if (sprite) {
      ctx.drawImage(sprites[sprite], x - CROP_FRAME.ax, y - CROP_FRAME.ay, CROP_FRAME.w, CROP_FRAME.h)
    }
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

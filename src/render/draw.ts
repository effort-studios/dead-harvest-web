import { CROPS, isCropId, type CropId } from '../game/crops'
import { GRID_SIZE, PLOT_STEP, tilesInMode, type ClickMode } from '../game/state'
import type { Plot, Tile } from '../game/types'
import { CROP_SVG_ANCHOR, CROP_SVG_SIZE } from './cropSvgs'
import { createGrassPattern } from './grass'
import { createSoilTiles, drawGrassFringe, drawSoilEdges, EDGE } from './soil'
import { drawFence, drawProp, TILE_HALF, type PropKind } from './props'
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
// Sob o mouse: um tile de um terreno (plot = índice em plots) ou, na compra, um terreno livre
export type Hover = { kind: 'tile'; plot: number; row: number; col: number; mode: ClickMode } | { kind: 'slot'; x: number; y: number }
export type Slot = { x: number; y: number }
export type Size = { width: number; height: number }

export const INITIAL_CAMERA = { x: WORLD_WIDTH / 2, y: 470 }

// Zoom que faz a plantação e o cenário caberem na janela, seja ela pequena ou grande
export function fitZoom({ width, height }: Size) {
  return Math.min(Math.max(Math.min(width / 1500, height / 850), 0.4), 1.6)
}

// Área do jogo: a área principal mais os terrenos (e uma fileira de posições livres em volta)
function worldBounds(plots: Plot[]) {
  let left = 0, top = 0, right = WORLD_WIDTH, bottom = WORLD_HEIGHT
  for (const { x, y } of plots) {
    for (const [dx, dy] of [[-1, -1], [2, -1], [-1, 2], [2, 2]]) {
      const p = cellToWorld((y + dy) * PLOT_STEP, (x + dx) * PLOT_STEP)
      left = Math.min(left, p.x - HALF_W)
      right = Math.max(right, p.x + HALF_W)
      top = Math.min(top, p.y - HALF_H)
      bottom = Math.max(bottom, p.y + HALF_H)
    }
  }
  return { left, top, right, bottom }
}

// Impede o centro da câmera de sair da área do jogo (o mapa não "foge" da tela)
export function clampCamera(x: number, y: number, plots: Plot[]) {
  const b = worldBounds(plots)
  return {
    x: Math.min(Math.max(x, b.left + 200), b.right - 200),
    y: Math.min(Math.max(y, b.top + 150), b.bottom - 150),
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

// Converte um ponto do mundo na célula global do mapa (contando todos os terrenos).
// É a conta inversa da fórmula acima.
export function tileFromWorld(wx: number, wy: number) {
  const a = (wx - ORIGIN_X) / HALF_W // = c - r
  const b = (wy - ORIGIN_Y) / HALF_H // = c + r
  return { row: Math.round((b - a) / 2), col: Math.round((a + b) / 2) }
}

// Lado de um tile onde fica um trecho de cerca (o nome vem do ponto cardeal na grade)
type Edge = 'N' | 'E' | 'S' | 'W'

// Item a desenhar numa célula. Cada item é de um só tipo:
// sprite (planta), soil (terra arada + máscara dos lados que dão para a grama),
// fence (trecho de cerca) ou prop (objeto do cenário)
type Item = { r: number; c: number; sprite?: SpriteName; soil?: number; fence?: Edge; prop?: PropKind }

// Objetos soltos em volta da plantação (r/c fora da grade 0..9)
const prop = (kind: PropKind, r: number, c: number): Item => ({ r, c, prop: kind })
const DECOR: Item[] = [
  prop('hayStack', -2, 3), prop('hay', -2, 6), prop('sack', -3, 9), prop('platform', 4, -3),
  prop('hay', 11, 2), prop('sack', 12, 6), prop('platform', 6, 12), prop('hayStack', 3, 11),
  prop('tree', -5, 2), prop('tree', -4, 11), prop('tree', 13, 3), prop('tree', 12, 13),
  prop('tree', 8, -4), prop('tree', 2, 15),
  prop('bush', -3, 6), prop('bush', 5, -2), prop('bush', -2, -1), prop('bush', 13, 9),
  prop('rock', 11, 8), prop('rock', 9, 12), prop('rock', -1, 12), prop('rock', 7, -3),
]

// Objeto de cenário que cairia em cima de um terreno (ou da cerca dele) some
function onPlot(item: Item, plots: Plot[]) {
  return plots.some((p) => {
    const r = item.r - p.y * PLOT_STEP
    const c = item.c - p.x * PLOT_STEP
    return r >= -1 && r <= GRID_SIZE && c >= -1 && c <= GRID_SIZE
  })
}

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

// Terrenos por posição ("x,y"), para olhar o tile vizinho mesmo que seja de outro terreno
type PlotMap = Map<string, Tile[][]>

// Tile na posição global (r, c) do mapa, ou undefined se não há terreno ali
function tileAt(plotMap: PlotMap, r: number, c: number) {
  const x = Math.floor(c / PLOT_STEP)
  const y = Math.floor(r / PLOT_STEP)
  return plotMap.get(`${x},${y}`)?.[r - y * PLOT_STEP][c - x * PLOT_STEP]
}

const tilled = (plotMap: PlotMap, r: number, c: number) => (tileAt(plotMap, r, c)?.state ?? 'soil') !== 'soil'

// Quais lados do tile não têm terra arada ao lado (viram borda com a grama)
function soilEdges(plotMap: PlotMap, r: number, c: number) {
  let mask = 0
  if (!tilled(plotMap, r - 1, c)) mask |= EDGE.north
  if (!tilled(plotMap, r, c + 1)) mask |= EDGE.east
  if (!tilled(plotMap, r + 1, c)) mask |= EDGE.south
  if (!tilled(plotMap, r, c - 1)) mask |= EDGE.west
  return mask
}

// Terra arada: desenhada por código (soil.ts) uma vez, em alta resolução
const SOIL_GEO = { halfW: HALF_W, halfH: HALF_H }
let soilTiles: HTMLCanvasElement[] | null = null

// Lista tudo que fica de pé sobre o mapa, na ordem em que cada item deve ser desenhado
function buildItems(plots: Plot[]): Item[] {
  const items: Item[] = DECOR.filter((item) => !onPlot(item, plots))
  const last = GRID_SIZE - 1
  const plotMap: PlotMap = new Map(plots.map((p) => [`${p.x},${p.y}`, p.grid]))
  for (const { x, y, grid } of plots) {
    // só há cerca no lado que não tem outro terreno colado
    const fenceN = !plotMap.has(`${x},${y - 1}`)
    const fenceW = !plotMap.has(`${x - 1},${y}`)
    const fenceS = !plotMap.has(`${x},${y + 1}`)
    const fenceE = !plotMap.has(`${x + 1},${y}`)
    grid.forEach((row, lr) =>
      row.forEach((tile, lc) => {
        // r/c: posição global no mapa; lr/lc: posição dentro do terreno
        const r = y * PLOT_STEP + lr
        const c = x * PLOT_STEP + lc
        // terra sem arar continua sendo grama; só a arada (ou plantada) mostra terra
        if (tile.state !== 'soil') items.push({ r, c, soil: soilEdges(plotMap, r, c) })
        // cerca nas bordas da plantação; as de trás (cima/esquerda) vêm antes da planta
        if (fenceN && lr === 0) items.push({ r, c, fence: 'N' })
        if (fenceW && lc === 0) items.push({ r, c, fence: 'W' })
        if (tile.state === 'planted' && isCropId(tile.crop)) items.push(cropItem(r, c, tile.crop, tile.growth))
        // as da frente (baixo/direita) vêm depois, para cobrir a planta
        if (fenceS && lr === last) items.push({ r, c, fence: 'S' })
        if (fenceE && lc === last) items.push({ r, c, fence: 'E' })
      }),
    )
  }
  // Quem está mais ao fundo (menor r + c) é desenhado primeiro. O sort é estável,
  // então itens da mesma célula mantêm a ordem em que foram inseridos acima.
  return items.sort((a, b) => a.r + a.c - (b.r + b.c))
}

// pixelRatio = resolução real da tela (telas retina têm 2 ou mais pixels por pixel CSS)
export function drawWorld(
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  plots: Plot[],
  cam: Camera,
  size: Size,
  pixelRatio: number,
  hover: Hover | null,
  slots: Slot[], // posições livres, desenhadas só durante a compra de terreno
) {
  // Transformação: mundo -> tela. Daqui em diante desenhamos em coordenadas do mundo.
  const k = cam.zoom * pixelRatio
  ctx.setTransform(k, 0, 0, k, (size.width / 2 - cam.x * cam.zoom) * pixelRatio, (size.height / 2 - cam.y * cam.zoom) * pixelRatio)
  ctx.imageSmoothingQuality = 'high'

  const topLeft = screenToWorld(0, 0, cam, size)
  const bottomRight = screenToWorld(size.width, size.height, cam, size)
  const view: Rect = { left: topLeft.x, top: topLeft.y, right: bottomRight.x, bottom: bottomRight.y }

  drawGround(ctx, view) // a grama cobre a tela toda, então não precisa limpar antes

  const items = buildItems(plots)
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
    ctx.drawImage(soilTiles[(((r * 7 + c * 13) % soilTiles.length) + soilTiles.length) % soilTiles.length], x - HALF_W, y - HALF_H, HALF_W * 2, HALF_H * 2)
    drawSoilEdges(ctx, x, y, SOIL_GEO, soil)
    drawGrassFringe(ctx, x, y, SOIL_GEO, soil)
  }
  // 2ª passada: tudo que fica de pé, do fundo para a frente
  for (const { r, c, sprite, fence, prop: kind } of items) {
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
      drawProp(ctx, kind, x, y)
    } else if (sprite) {
      ctx.drawImage(sprites[sprite], x - CROP_FRAME.ax, y - CROP_FRAME.ay, CROP_FRAME.w, CROP_FRAME.h)
    }
  }

  // Posições livres para comprar terreno: losango do tamanho do terreno
  for (const slot of slots) {
    const on = hover?.kind === 'slot' && hover.x === slot.x && hover.y === slot.y
    const r0 = slot.y * PLOT_STEP
    const c0 = slot.x * PLOT_STEP
    const top = cellToWorld(r0, c0)
    const right = cellToWorld(r0, c0 + GRID_SIZE - 1)
    const bottom = cellToWorld(r0 + GRID_SIZE - 1, c0 + GRID_SIZE - 1)
    const left = cellToWorld(r0 + GRID_SIZE - 1, c0)
    ctx.beginPath()
    ctx.moveTo(top.x, top.y - HALF_H)
    ctx.lineTo(right.x + HALF_W, right.y)
    ctx.lineTo(bottom.x, bottom.y + HALF_H)
    ctx.lineTo(left.x - HALF_W, left.y)
    ctx.closePath()
    ctx.fillStyle = on ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 4
    ctx.setLineDash(on ? [] : [18, 12])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Contorno no tile sob o mouse (ou na linha/coluna inteira com Shift/Ctrl)
  if (hover?.kind === 'tile') {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 3
    const { x: px, y: py } = plots[hover.plot]
    for (const t of tilesInMode(hover.mode, hover.row, hover.col)) {
      const { x, y } = cellToWorld(py * PLOT_STEP + t.row, px * PLOT_STEP + t.col)
      diamondPath(ctx, x, y, HALF_W, HALF_H)
      ctx.stroke()
    }
  }
}

import { CROPS, isCropId, type CropId } from '@/features/farm/model/crops'
import { GRID_SIZE, PLOT_STEP, tilesInMode, type ClickMode } from '@/features/farm/model/state'
import type { Plot, Tile } from '@/features/farm/model/types'
import { CROP_SVG_ANCHOR, CROP_SVG_SIZE } from './cropSvgs'
import { createGrassPattern } from './grass'
import { createSoilTiles, drawGrassFringe, drawSoilEdges, EDGE } from './soil'
import { FRUITS, TREES } from '@/features/farm/model/trees'
import { drawFence, drawProp, TILE_HALF, TREE_HIT, type PropKind } from './props'
import type { SpriteName, Sprites } from './sprites'
import type { Pose } from '@/features/farm/model/farmer'
import type { Avatar } from '@/features/profile/model/avatar'
import { drawFarmer } from './farmerSprite'
import {
  animalStatus,
  barnHungryCount,
  barnReadyCount,
  buildingAreas,
  buildingPos,
  centerOffset,
  footprint,
  machineReadyCount,
  MACHINES,
  overlaps,
  sameBuilding,
  type Area,
  type BuildingRef,
} from '@/features/farm/model/production'
import type { SaveData } from '@/features/farm/model/types'
import { bubbleLift, buildingHit, drawAnimal, drawBarn, drawBubble, drawMachine, drawWell, type Bubble } from './buildings'

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

// Começa enquadrando a plantação
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

// ---------- Prédios: celeiro, máquinas e animais ----------

// O que os prédios mostram agora: cada prédio construído, os animais no cercadinho do celeiro e os balões.
// Calculado a partir do estado e do relógio do servidor (`now`). Com um prédio sendo arrastado ou escolhendo
// lugar para construir (`ghost`), ele aparece em (r, c) e o chão dele fica verde (pode) ou vermelho (não pode).
export type YardBuilding = BuildingRef
// (r, c) = meio do prédio (onde ele é desenhado), já com o centerOffset do tamanho
type YardSpot = { r: number; c: number; target: YardBuilding; bubble: Bubble | null }
export type BuildingGhost = { target: YardBuilding; r: number; c: number; ok: boolean } // r, c = célula do prédio
export type YardView = {
  spots: YardSpot[]
  animals: { animalId: string; r: number; c: number; flip: boolean }[]
  areas: Area[] // chão de cada prédio (os objetos do cenário embaixo somem)
  ghost: { target: YardBuilding; area: Area; ok: boolean } | null
}

// Lugares dos animais no cercadinho à direita do celeiro (células c+2 a c+5, linhas r-1 a r+1 do chão dele):
// 3 fileiras de 4, um pouco desencontradas
const PADDOCK: { dr: number; dc: number }[] = Array.from({ length: 12 }, (_, i) => ({
  dr: -0.8 + Math.floor(i / 4) * 0.8,
  dc: 2.3 + (i % 4) * 0.95 + (Math.floor(i / 4) % 2) * 0.4,
}))

export function yardView(data: SaveData, now: number, ghost: BuildingGhost | null = null): YardView {
  // célula do prédio: a do fantasma (arrastando ou construindo) ou onde ele está
  const posOf = (target: YardBuilding) => (ghost && sameBuilding(ghost.target, target) ? ghost : buildingPos(data, target))
  const spots: YardSpot[] = []
  for (const m of MACHINES) {
    const target: YardBuilding = { kind: 'machine', id: m.id }
    const at = posOf(target)
    if (!at) continue
    const state = data.machines[m.id]
    let bubble: Bubble | null = null
    if (state) {
      const ready = machineReadyCount(data, m.id, now)
      bubble = ready > 0 ? { kind: 'ready', count: ready } : state.jobs.length > 0 ? { kind: 'working' } : null
    }
    const k = centerOffset(target)
    spots.push({ r: at.r + k, c: at.c + k, target, bubble })
  }
  const wellAt = posOf({ kind: 'well' })
  if (wellAt) spots.push({ r: wellAt.r, c: wellAt.c, target: { kind: 'well' }, bubble: null })
  const { barn } = data
  const barnAt = posOf({ kind: 'barn' })
  let animals: YardView['animals'] = []
  if (barnAt) {
    const ready = barnReadyCount(barn, now)
    const bubble: Bubble | null = ready > 0 ? { kind: 'ready', count: ready } : barnHungryCount(barn) > 0 ? { kind: 'hungry' } : null
    spots.push({ r: barnAt.r, c: barnAt.c, target: { kind: 'barn' }, bubble: barn.capacity > 0 ? bubble : null })
    animals = barn.animals.slice(0, PADDOCK.length).map((a, i) => ({
      animalId: a.animalId,
      r: barnAt.r + PADDOCK[i].dr,
      c: barnAt.c + PADDOCK[i].dc,
      flip: (i * 7 + (animalStatus(a, now).kind === 'hungry' ? 1 : 0)) % 3 === 0, // uns olham para cada lado
    }))
  }
  const ghostArea = ghost && footprint(ghost.target, ghost.r, ghost.c)
  const areas = ghost && ghostArea ? [...buildingAreas(data, ghost.target), ghostArea] : buildingAreas(data)
  return { spots, animals, areas, ghost: ghost && ghostArea ? { target: ghost.target, area: ghostArea, ok: ghost.ok } : null }
}

// Prédio sob o ponto do mundo; o mais da frente ganha
export function buildingAt(wx: number, wy: number, yard: YardView): YardBuilding | null {
  let found: { target: YardBuilding; depth: number } | null = null
  for (const s of yard.spots) {
    const { x, y } = cellToWorld(s.r, s.c)
    const hit = buildingHit(s.target)
    const nx = (wx - (x + hit.dx)) / hit.rx
    const ny = (wy - (y + hit.dy)) / hit.ry
    if (nx * nx + ny * ny <= 1 && (!found || s.r + s.c > found.depth)) found = { target: s.target, depth: s.r + s.c }
  }
  return found?.target ?? null
}

// Célula do prédio para o ponto do mundo sob o mouse: o meio do prédio fica sob o mouse (a máquina 2x2 tem o
// meio no canto entre as células, então arredonda a partir dele)
export function buildingCellAt(wx: number, wy: number, target: YardBuilding) {
  const a = (wx - ORIGIN_X) / HALF_W
  const b = (wy - ORIGIN_Y) / HALF_H
  const k = centerOffset(target)
  return { r: Math.round((b - a) / 2 - k), c: Math.round((a + b) / 2 - k) }
}

// Id da árvore sob o ponto (coordenadas do mundo), se houver; a mais da frente ganha
export function treeAt(wx: number, wy: number, plots: Plot[]): string | null {
  const k = 1.5 // mesma escala de PROP_SCALE.tree
  let found: { id: string; depth: number } | null = null
  for (const t of TREES) {
    if (onPlot(t, plots)) continue // árvore coberta por um terreno comprado não existe mais
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
type Item = {
  r: number
  c: number
  sprite?: SpriteName
  soil?: number
  fertilized?: boolean
  watered?: boolean
  fence?: Edge
  prop?: PropKind
  fruitColor?: string
  farmer?: boolean
  spot?: YardSpot
  animal?: { animalId: string; flip: boolean }
}

// Objetos soltos em volta da plantação (r/c fora da grade 0..9)
const prop = (kind: PropKind, r: number, c: number): Item => ({ r, c, prop: kind })
const DECOR: Item[] = [
  prop('hayStack', -2, 3), prop('hay', -2, 6), prop('sack', -3, 9),
  prop('hay', 11, 2), prop('sack', 12, 6), prop('platform', 6, 12), prop('hayStack', 3, 11),
  prop('bush', -3, 6), prop('bush', -2, -1), prop('bush', 13, 9),
  prop('rock', 11, 8), prop('rock', 9, 12), prop('rock', -1, 12), prop('rock', 10, -3),
]

// Objeto de cenário que cairia em cima de um terreno (ou da cerca dele) some
function onPlot(item: { r: number; c: number }, plots: Plot[]) {
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
  const progress = growth / CROPS[crop].growSeconds
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
function buildItems(plots: Plot[], readyTrees: ReadonlySet<string>, farmer: Pose | null, yard: YardView): Item[] {
  const underBuilding = (item: Item) => yard.areas.some((a) => overlaps(a, { r0: item.r, r1: item.r, c0: item.c, c1: item.c }))
  const items: Item[] = DECOR.filter((item) => !onPlot(item, plots) && !underBuilding(item))
  for (const spot of yard.spots) items.push({ r: spot.r, c: spot.c, spot })
  for (const a of yard.animals) items.push({ r: a.r, c: a.c, animal: { animalId: a.animalId, flip: a.flip } })
  // árvores frutíferas: mostram as frutas só quando há o que colher
  for (const t of TREES) {
    if (onPlot(t, plots)) continue
    items.push({ r: t.r, c: t.c, prop: 'tree', fruitColor: readyTrees.has(t.id) ? FRUITS[t.fruit].color : undefined })
  }
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
        if (tile.state !== 'soil') items.push({ r, c, soil: soilEdges(plotMap, r, c), fertilized: tile.fertilized, watered: tile.watered })
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
  // o fazendeiro entra por último: na mesma profundidade fica na frente da planta do tile onde está
  if (farmer) items.push({ r: farmer.r, c: farmer.c, farmer: true })
  // Quem está mais ao fundo (menor r + c) é desenhado primeiro. O sort é estável,
  // então itens da mesma célula mantêm a ordem em que foram inseridos acima.
  return items.sort((a, b) => a.r + a.c - (b.r + b.c))
}

// Terra regada: molhada, mais escura e com um brilho azulado
function drawWater(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  diamondPath(ctx, x, y, HALF_W - 4, HALF_H - 2)
  ctx.fillStyle = 'rgba(20, 30, 60, 0.3)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(150, 200, 255, 0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(x - 10, y - 2, 9, 3, 0, 0, Math.PI * 2)
  ctx.moveTo(x + 18, y + 4)
  ctx.ellipse(x + 12, y + 4, 6, 2, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

// Terra adubada: mais escura e com grãozinhos claros (o desenho muda de tile para tile pela posição)
function drawFertilizer(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: number) {
  ctx.save()
  diamondPath(ctx, x, y, HALF_W - 6, HALF_H - 3)
  ctx.fillStyle = 'rgba(40, 20, 6, 0.28)'
  ctx.fill()
  let seed = (r * 92821 + c * 68917) >>> 0
  const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 0xffffffff)
  for (let i = 0; i < 9; i++) {
    const u = rand() - 0.5
    const v = rand() - 0.5
    ctx.fillStyle = i % 3 === 0 ? 'rgba(146, 223, 98, 0.85)' : 'rgba(255, 240, 200, 0.75)'
    ctx.beginPath()
    ctx.arc(x + (u - v) * (HALF_W - 14), y + (u + v) * (HALF_H - 7), 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// pixelRatio = resolução real da tela (telas retina têm 2 ou mais pixels por pixel CSS)
export function drawWorld(
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  plots: Plot[],
  readyTrees: ReadonlySet<string>,
  cam: Camera,
  size: Size,
  pixelRatio: number,
  hover: Hover | null,
  slots: Slot[], // posições livres, desenhadas só durante a compra de terreno
  farmer: { pose: Pose; avatar: Avatar; queued: { r: number; c: number }[] } | null, // fazendeiro e as células da fila
  yard: YardView,
  hoverBuilding: YardBuilding | null, // prédio sob o mouse (ganha um contorno claro)
) {
  // Transformação: mundo -> tela. Daqui em diante desenhamos em coordenadas do mundo.
  const k = cam.zoom * pixelRatio
  ctx.setTransform(k, 0, 0, k, (size.width / 2 - cam.x * cam.zoom) * pixelRatio, (size.height / 2 - cam.y * cam.zoom) * pixelRatio)
  ctx.imageSmoothingQuality = 'high'

  const topLeft = screenToWorld(0, 0, cam, size)
  const bottomRight = screenToWorld(size.width, size.height, cam, size)
  const view: Rect = { left: topLeft.x, top: topLeft.y, right: bottomRight.x, bottom: bottomRight.y }

  drawGround(ctx, view) // a grama cobre a tela toda, então não precisa limpar antes

  const items = buildItems(plots, readyTrees, farmer?.pose ?? null, yard)
  // 1ª passada: a terra, que é chão. Assim ela nunca cobre plantas ou cercas de outros tiles.
  soilTiles ??= createSoilTiles(SOIL_GEO, 3, (w, h) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    return canvas
  })
  for (const { r, c, soil, fertilized, watered } of items) {
    if (soil === undefined) continue
    const { x, y } = cellToWorld(r, c)
    ctx.drawImage(soilTiles[(((r * 7 + c * 13) % soilTiles.length) + soilTiles.length) % soilTiles.length], x - HALF_W, y - HALF_H, HALF_W * 2, HALF_H * 2)
    if (watered) drawWater(ctx, x, y)
    if (fertilized) drawFertilizer(ctx, x, y, r, c)
    drawSoilEdges(ctx, x, y, SOIL_GEO, soil)
    drawGrassFringe(ctx, x, y, SOIL_GEO, soil)
  }
  // Chão do prédio sendo arrastado: verde se dá para soltar ali, vermelho se não
  if (yard.ghost) {
    const { area, ok } = yard.ghost
    ctx.fillStyle = ok ? 'rgba(120, 230, 110, 0.35)' : 'rgba(235, 40, 30, 0.55)'
    ctx.strokeStyle = ok ? 'rgba(200, 255, 190, 0.9)' : 'rgba(255, 150, 140, 0.95)'
    ctx.lineWidth = 2
    for (let r = area.r0; r <= area.r1; r++) {
      for (let c = area.c0; c <= area.c1; c++) {
        const { x, y } = cellToWorld(r, c)
        diamondPath(ctx, x, y, HALF_W - 2, HALF_H - 1)
        ctx.fill()
        ctx.stroke()
      }
    }
  }
  // 2ª passada: tudo que fica de pé, do fundo para a frente
  for (const { r, c, sprite, fence, prop: kind, fruitColor, farmer: isFarmer, spot, animal } of items) {
    const { x, y } = cellToWorld(r, c)
    if (spot) {
      const lit = hoverBuilding !== null && sameBuilding(hoverBuilding, spot.target)
      const ghostOf = yard.ghost && sameBuilding(yard.ghost.target, spot.target) ? yard.ghost : null
      if (lit) ctx.filter = 'brightness(1.12)'
      // a prévia é meio transparente (dá para ver o chão verde/vermelho), e avermelhada onde não pode
      if (ghostOf) {
        ctx.globalAlpha = 0.75
        if (!ghostOf.ok) ctx.filter = 'sepia(1) saturate(3) hue-rotate(-45deg) brightness(0.9)'
      }
      if (spot.target.kind === 'barn') drawBarn(ctx, x, y)
      else if (spot.target.kind === 'well') drawWell(ctx, x, y)
      else drawMachine(ctx, spot.target.id, x, y)
      ctx.filter = 'none'
      ctx.globalAlpha = 1
    } else if (animal) {
      drawAnimal(ctx, animal.animalId, x, y, animal.flip)
    } else if (isFarmer && farmer) {
      drawFarmer(ctx, farmer.pose, farmer.avatar, x, y)
    } else if (fence) {
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

  // Balões dos prédios por cima de tudo (o que está pronto não pode ficar escondido atrás de outro prédio)
  for (const spot of yard.spots) {
    if (!spot.bubble) continue
    const { x, y } = cellToWorld(spot.r, spot.c)
    drawBubble(ctx, x, y - bubbleLift(spot.target), spot.bubble)
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

  // Tiles que o fazendeiro ainda vai trabalhar (fila do servidor): contorno tracejado discreto
  if (farmer && farmer.queued.length > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 6])
    for (const q of farmer.queued) {
      const { x, y } = cellToWorld(q.r, q.c)
      diamondPath(ctx, x, y, HALF_W - 4, HALF_H - 2)
      ctx.stroke()
    }
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

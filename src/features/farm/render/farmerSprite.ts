import type { Avatar } from '@/features/profile/model/avatar'
import { HAIR, hex, recolor, SKIN, type Ramp } from '@/features/profile/render/avatarLayers'
import type { Pose } from '@/features/farm/model/farmer'
import atlas from './farmerAtlas.json'
import { PX } from './sprites'

// O fazendeiro em pixel art (gerado na PixelLab, folha montada por scripts/build_farmer_sheet.py): 8 direções,
// parado, andando, abaixando (plantar, colher, pegar) e com a enxada (arar).
// A folha é desenhada de macacão azul, pele clara e cabelo castanho; as cores do avatar do jogador entram
// recolorindo esses pixels (mesma troca por luminosidade do retrato), uma vez por combinação.

const OUTFIT: Record<Avatar['outfit'], Ramp> = {
  overalls_blue: null,
  overalls_red: hex('#3a0e0a', '#7a1e16', '#b8332a', '#d2493a', '#f07a64'),
  shirt_green: hex('#10300e', '#245a1e', '#3a7e32', '#4f9d4a', '#86cc72'),
  shirt_purple: hex('#1e1036', '#3e2470', '#6040a0', '#8458c0', '#b08ae0'),
  coat_brown: hex('#24140a', '#4a2c16', '#6e4426', '#8a5a34', '#b4845a'),
}

const CELL = atlas.cell
type Anim = keyof typeof atlas.anims

let sheet: HTMLImageElement | null = null
const tinted = new Map<string, HTMLCanvasElement>()

export function loadFarmerSheet(): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      sheet = img
      resolve()
    }
    img.onerror = reject
    img.src = '/assets/world/farmer.png'
  })
}

// Matiz (0-360), luminosidade e saturação (0-1) do pixel
function hls(d: Uint8ClampedArray, i: number) {
  const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, l, s: 0 }
  const c = max - min
  const s = c / (1 - Math.abs(2 * l - 1))
  const h = max === r ? ((g - b) / c + 6) % 6 : max === g ? (b - r) / c + 2 : (r - g) / c + 4
  return { h: h * 60, l, s }
}

// Folha recolorida com a roupa, a pele e o cabelo do avatar
function sheetFor(avatar: Avatar): CanvasImageSource | null {
  if (!sheet) return null
  const key = `${avatar.outfit}|${avatar.skin}|${avatar.hairColor}`
  let canvas = tinted.get(key)
  if (canvas) return canvas
  canvas = document.createElement('canvas')
  canvas.width = sheet.width
  canvas.height = sheet.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(sheet, 0, 0)
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = image.data
  const w = canvas.width
  // topo do desenho em cada célula: o cabelo fica nos 14 pixels de cima (a bota, do mesmo marrom, nunca)
  const tops = new Map<number, number>()
  const topOf = (cx: number, cy: number) => {
    const k = cy * 1000 + cx
    let top = tops.get(k)
    if (top === undefined) {
      top = CELL
      for (let y = 0; y < CELL && top === CELL; y++) {
        for (let x = 0; x < CELL; x++) if (d[((cy * CELL + y) * w + cx * CELL + x) * 4 + 3] > 0) { top = y; break }
      }
      tops.set(k, top)
    }
    return top
  }
  const isOutfit = (i: number) => { const c = hls(d, i); return c.h >= 185 && c.h <= 255 && c.s >= 0.25 }
  const isSkin = (i: number) => { const c = hls(d, i); return c.h >= 10 && c.h <= 40 && c.l >= 0.55 && c.s >= 0.45 }
  const isHair = (i: number) => {
    const c = hls(d, i)
    if (c.h > 35 || c.l < 0.15 || c.l > 0.55 || c.s < 0.35) return false
    const x = (i / 4) % w, y = Math.floor(i / 4 / w)
    const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL)
    return y - cy * CELL < topOf(cx, cy) + 14
  }
  // as máscaras saem do desenho original, antes de qualquer troca
  const outfit = new Set<number>(), skin = new Set<number>(), hair = new Set<number>()
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    if (isOutfit(i)) outfit.add(i)
    else if (isSkin(i)) skin.add(i)
    else if (isHair(i)) hair.add(i)
  }
  recolor(d, OUTFIT[avatar.outfit], (i) => outfit.has(i))
  recolor(d, SKIN[avatar.skin], (i) => skin.has(i))
  recolor(d, HAIR[avatar.hairColor], (i) => hair.has(i))
  ctx.putImageData(image, 0, 0)
  tinted.set(key, canvas)
  return canvas
}

// Direção da folha mais próxima de para onde ele olha. Na tela, 1 célula = (dc - dr) * 48 de largura e
// (dc + dr) * 24 de altura; as direções da folha vão de 45 em 45 graus a partir do sul, no sentido horário.
function directionRow(facing: Pose['facing']) {
  const angle = Math.atan2((facing.dc + facing.dr) * 24, (facing.dc - facing.dr) * 48) // 0 = leste, 90 = sul
  const fromSouth = (angle * 180) / Math.PI - 90
  return ((Math.round(fromSouth / 45) % 8) + 8) % 8
}

// Animação e quadro da pose
function frameOf(pose: Pose): { anim: Anim; frame: number } {
  if (pose.walking) return { anim: 'walk', frame: Math.floor(pose.phase * 3) % atlas.anims.walk.frames }
  const act = pose.acting
  if (!act) return { anim: 'idle', frame: 0 }
  if (act.action === 'till') {
    const n = atlas.anims.till.frames
    return { anim: 'till', frame: Math.min(Math.floor(act.progress * n), n - 1) }
  }
  // abaixa, fica abaixado e levanta
  return { anim: 'pick', frame: act.progress > 0.2 && act.progress < 0.8 ? 1 : 0 }
}

// (x, y) = o chão sob os pés, no centro do tile
export function drawFarmer(ctx: CanvasRenderingContext2D, pose: Pose, avatar: Avatar, x: number, y: number) {
  const img = sheetFor(avatar)
  if (!img) return
  // sombra (luz vem da esquerda, então a sombra cai para a direita)
  ctx.fillStyle = 'rgba(14, 44, 22, 0.28)'
  ctx.beginPath()
  ctx.ellipse(x + 3, y + 1, 14, 5.5, 0, 0, Math.PI * 2)
  ctx.fill()
  const { anim, frame } = frameOf(pose)
  const row = atlas.anims[anim].row + directionRow(pose.facing)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, frame * CELL, row * CELL, CELL, CELL, x - atlas.ax * PX, y - atlas.ay * PX, CELL * PX, CELL * PX)
}

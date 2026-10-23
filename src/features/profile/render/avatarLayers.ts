import type { Avatar } from '@/features/profile/model/avatar'

// Monta o retrato do jogador empilhando as camadas desenhadas em public/assets/avatar/
// (geradas por scripts/build_avatar_layers.py). Tom de pele, cor do cabelo e dos olhos não têm
// imagens próprias: a camada é desenhada numa cor só e recolorida aqui, trocando cada pixel pela cor
// da paleta escolhida com a mesma luminosidade (assim sombra e brilho do desenho continuam iguais).

const BASE = '/assets/avatar/'

type Layout = {
  canvas: number
  faces: Record<string, { image: string; skin: string; iris: string }>
  beards: Record<string, { image: string }>
  hairs: Record<string, { image: string; keep?: string }> // keep: pixels que mantêm a cor (elástico)
  hats: Record<string, { image: string }>
  outfits: Record<string, { image: string; skin: string }>
}

// Paletas do escuro para o claro. null = cor original do desenho (não recolore).
type Ramp = [number, number, number][] | null
const hex = (...colors: string[]): Ramp => colors.map((c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as [number, number, number])

const SKIN: Record<Avatar['skin'], Ramp> = {
  porcelain: hex('#6b3a2e', '#b0705a', '#e8b49a', '#f8d6c0', '#fff0e6'),
  light: null,
  tan: hex('#4a2416', '#8a4a2a', '#c47a4a', '#e09a62', '#f2bc86'),
  olive: hex('#3f2412', '#7a4a26', '#a8703e', '#c68e56', '#dcae78'),
  brown: hex('#2c160b', '#5a3018', '#84502e', '#a06a42', '#bc8a5e'),
  dark: hex('#1c0e07', '#3a1e10', '#5a321c', '#74462a', '#90603e'),
}

const HAIR: Record<Avatar['hairColor'], Ramp> = {
  black: hex('#0c0c12', '#1e1e28', '#30303e', '#4a4a5c', '#6a6a80'),
  brown: null,
  auburn: hex('#2a0e08', '#5a1e12', '#8a3220', '#b04a30', '#d47250'),
  ginger: hex('#5a2008', '#9a4012', '#d0661e', '#f08a34', '#ffb060'),
  blonde: hex('#6a4a18', '#a8802e', '#d8b048', '#f2d070', '#fff0b0'),
  gray: hex('#2e2e2e', '#5e5e5e', '#8e8e8e', '#bcbcbc', '#ececec'),
}

const EYES: Record<Avatar['eyes'], Ramp> = {
  brown: null,
  green: hex('#10200c', '#24481c', '#3e7030', '#62a050', '#9ad080'),
  blue: hex('#0a1830', '#1a3c70', '#2e64b0', '#5a94e0', '#a0c8ff'),
  gray: hex('#1a1e24', '#3a4048', '#606a76', '#8a96a4', '#c0cad6'),
  hazel: hex('#2a1a08', '#5a3a14', '#8a6224', '#b08a3c', '#d8b868'),
}

const lum = (d: Uint8ClampedArray, i: number) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]

// Troca as cores dos pixels escolhidos pela paleta, mantendo a luminosidade relativa
function recolor(data: Uint8ClampedArray, ramp: Ramp, pick: (i: number) => boolean) {
  if (!ramp) return
  const values: number[] = []
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 0 && pick(i)) values.push(lum(data, i))
  if (values.length === 0) return
  values.sort((a, b) => a - b)
  const lo = values[Math.floor(values.length * 0.02)]
  const hi = values[Math.floor(values.length * 0.98)]
  const span = Math.max(hi - lo, 1)
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0 || !pick(i)) continue
    const t = Math.min(Math.max((lum(data, i) - lo) / span, 0), 1) * (ramp.length - 1)
    const k = Math.min(Math.floor(t), ramp.length - 2)
    const f = t - k
    for (let c = 0; c < 3; c++) data[i + c] = ramp[k][c] * (1 - f) + ramp[k + 1][c] * f
  }
}

// ---------- Carregamento ----------

let assets: Promise<{ layout: Layout; pixels: Map<string, ImageData> }> | null = null

function loadImage(name: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Camada do avatar não encontrada: ${name}`))
    img.src = `${BASE}${name}.png`
  })
}

// Carrega o layout e todas as camadas uma vez, já como pixels
function loadAssets() {
  assets ??= (async () => {
    const layout: Layout = await (await fetch(`${BASE}layers.json`)).json()
    const names = new Set<string>()
    for (const group of [layout.faces, layout.beards, layout.hairs, layout.hats, layout.outfits]) {
      for (const entry of Object.values(group)) for (const name of Object.values(entry)) names.add(name)
    }
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = layout.canvas
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const pixels = new Map<string, ImageData>()
    for (const name of names) {
      const img = await loadImage(name)
      ctx.clearRect(0, 0, layout.canvas, layout.canvas)
      ctx.drawImage(img, 0, 0)
      pixels.set(name, ctx.getImageData(0, 0, layout.canvas, layout.canvas))
    }
    return { layout, pixels }
  })()
  return assets
}

// ---------- Montagem ----------

const cache = new Map<string, Promise<string>>()

const keyOf = (a: Avatar) => [a.skin, a.eyes, a.face, a.hair, a.hairColor, a.beard, a.hat, a.outfit].join('|')

// URL (data:) do retrato; a mesma combinação é montada uma vez só
export function avatarImageUrl(avatar: Avatar): Promise<string> {
  const key = keyOf(avatar)
  let url = cache.get(key)
  if (!url) {
    url = compose(avatar)
    cache.set(key, url)
  }
  return url
}

async function compose(avatar: Avatar): Promise<string> {
  const { layout, pixels } = await loadAssets()
  const size = layout.canvas
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const layer = document.createElement('canvas')
  layer.width = layer.height = size
  const lctx = layer.getContext('2d')!

  // fundo bege com vinheta, como um retrato
  const bg = ctx.createRadialGradient(size / 2, size * 0.42, size * 0.1, size / 2, size * 0.42, size * 0.75)
  bg.addColorStop(0, '#ead3a6')
  bg.addColorStop(1, '#c9a874')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)

  // desenha uma camada (com recoloração opcional) por cima do que já está na tela
  const draw = (name: string | undefined, paint?: (data: Uint8ClampedArray) => void) => {
    const src = name && pixels.get(name)
    if (!src) return
    const copy = new ImageData(new Uint8ClampedArray(src.data), size, size)
    paint?.(copy.data)
    lctx.putImageData(copy, 0, 0)
    ctx.drawImage(layer, 0, 0)
  }
  const maskOf = (name: string) => pixels.get(name)?.data

  const skin = SKIN[avatar.skin]
  const hair = HAIR[avatar.hairColor]

  const outfit = layout.outfits[avatar.outfit]
  if (outfit) {
    const m = maskOf(outfit.skin)
    draw(outfit.image, (d) => recolor(d, skin, (i) => !!m && m[i + 3] > 0))
  }

  const face = layout.faces[avatar.face]
  const skinMask = maskOf(face.skin)
  const irisMask = maskOf(face.iris)
  draw(face.image, (d) => {
    recolor(d, skin, (i) => !!skinMask && skinMask[i + 3] > 0)
    recolor(d, EYES[avatar.eyes], (i) => !!irisMask && irisMask[i + 3] > 0)
  })

  if (avatar.beard !== 'none') draw(layout.beards[avatar.beard]?.image, (d) => recolor(d, hair, () => true))
  const hairLayer = avatar.hair !== 'bald' ? layout.hairs[avatar.hair] : undefined
  if (hairLayer) {
    const keep = hairLayer.keep ? maskOf(hairLayer.keep) : undefined
    draw(hairLayer.image, (d) => recolor(d, hair, (i) => !keep || keep[i + 3] === 0))
  }
  if (avatar.hat !== 'none') draw(layout.hats[avatar.hat]?.image)

  return canvas.toDataURL('image/png')
}

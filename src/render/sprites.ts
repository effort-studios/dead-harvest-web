import { CROP_SPRITE_NAMES, CROP_SVGS, type CropSpriteName } from './cropSvgs'

// Sprites isométricos do pacote "Isometric Miniature Farm" (Kenney, CC0).
// Cada arquivo é uma imagem 256x512 com o losango do chão na parte de baixo.
export const SPRITE_NAMES = [
  'cornYoung_S',
  'cornYoungDouble_S',
  'corn_S',
  'fenceLow_N',
  'fenceLow_E',
  'fenceLow_S',
  'fenceLow_W',
  'hayBalesStacked_S',
  'hayBales_S',
  'sack_S',
  'planks_S',
] as const

type IsoSpriteName = (typeof SPRITE_NAMES)[number]
// Os sprites do pacote (PNG) e as plantas de tomate/abóbora (SVG feito por nós)
export type SpriteName = IsoSpriteName | CropSpriteName
export type Sprites = Record<SpriteName, HTMLImageElement>

export const SPRITE_SIZE = { width: 256, height: 512 }
// Onde fica o centro do losango do chão dentro da imagem
export const SPRITE_ANCHOR = { x: 128, y: 437 }

const assetUrl = (file: string) => `${import.meta.env.BASE_URL}assets/iso-farm/${file}`

export function isCropSprite(name: SpriteName): name is CropSpriteName {
  return (CROP_SPRITE_NAMES as readonly string[]).includes(name)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

let cache: Promise<Sprites> | null = null

// Carrega todas as imagens uma única vez
export function loadSprites(): Promise<Sprites> {
  const sources: [SpriteName, string][] = [
    ...SPRITE_NAMES.map((n): [SpriteName, string] => [n, assetUrl(`${n}.png`)]),
    ...CROP_SPRITE_NAMES.map((n): [SpriteName, string] => [n, svgUrl(CROP_SVGS[n])]),
  ]
  cache ??= Promise.all(sources.map(([, src]) => loadImage(src))).then(
    (images) => Object.fromEntries(sources.map(([n], i) => [n, images[i]])) as Sprites,
  )
  return cache
}

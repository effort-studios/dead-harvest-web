// Sprites isométricos do pacote "Isometric Miniature Farm" (Kenney, CC0).
// Cada arquivo é uma imagem 256x512 com o losango do chão na parte de baixo.
export const SPRITE_NAMES = [
  'dirt_S',
  'dirtFarmland_S',
  'cornYoung_S',
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

export type SpriteName = (typeof SPRITE_NAMES)[number]
export type Sprites = Record<SpriteName, HTMLImageElement>

export const SPRITE_SIZE = { width: 256, height: 512 }
// Onde fica o centro do losango do chão dentro da imagem
export const SPRITE_ANCHOR = { x: 128, y: 437 }

const assetUrl = (file: string) => `${import.meta.env.BASE_URL}assets/iso-farm/${file}`
export const SACK_ICON_URL = assetUrl('icon-sack.png')

function loadImage(name: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = assetUrl(`${name}.png`)
  })
}

let cache: Promise<Sprites> | null = null

// Carrega todas as imagens uma única vez
export function loadSprites(): Promise<Sprites> {
  cache ??= Promise.all(SPRITE_NAMES.map(loadImage)).then(
    (images) => Object.fromEntries(SPRITE_NAMES.map((n, i) => [n, images[i]])) as Sprites,
  )
  return cache
}

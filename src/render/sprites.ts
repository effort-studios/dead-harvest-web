import { CROP_SPRITE_NAMES, CROP_SVGS, type CropSpriteName } from './cropSvgs'

// Imagens usadas no mapa: as plantas, desenhadas em SVG (cropSvgs.ts).
// Terreno, cerca e objetos do cenário são desenhados direto no canvas (grass, soil, props).
export type SpriteName = CropSpriteName
export type Sprites = Record<SpriteName, HTMLImageElement>

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
  cache ??= Promise.all(CROP_SPRITE_NAMES.map((n) => loadImage(svgUrl(CROP_SVGS[n])))).then(
    (images) => Object.fromEntries(CROP_SPRITE_NAMES.map((n, i) => [n, images[i]])) as Sprites,
  )
  return cache
}

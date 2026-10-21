// Tiny Town (Kenney, CC0): imagem única com tiles 16x16, 12 por linha.
// Um sprite é identificado pelo índice dele na imagem (esquerda->direita, cima->baixo).
export const SRC_SIZE = 16
export const SHEET_COLS = 12
export const SHEET_URL = `${import.meta.env.BASE_URL}assets/tiny-town/tilemap.png`

// Índices dos tiles que usamos
export const SPRITE = {
  grass: 0,
  grassTufts: 1,
  grassFlowers: 2,
  dirt: 25,
  sprout: 17,
  bush: 5,
  pine: 4,
  tree: 16,
  coin: 93,
  fenceTL: 44, fenceTop: 45, fenceTR: 46,
  fenceLeft: 56, fenceRight: 58,
  fenceBL: 68, fenceBottom: 69, fenceBR: 70,
  roofL: 52, roofM: 53, roofR: 54,
  roof2L: 64, roof2M: 65, roof2R: 66,
  window: 84, door: 85,
} as const

let sheet: Promise<HTMLImageElement> | null = null

export function loadSheet(): Promise<HTMLImageElement> {
  sheet ??= new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = SHEET_URL
  })
  return sheet
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  index: number,
  x: number,
  y: number,
  size: number,
) {
  const sx = (index % SHEET_COLS) * SRC_SIZE
  const sy = Math.floor(index / SHEET_COLS) * SRC_SIZE
  ctx.imageSmoothingEnabled = false // mantém o pixel art nítido ao ampliar
  ctx.drawImage(img, sx, sy, SRC_SIZE, SRC_SIZE, x, y, size, size)
}

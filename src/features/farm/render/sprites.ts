import atlas from './worldAtlas.json'

// Sprites do mundo em pixel art (gerados na PixelLab e montados por scripts/build_world_sprites.py).
// Cada um tem um ponto de apoio (ax, ay): onde ele toca o chão, que vai no ponto do mundo pedido.
// Os animados (moinho, animais...) são uma tira com `frames` quadros lado a lado, tocada em loop a `fps`.
// Todos usam a mesma escala, para os pixels terem o mesmo tamanho na tela: o tile do mapa tem 96 x 48 no
// mundo e 64 x 32 pixels no desenho.
export const PX = 1.5 // unidades do mundo por pixel do desenho

export type SpriteName = keyof typeof atlas
type Frame = { w: number; h: number; ax: number; ay: number; frames?: number; fps?: number }

// Ritmo em que a cena é redesenhada quando nada mais se mexe: o das animações mais rápidas
export const SCENE_FPS = 8
const FRAMES: Record<string, Frame> = atlas

const images = new Map<string, HTMLImageElement>()

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

let cache: Promise<void> | null = null

// Carrega todas as imagens uma única vez
export function loadSprites(): Promise<void> {
  cache ??= Promise.all(
    // animados: a tira fica em <nome>_anim.png; <nome>.png é o quadro parado (usado nos ícones dos menus)
    Object.entries(FRAMES).map(async ([name, f]) =>
      images.set(name, await loadImage(`/assets/world/${name}${(f.frames ?? 1) > 1 ? '_anim' : ''}.png`)),
    ),
  ).then(() => undefined)
  return cache
}

export const hasSprite = (name: string) => images.has(name)
export const spriteImage = (name: string) => images.get(name)

// Desenha o sprite com o apoio em (x, y) do mundo; flip espelha na horizontal (em volta do apoio).
// Nos animados, o quadro sai do relógio; `phase` (em quadros) desencontra cópias do mesmo sprite.
export function drawSprite(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, flip = false, phase = 0) {
  const img = images.get(name)
  const f = FRAMES[name]
  if (!img || !f) return
  const n = f.frames ?? 1
  const sx = n > 1 ? ((Math.floor((performance.now() / 1000) * (f.fps ?? SCENE_FPS)) + phase) % n) * f.w : 0
  ctx.imageSmoothingEnabled = false
  if (flip) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(-1, 1)
    ctx.drawImage(img, sx, 0, f.w, f.h, -f.ax * PX, -f.ay * PX, f.w * PX, f.h * PX)
    ctx.restore()
  } else {
    ctx.drawImage(img, sx, 0, f.w, f.h, x - f.ax * PX, y - f.ay * PX, f.w * PX, f.h * PX)
  }
}

// Área clicável do sprite (elipse relativa ao apoio, no mundo): cobre o desenho, um pouco para dentro
export function spriteHit(name: string) {
  const f = FRAMES[name] ?? { w: 40, h: 40, ax: 20, ay: 36 }
  return { dx: (f.w / 2 - f.ax) * PX, dy: (f.h / 2 - f.ay) * PX, rx: f.w * 0.45 * PX, ry: f.h * 0.45 * PX }
}

// Altura do topo do sprite acima do apoio, no mundo
export const spriteTop = (name: string) => (FRAMES[name]?.ay ?? 40) * PX

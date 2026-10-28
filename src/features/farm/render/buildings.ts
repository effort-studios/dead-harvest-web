import { drawSprite, spriteHit, spriteTop } from './sprites'

// Prédios: celeiro, as máquinas, o poço e os animais, em pixel art (sprites.ts), com a base centrada em (x, y),
// o centro do chão do prédio no mundo. Cada sprite já tem o tamanho do prédio no mapa: a prensa de sucos cabe
// numa célula, o moinho e a cozinha ocupam 2x2, o celeiro 3x3. Os balões de "pronto" são desenhados aqui.

const OUTLINE = '#3b2412'

type Target = { kind: 'barn' } | { kind: 'well' } | { kind: 'machine'; id: string }
const spriteOf = (target: Target) => (target.kind === 'machine' ? target.id : target.kind)

// Área clicável (elipse relativa à base, no mundo)
export const buildingHit = (target: Target) => spriteHit(spriteOf(target))

// Altura do balão acima da base
export const bubbleLift = (target: Target) => spriteTop(spriteOf(target)) + 8

export const drawBarn = (ctx: CanvasRenderingContext2D, x: number, y: number) => drawSprite(ctx, 'barn', x, y)
export const drawWell = (ctx: CanvasRenderingContext2D, x: number, y: number) => drawSprite(ctx, 'well', x, y)
export const drawMachine = (ctx: CanvasRenderingContext2D, machineId: string, x: number, y: number) => drawSprite(ctx, machineId, x, y)

// Animais no cercadinho ao lado do celeiro; os sprites olham para a esquerda, flip vira para a direita.
// `phase` desencontra a animação de um animal para o outro (não pastam todos juntos).
export const drawAnimal = (ctx: CanvasRenderingContext2D, animalId: string, x: number, y: number, flip: boolean, phase: number) =>
  drawSprite(ctx, animalId, x, y, flip, phase)

// ---------- Desenho do balão ----------

function outline(ctx: CanvasRenderingContext2D, width: number) {
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = width
  ctx.lineJoin = 'round'
  ctx.stroke()
}

function gradient(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, a: string, b: string) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  g.addColorStop(0, a)
  g.addColorStop(1, b)
  return g
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string | CanvasGradient, width: number) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  outline(ctx, width)
}

function line(ctx: CanvasRenderingContext2D, a: number[], b: number[], color: string, width: number) {
  ctx.beginPath()
  ctx.moveTo(a[0], a[1])
  ctx.lineTo(b[0], b[1])
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.stroke()
}

// ---------- Balões em cima dos prédios ----------

// ready = algo pronto para coletar (check verde e quantidade); hungry = animal com fome (exclamação);
// working = máquina trabalhando (três pontinhos)
export type Bubble = { kind: 'ready'; count: number } | { kind: 'hungry' } | { kind: 'working' }

export function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, bubble: Bubble) {
  const w = bubble.kind === 'ready' && bubble.count > 1 ? 38 : 26
  const h = 22
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h, w, h, 9)
  ctx.moveTo(x - 5, y - 0.5)
  ctx.lineTo(x, y + 7)
  ctx.lineTo(x + 5, y - 0.5)
  ctx.fillStyle = bubble.kind === 'working' ? 'rgba(255, 252, 244, 0.85)' : '#fffcf4'
  ctx.fill()
  outline(ctx, 1.6)
  // cobre a linha do contorno entre o balão e o bico
  ctx.fillStyle = bubble.kind === 'working' ? 'rgba(255, 252, 244, 0.85)' : '#fffcf4'
  ctx.fillRect(x - 4.2, y - 2.4, 8.4, 3)
  const cy = y - h / 2
  if (bubble.kind === 'ready') {
    const cx = bubble.count > 1 ? x - 7 : x
    circle(ctx, cx, cy, 7.5, gradient(ctx, cx - 7, cy - 7, cx + 7, cy + 7, '#8fe06a', '#3f9a2e'), 1.2)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(cx - 3.5, cy)
    ctx.lineTo(cx - 1, cy + 2.8)
    ctx.lineTo(cx + 3.8, cy - 2.8)
    ctx.stroke()
    if (bubble.count > 1) {
      ctx.fillStyle = OUTLINE
      ctx.font = '13px Duality, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${bubble.count}`, x + 9, cy + 0.5)
    }
  } else if (bubble.kind === 'hungry') {
    circle(ctx, x, cy, 7.5, gradient(ctx, x - 7, cy - 7, x + 7, cy + 7, '#ffc15a', '#e0761f'), 1.2)
    line(ctx, [x, cy - 4], [x, cy + 0.8], '#ffffff', 2.4)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, cy + 3.6, 1.3, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.fillStyle = '#9a7a55'
    for (const dx of [-6, 0, 6]) {
      ctx.beginPath()
      ctx.arc(x + dx, cy, 2.1, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}


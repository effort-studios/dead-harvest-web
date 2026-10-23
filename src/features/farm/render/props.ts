import { BURLAP, HAY, LEAF, OUTLINE, OUTLINE_W, SHADOW, STONE, TRUNK, WOOD } from './style'

// Objetos do cenário (cerca, fardos, plataforma, saco, arbusto, pedra, árvore) desenhados por código,
// seguindo o design system (style.ts / DESIGN.md). Nada aqui depende do navegador: só do `ctx`.

export type PropKind = 'hay' | 'hayStack' | 'platform' | 'sack' | 'bush' | 'rock' | 'tree'

// Proporção do tile no mundo: losango com o dobro de largura que de altura
const HW = 48
const HH = 24

function outline(ctx: CanvasRenderingContext2D, width = OUTLINE_W) {
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = width
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.fillStyle = SHADOW
  ctx.beginPath()
  ctx.ellipse(x + rx * 0.18, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
}

function gradient(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, a: string, b: string) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  g.addColorStop(0, a)
  g.addColorStop(1, b)
  return g
}

// ---------- Caixa isométrica: base de qualquer coisa "quadrada" (fardo, plataforma) ----------
type BoxColors = { top: [string, string]; left: [string, string]; right: [string, string] }

// (x, y) = centro da base; hw/hh = meia largura/altura do losango da base; h = altura da caixa
function isoBox(ctx: CanvasRenderingContext2D, x: number, y: number, hw: number, hh: number, h: number, c: BoxColors) {
  const T = [x, y - hh], R = [x + hw, y], B = [x, y + hh], L = [x - hw, y]
  const up = (p: number[]) => [p[0], p[1] - h]
  // face esquerda (iluminada) e direita (na sombra)
  ctx.beginPath()
  ctx.moveTo(L[0], L[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(up(B)[0], up(B)[1]); ctx.lineTo(up(L)[0], up(L)[1]); ctx.closePath()
  ctx.fillStyle = gradient(ctx, 0, y - h, 0, y, c.left[0], c.left[1])
  ctx.fill(); outline(ctx)
  ctx.beginPath()
  ctx.moveTo(B[0], B[1]); ctx.lineTo(R[0], R[1]); ctx.lineTo(up(R)[0], up(R)[1]); ctx.lineTo(up(B)[0], up(B)[1]); ctx.closePath()
  ctx.fillStyle = gradient(ctx, 0, y - h, 0, y, c.right[0], c.right[1])
  ctx.fill(); outline(ctx)
  // topo
  ctx.beginPath()
  ctx.moveTo(up(T)[0], up(T)[1]); ctx.lineTo(up(R)[0], up(R)[1]); ctx.lineTo(up(B)[0], up(B)[1]); ctx.lineTo(up(L)[0], up(L)[1]); ctx.closePath()
  ctx.fillStyle = gradient(ctx, x - hw, y - h - hh, x + hw, y - h + hh, c.top[0], c.top[1])
  ctx.fill(); outline(ctx)
}

// Ponto do topo da caixa em coordenadas u, v de -0.5 a 0.5 (mesmo espaço da terra arada)
function topPoint(x: number, y: number, hw: number, hh: number, h: number, u: number, v: number) {
  return [x + (u - v) * hw, y - h + (u + v) * hh]
}

function line(ctx: CanvasRenderingContext2D, a: number[], b: number[], color: string, width: number, alpha = 1) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(a[0], a[1])
  ctx.lineTo(b[0], b[1])
  ctx.stroke()
  ctx.restore()
}

// ---------- Fardo de feno ----------
function hayBale(ctx: CanvasRenderingContext2D, x: number, y: number, hw: number, hh: number, h: number) {
  isoBox(ctx, x, y, hw, hh, h, {
    top: [HAY.light, HAY.mid],
    left: [HAY.mid, HAY.dark],
    right: [HAY.dark, '#8a6020'],
  })
  // fiapos de palha no topo e na face esquerda
  for (let i = 0; i < 7; i++) {
    const u = -0.4 + i * 0.13
    const a = topPoint(x, y, hw, hh, h, u, -0.35 + (i % 3) * 0.3)
    const b = topPoint(x, y, hw, hh, h, u + 0.14, -0.35 + (i % 3) * 0.3)
    line(ctx, a, b, HAY.dark, 1, 0.55)
  }
  for (let i = 0; i < 4; i++) {
    const px = x - hw * 0.8 + i * hw * 0.38
    const py = y + hh * (0.2 + i * 0.2) - h * 0.55
    line(ctx, [px, py], [px + 4, py + 2], HAY.dark, 1, 0.5)
  }
  // cordas: passam pelo topo e descem pela face da frente
  for (const u of [-0.2, 0.2]) {
    const t0 = topPoint(x, y, hw, hh, h, u, -0.5)
    const t1 = topPoint(x, y, hw, hh, h, u, 0.5)
    line(ctx, t0, t1, HAY.rope, 1.8)
    line(ctx, t1, [t1[0], t1[1] + h], HAY.rope, 1.8)
  }
}

// ---------- Plataforma de tábuas ----------
function platform(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const hw = 40, hh = 20, h = 5
  shadow(ctx, x, y + 4, hw * 0.95, hh * 0.9)
  isoBox(ctx, x, y, hw, hh, h, {
    top: [WOOD.light, WOOD.mid],
    left: [WOOD.mid, WOOD.dark],
    right: [WOOD.dark, '#5e3719'],
  })
  // divisões das tábuas e pregos
  const n = 5
  for (let k = 1; k < n; k++) {
    const v = -0.5 + k / n
    line(ctx, topPoint(x, y, hw, hh, h, -0.5, v), topPoint(x, y, hw, hh, h, 0.5, v), WOOD.dark, 1.1, 0.8)
  }
  for (let k = 0; k < n; k++) {
    const v = -0.5 + (k + 0.5) / n
    for (const u of [-0.4, 0.4]) {
      const p = topPoint(x, y, hw, hh, h, u, v)
      ctx.fillStyle = '#4a2c14'
      ctx.beginPath()
      ctx.arc(p[0], p[1], 0.9, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

// ---------- Saco de grãos ----------
function sack(ctx: CanvasRenderingContext2D, x: number, y: number) {
  shadow(ctx, x, y, 12, 4.5)
  ctx.beginPath()
  ctx.moveTo(x - 8, y - 1)
  ctx.bezierCurveTo(x - 13, y - 10, x - 9, y - 19, x - 4, y - 21)
  ctx.lineTo(x + 4, y - 21)
  ctx.bezierCurveTo(x + 9, y - 19, x + 13, y - 10, x + 8, y - 1)
  ctx.bezierCurveTo(x + 4, y + 2, x - 4, y + 2, x - 8, y - 1)
  ctx.closePath()
  ctx.fillStyle = gradient(ctx, x - 12, y - 20, x + 12, y, BURLAP.light, BURLAP.dark)
  ctx.fill(); outline(ctx)
  // pescoço amarrado
  ctx.beginPath()
  ctx.moveTo(x - 4, y - 21)
  ctx.lineTo(x - 6.5, y - 26)
  ctx.lineTo(x - 1.5, y - 24)
  ctx.lineTo(x, y - 27)
  ctx.lineTo(x + 1.5, y - 24)
  ctx.lineTo(x + 6.5, y - 26)
  ctx.lineTo(x + 4, y - 21)
  ctx.closePath()
  ctx.fillStyle = BURLAP.mid
  ctx.fill(); outline(ctx)
  line(ctx, [x - 5, y - 21.5], [x + 5, y - 21.5], HAY.rope, 2)
  // remendo e costura
  line(ctx, [x - 3, y - 13], [x + 3, y - 13], BURLAP.dark, 1, 0.8)
  line(ctx, [x - 3, y - 9], [x + 3, y - 9], BURLAP.dark, 1, 0.8)
}

// ---------- Arbusto ----------
function bush(ctx: CanvasRenderingContext2D, x: number, y: number) {
  shadow(ctx, x, y, 17, 6)
  const blobs: [number, number, number][] = [[-9, -8, 9], [8, -9, 10], [0, -15, 10], [-1, -6, 11]]
  for (const [dx, dy, r] of blobs) {
    ctx.beginPath()
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2)
    const g = ctx.createRadialGradient(x + dx - r * 0.35, y + dy - r * 0.4, 1, x + dx, y + dy, r)
    g.addColorStop(0, LEAF.light)
    g.addColorStop(0.55, LEAF.mid)
    g.addColorStop(1, LEAF.dark)
    ctx.fillStyle = g
    ctx.fill(); outline(ctx)
  }
  // bagas vermelhas
  for (const [dx, dy] of [[-8, -10], [6, -5], [2, -17]]) {
    ctx.fillStyle = '#e5483b'
    ctx.beginPath()
    ctx.arc(x + dx, y + dy, 1.9, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ---------- Pedra ----------
function rock(ctx: CanvasRenderingContext2D, x: number, y: number) {
  shadow(ctx, x, y, 14, 5)
  ctx.beginPath()
  ctx.moveTo(x - 13, y - 1)
  ctx.lineTo(x - 11, y - 9)
  ctx.lineTo(x - 4, y - 15)
  ctx.lineTo(x + 5, y - 14)
  ctx.lineTo(x + 12, y - 8)
  ctx.lineTo(x + 13, y - 1)
  ctx.quadraticCurveTo(x, y + 3, x - 13, y - 1)
  ctx.closePath()
  ctx.fillStyle = gradient(ctx, x - 12, y - 15, x + 12, y + 2, STONE.light, STONE.dark)
  ctx.fill(); outline(ctx)
  line(ctx, [x - 8, y - 9], [x - 3, y - 12], '#ffffff', 1.6, 0.55)
  line(ctx, [x + 2, y - 8], [x + 7, y - 5], STONE.dark, 1.1, 0.7)
}

// ---------- Árvore ----------
function tree(ctx: CanvasRenderingContext2D, x: number, y: number, fruitColor?: string) {
  shadow(ctx, x, y, 24, 8)
  // tronco
  ctx.beginPath()
  ctx.moveTo(x - 5, y)
  ctx.lineTo(x - 3.5, y - 24)
  ctx.lineTo(x + 3.5, y - 24)
  ctx.lineTo(x + 5, y)
  ctx.quadraticCurveTo(x, y + 3, x - 5, y)
  ctx.closePath()
  ctx.fillStyle = gradient(ctx, x - 5, 0, x + 5, 0, TRUNK.light, TRUNK.dark)
  ctx.fill(); outline(ctx)
  // copa: círculos sobrepostos, os de baixo primeiro
  const blobs: [number, number, number][] = [[-15, -32, 15], [15, -33, 15], [0, -28, 19], [-8, -46, 16], [10, -47, 15], [0, -56, 14]]
  for (const [dx, dy, r] of blobs) {
    ctx.beginPath()
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2)
    const g = ctx.createRadialGradient(x + dx - r * 0.4, y + dy - r * 0.45, 2, x + dx, y + dy, r)
    g.addColorStop(0, LEAF.light)
    g.addColorStop(0.5, LEAF.mid)
    g.addColorStop(1, LEAF.dark)
    ctx.fillStyle = g
    ctx.fill(); outline(ctx)
  }
  if (fruitColor) {
    const spots: [number, number][] = [[-18, -28], [-5, -37], [12, -30], [20, -42], [-12, -50], [5, -56], [-1, -24], [-22, -41]]
    for (const [dx, dy] of spots) {
      ctx.beginPath()
      ctx.arc(x + dx, y + dy, 4.2, 0, Math.PI * 2)
      ctx.fillStyle = fruitColor
      ctx.fill(); outline(ctx)
      line(ctx, [x + dx - 2, y + dy - 1.5], [x + dx - 0.8, y + dy - 2.8], '#ffffff', 1.1, 0.7)
    }
  }
}

// Área clicável da copa (em coordenadas do mundo), relativa à base da árvore já com a escala
export const TREE_HIT = { dx: 0, dy: -42, rx: 34, ry: 36 }

// Escala de cada objeto (árvores e arbustos são maiores que o desenho-base)
const PROP_SCALE: Partial<Record<PropKind, number>> = { tree: 1.5, bush: 1.3, rock: 1.45, sack: 1.3 }

// Desenha um objeto com a base centrada em (x, y) — o centro do tile no mundo
export function drawProp(ctx: CanvasRenderingContext2D, kind: PropKind, x: number, y: number, fruitColor?: string) {
  const k = PROP_SCALE[kind] ?? 1
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(k, k)
  const [ox, oy] = [0, 0] // dentro do grupo, a base é a origem
  if (kind === 'hay') {
    shadow(ctx, ox, oy + 2, 26, 9)
    hayBale(ctx, ox, oy, 22, 11, 15)
  } else if (kind === 'hayStack') {
    shadow(ctx, ox, oy + 3, 32, 11)
    hayBale(ctx, ox - 12, oy + 4, 21, 10.5, 14)
    hayBale(ctx, ox + 14, oy + 2, 21, 10.5, 14)
    hayBale(ctx, ox, oy - 8, 21, 10.5, 14) // o de cima, apoiado nos outros dois
  } else if (kind === 'platform') platform(ctx, ox, oy)
  else if (kind === 'sack') sack(ctx, ox, oy)
  else if (kind === 'bush') bush(ctx, ox, oy)
  else if (kind === 'rock') rock(ctx, ox, oy)
  else tree(ctx, ox, oy, fruitColor)
  ctx.restore()
}

// ---------- Cerca ----------
// Uma seção vai do ponto (ax, ay) ao ponto (bx, by) do chão: 2 postes e 2 travessas.
const POST_H = 23
const POST_W = 5

function post(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath()
  ctx.roundRect(x - POST_W / 2, y - POST_H, POST_W, POST_H, 1.6)
  ctx.fillStyle = gradient(ctx, x - POST_W / 2, 0, x + POST_W / 2, 0, WOOD.light, WOOD.dark)
  ctx.fill(); outline(ctx)
  // topo arredondado e mais claro
  ctx.beginPath()
  ctx.ellipse(x, y - POST_H + 1, POST_W / 2, 1.6, 0, 0, Math.PI * 2)
  ctx.fillStyle = WOOD.light
  ctx.fill(); outline(ctx, 1)
}

function rail(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, lift: number) {
  const t = 1.9 // meia espessura da travessa
  ctx.beginPath()
  ctx.moveTo(ax, ay - lift - t)
  ctx.lineTo(bx, by - lift - t)
  ctx.lineTo(bx, by - lift + t)
  ctx.lineTo(ax, ay - lift + t)
  ctx.closePath()
  ctx.fillStyle = gradient(ctx, 0, ay - lift - t, 0, ay - lift + t, WOOD.light, WOOD.dark)
  ctx.fill(); outline(ctx, 1.1)
}

export function drawFence(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number) {
  // sombra no chão
  ctx.strokeStyle = SHADOW
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(ax + 3, ay + 1.5)
  ctx.lineTo(bx + 3, by + 1.5)
  ctx.stroke()
  // a travessa fica atrás dos postes; o poste mais ao fundo (menor y) é desenhado primeiro
  const [first, second] = ay <= by ? [[ax, ay], [bx, by]] : [[bx, by], [ax, ay]]
  post(ctx, first[0], first[1])
  rail(ctx, ax, ay, bx, by, 17)
  rail(ctx, ax, ay, bx, by, 8.5)
  post(ctx, second[0], second[1])
}

export const TILE_HALF = { w: HW, h: HH }

import type { Avatar } from '@/features/profile/model/avatar'
import type { FarmerAction, Pose } from '@/features/farm/model/farmer'
import { OUTLINE, OUTLINE_W, SHADOW, WOOD } from './style'

// O fazendeiro desenhado por código, no estilo dos outros objetos (contorno escuro, sombra à direita).
// As cores vêm do avatar do jogador: pele, cabelo, roupa e chapéu.

const SKIN: Record<Avatar['skin'], string> = {
  porcelain: '#f8d6c0', light: '#f1c9a5', tan: '#e09a62', olive: '#c68e56', brown: '#a06a42', dark: '#74462a',
}
const HAIR: Record<Avatar['hairColor'], string> = {
  black: '#2a2a36', brown: '#6a3f22', auburn: '#8a3220', ginger: '#d0661e', blonde: '#e0b84e', gray: '#a8a8a8',
}
// [cor da roupa, cor da calça/detalhe]
const OUTFIT: Record<Avatar['outfit'], [string, string]> = {
  overalls_blue: ['#3f6fc4', '#f2e8d4'],
  overalls_red: ['#d2493a', '#f2e8d4'],
  shirt_green: ['#4f9d4a', '#6b4a2e'],
  shirt_purple: ['#8458c0', '#6b4a2e'],
  coat_brown: ['#8a5a34', '#5c3d24'],
}
const PANTS = '#5a4030'

function stroke(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = OUTLINE_W
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  stroke(ctx)
}

function limb(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, width: number, color: string) {
  ctx.lineCap = 'round'
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = width + OUTLINE_W * 2
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
}

// Em que fração do gesto a pancada/ação acontece
const HIT = 0.5

// Enxada, semente ou cesto na mão, conforme o gesto. (hx, hy) = a mão; swing 0..1 = progresso do gesto.
function drawTool(ctx: CanvasRenderingContext2D, action: FarmerAction, hx: number, hy: number, dir: number, swing: number) {
  if (action === 'till') {
    // cabo + lâmina; levanta no começo e desce na pancada
    const lift = Math.sin(Math.min(swing / HIT, 1) * Math.PI * 0.5) * (1 - Math.max(swing - HIT, 0) / (1 - HIT))
    const ang = -0.9 * lift + 0.5 * (swing > HIT ? 1 : 0)
    ctx.save()
    ctx.translate(hx, hy)
    ctx.scale(dir, 1)
    ctx.rotate(ang)
    limb(ctx, -2, 6, 3, -20, 2.4, WOOD.mid)
    ctx.beginPath()
    ctx.moveTo(-6, 8); ctx.lineTo(4, 6); ctx.lineTo(5, 12); ctx.lineTo(-5, 14); ctx.closePath()
    ctx.fillStyle = '#c9ccd2'
    ctx.fill()
    stroke(ctx)
    ctx.restore()
  } else if (action === 'plant') {
    // sementinhas caindo da mão
    ctx.fillStyle = '#6b4a2e'
    for (let i = 0; i < 3; i++) {
      const t = Math.min(Math.max(swing * 1.6 - i * 0.18, 0), 1)
      if (t <= 0 || t >= 1) continue
      ctx.beginPath()
      ctx.arc(hx + dir * (2 + i * 2), hy + 4 + t * 12, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

// (x, y) = o chão sob os pés, no centro do tile. Altura total ~ 66 unidades do mundo.
export function drawFarmer(ctx: CanvasRenderingContext2D, pose: Pose, avatar: Avatar, x: number, y: number) {
  // direção na tela: o losango tem 96x48, então 1 célula = (dc - dr) * 48 de largura, (dc + dr) * 24 de altura
  const sx = (pose.facing.dc - pose.facing.dr) * 48
  const sy = (pose.facing.dc + pose.facing.dr) * 24
  const dir = sx >= 0 ? 1 : -1 // 1 = olha para a direita da tela
  const front = sy >= -1 // de frente para quem joga (senão, de costas)
  const act = pose.acting
  const swing = act ? act.progress : 0
  const walking = pose.walking
  const stride = walking ? Math.sin(pose.phase * Math.PI) : 0
  const bob = walking ? Math.abs(Math.cos(pose.phase * Math.PI)) * 2.2 : 0
  // agachado ao plantar/colher, abaixa o corpo no meio do gesto
  const crouch = act && act.action !== 'till' ? Math.sin(swing * Math.PI) * 7 : 0
  const lean = act ? Math.sin(swing * Math.PI) * 3 * dir : 0

  const skin = SKIN[avatar.skin]
  const hair = HAIR[avatar.hairColor]
  const [shirt, trim] = OUTFIT[avatar.outfit]
  const overalls = avatar.outfit.startsWith('overalls')

  // sombra (luz vem da esquerda, então a sombra cai para a direita)
  ctx.fillStyle = SHADOW
  ctx.beginPath()
  ctx.ellipse(x + 4, y + 1, 15, 6.5, 0, 0, Math.PI * 2)
  ctx.fill()

  const baseY = y - 2 - bob
  const hipY = baseY - 20 + crouch * 0.6
  const shoulderY = hipY - 17 + crouch * 0.4
  const headY = shoulderY - 14 + crouch * 0.3

  // pernas (alternam no passo)
  const legSpread = 4 + (walking ? 1 : 0)
  limb(ctx, x - legSpread, hipY, x - legSpread + stride * 7 * dir, baseY - 1, 5.5, PANTS)
  limb(ctx, x + legSpread, hipY, x + legSpread - stride * 7 * dir, baseY - 1, 5.5, PANTS)
  blob(ctx, x - legSpread + stride * 7 * dir + dir * 1.5, baseY, 4.6, 2.8, '#4a3020')
  blob(ctx, x + legSpread - stride * 7 * dir + dir * 1.5, baseY, 4.6, 2.8, '#4a3020')

  // braço de trás (atrás do corpo): balança ao andar
  const armBack = walking ? -stride * 6 : 0
  limb(ctx, x - dir * 8, shoulderY + 3, x - dir * 9 + armBack * dir, hipY + 4, 4.4, skin)

  // tronco
  const bx = x + lean
  ctx.beginPath()
  ctx.moveTo(bx - 9, shoulderY)
  ctx.quadraticCurveTo(bx - 11, hipY, bx - 8, hipY + 3)
  ctx.lineTo(bx + 8, hipY + 3)
  ctx.quadraticCurveTo(bx + 11, hipY, bx + 9, shoulderY)
  ctx.quadraticCurveTo(bx, shoulderY - 3, bx - 9, shoulderY)
  ctx.closePath()
  const g = ctx.createLinearGradient(bx - 10, 0, bx + 10, 0)
  g.addColorStop(0, shirt)
  g.addColorStop(1, 'rgba(0,0,0,0.25)')
  ctx.fillStyle = shirt
  ctx.fill()
  ctx.fillStyle = g
  ctx.fill()
  stroke(ctx)
  if (overalls) {
    // camiseta clara por baixo + peitilho
    ctx.fillStyle = trim
    ctx.fillRect(bx - 9, shoulderY - 1, 4, 5)
    ctx.fillRect(bx + 5, shoulderY - 1, 4, 5)
    if (front) {
      ctx.fillStyle = shirt
      ctx.fillRect(bx - 5, shoulderY + 3, 10, 9)
      ctx.strokeStyle = OUTLINE
      ctx.lineWidth = 0.9
      ctx.strokeRect(bx - 5, shoulderY + 3, 10, 9)
    }
  }

  // braço da frente; na ação segura a ferramenta ou estica até o chão
  let hx = bx + dir * 9 + (walking ? stride * 6 * dir : 0)
  let hy = hipY + 4
  if (act?.action === 'till') {
    hx = bx + dir * 9
    hy = shoulderY - 2 - Math.sin(Math.min(swing / HIT, 1) * Math.PI * 0.5) * 8 + (swing > HIT ? 14 : 0)
  } else if (act) {
    const reach = Math.sin(swing * Math.PI)
    hx = bx + dir * (10 + reach * 7)
    hy = hipY + 4 + reach * 12
  }
  if (act) drawTool(ctx, act.action, hx, hy, dir, swing)
  limb(ctx, bx + dir * 8, shoulderY + 3, hx, hy, 4.4, skin)
  blob(ctx, hx, hy, 2.6, 2.6, skin)

  // cabeça
  const hxh = bx + (front ? dir * 1.5 : -dir * 1) + lean * 0.5
  blob(ctx, hxh, headY, 11, 11.5, skin)
  if (front) {
    // olhos, olhando um pouco para o lado que anda
    ctx.fillStyle = OUTLINE
    for (const ex of [-4, 4]) {
      ctx.beginPath()
      ctx.ellipse(hxh + ex + dir * 1.5, headY + 1.5, 1.4, 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = 'rgba(224, 110, 90, 0.35)'
    for (const ex of [-6.5, 6.5]) {
      ctx.beginPath()
      ctx.ellipse(hxh + ex + dir * 1.5, headY + 5, 2, 1.2, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  // cabelo: cobre a nuca (de costas, a cabeça toda)
  ctx.beginPath()
  if (front) {
    ctx.moveTo(hxh - 11.4, headY + 1)
    ctx.quadraticCurveTo(hxh - 12, headY - 13, hxh, headY - 12.5)
    ctx.quadraticCurveTo(hxh + 12, headY - 13, hxh + 11.4, headY + 1)
    ctx.quadraticCurveTo(hxh + 6, headY - 6, hxh + dir * 2, headY - 5)
    ctx.quadraticCurveTo(hxh - 5, headY - 7, hxh - 11.4, headY + 1)
  } else {
    ctx.ellipse(hxh, headY, 11.4, 12, 0, 0, Math.PI * 2)
  }
  ctx.fillStyle = avatar.hair === 'bald' ? 'rgba(0,0,0,0)' : hair
  ctx.fill()
  if (avatar.hair !== 'bald') stroke(ctx)

  // chapéu (só os que existem no avatar)
  if (avatar.hat !== 'none') {
    const color = { straw: '#e3b34a', cap: '#d2493a', beanie: '#3f6fc4', cowboy: '#8a5a34' }[avatar.hat]
    const wide = avatar.hat === 'straw' || avatar.hat === 'cowboy'
    blob(ctx, hxh, headY - 8, wide ? 17 : 12, wide ? 5 : 4, color)
    ctx.beginPath()
    ctx.ellipse(hxh, headY - 11, 10, wide ? 7 : 6.5, 0, Math.PI, Math.PI * 2)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    stroke(ctx)
  }
}

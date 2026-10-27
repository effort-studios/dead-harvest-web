import { gradient, hayBale, isoBox, line, outline, sack, shadow, type BoxColors } from './props'
import { BARN_RED, BRICK, CLAY, COPPER, FIRE, HAY, LEAF, METAL, OUTLINE, ROOF, SHADOW, STONE, TRIM, WOOD } from './style'

// Prédios: celeiro, as máquinas, os animais e os balões de "pronto". Mesmo design system dos
// objetos do cenário (props.ts / DESIGN.md): contorno marrom, degradê do claro (esquerda/topo) ao escuro e
// sombra no chão. Tudo é desenhado com a base centrada em (x, y), o centro do chão do prédio no mundo.
//
// Os desenhos são feitos num tamanho só e ampliados (BARN_SCALE, MACHINE_SCALE) para o prédio ter o tamanho que
// condiz com ele: a prensa de sucos cabe numa célula, o moinho e a cozinha ocupam 2x2, o celeiro 3x3.

type Tone = { light: string; mid: string; dark: string }
type Pt = [number, number]

const box = (t: Tone): BoxColors => ({ top: [t.light, t.mid], left: [t.mid, t.dark], right: [t.dark, t.dark] })

function poly(ctx: CanvasRenderingContext2D, pts: Pt[], fill: string | CanvasGradient, width?: number) {
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1])
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  outline(ctx, width)
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string | CanvasGradient, width?: number) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  outline(ctx, width)
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient, width?: number) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  outline(ctx, width)
}

// Ponto numa parede da caixa: s de 0 a 1 ao longo da aresta da base (a -> b), t = altura
const onWall = (a: Pt, b: Pt, s: number, t: number): Pt => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s - t]

// Retângulo pintado numa parede (porta, janela, placa)
function wallRect(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, s0: number, s1: number, t0: number, t1: number, fill: string | CanvasGradient, width?: number) {
  poly(ctx, [onWall(a, b, s0, t0), onWall(a, b, s1, t0), onWall(a, b, s1, t1), onWall(a, b, s0, t1)], fill, width)
}

// Cantos da base de uma caixa isométrica
function corners(x: number, y: number, hw: number, hh: number) {
  return { T: [x, y - hh] as Pt, R: [x + hw, y] as Pt, B: [x, y + hh] as Pt, L: [x - hw, y] as Pt }
}

// Telhado de duas águas em cima de uma caixa (hw, hh, altura da parede h). A cumeeira corre paralela à parede
// da esquerda; a empena (triângulo) fica sobre a parede da direita, pintada com `gable`.
function gableRoof(ctx: CanvasRenderingContext2D, x: number, y: number, hw: number, hh: number, h: number, roofH: number, roof: Tone, gable: Tone) {
  const o = 1.16 // beiral
  const yb = y - h
  const { T, R, B, L } = corners(x, yb, hw * o, hh * o)
  const wall = corners(x, yb, hw, hh)
  const P1: Pt = [(L[0] + T[0]) / 2, (L[1] + T[1]) / 2 - roofH]
  const P2: Pt = [(B[0] + R[0]) / 2, (B[1] + R[1]) / 2 - roofH]
  const W2: Pt = [(wall.B[0] + wall.R[0]) / 2, (wall.B[1] + wall.R[1]) / 2 - roofH]
  poly(ctx, [T, R, P2, P1], gradient(ctx, 0, P1[1], 0, R[1], roof.mid, roof.dark)) // água de trás
  poly(ctx, [wall.B, wall.R, W2], gradient(ctx, 0, W2[1], 0, wall.R[1], gable.mid, gable.dark)) // empena
  poly(ctx, [L, B, P2, P1], gradient(ctx, L[0], P1[1], B[0], B[1], roof.light, roof.mid)) // água da frente
  // telhas: linhas paralelas à cumeeira
  for (const f of [0.33, 0.66]) {
    const a: Pt = [L[0] + (P1[0] - L[0]) * f, L[1] + (P1[1] - L[1]) * f]
    const b: Pt = [B[0] + (P2[0] - B[0]) * f, B[1] + (P2[1] - B[1]) * f]
    line(ctx, a, b, roof.dark, 1.2, 0.6)
  }
  return { ridge: [P1, P2] as [Pt, Pt], gableTop: W2 }
}

// Cilindro de pé (barril, lata, torre): base em (x, y), raio rx/ry, altura h
function cylinder(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, h: number, t: Tone) {
  ctx.beginPath()
  ctx.moveTo(x - rx, y - h)
  ctx.lineTo(x - rx, y)
  ctx.ellipse(x, y, rx, ry, 0, Math.PI, 0, true)
  ctx.lineTo(x + rx, y - h)
  ctx.closePath()
  ctx.fillStyle = gradient(ctx, x - rx, 0, x + rx, 0, t.light, t.dark)
  ctx.fill()
  outline(ctx)
  ellipse(ctx, x, y - h, rx, ry, gradient(ctx, x - rx, y - h - ry, x + rx, y - h + ry, t.light, t.mid))
}

function steam(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.globalAlpha = 0.75
  for (const [dx, dy, r] of [[0, 0, 4.5], [4, -8, 5.5], [-1, -17, 6.5]]) {
    ctx.beginPath()
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2)
    ctx.fillStyle = '#f7f3ea'
    ctx.fill()
  }
  ctx.restore()
}

// Pote de vidro com conteúdo colorido e tampa
function jar(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.beginPath()
  ctx.roundRect(x - 4.5, y - 12, 9, 12, 2.5)
  ctx.fillStyle = color
  ctx.fill()
  outline(ctx, 1.1)
  line(ctx, [x - 2.5, y - 9.5], [x - 2.5, y - 3], '#ffffff', 1.2, 0.6)
  ctx.beginPath()
  ctx.roundRect(x - 5, y - 15, 10, 3.5, 1)
  ctx.fillStyle = METAL.mid
  ctx.fill()
  outline(ctx, 1)
}

// ---------- Celeiro ----------

export const BARN_SCALE = 2

export function drawBarn(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(BARN_SCALE, BARN_SCALE)
  barn(ctx, 0, 0)
  ctx.restore()
}

function barn(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const hw = 66, hh = 33, h = 42
  shadow(ctx, x, y + 6, hw * 1.15, hh * 1.1)
  isoBox(ctx, x, y, hw, hh, h, box(BARN_RED))
  const { L, B, R } = corners(x, y, hw, hh)
  // tábuas verticais nas paredes
  for (let i = 1; i < 8; i++) {
    line(ctx, onWall(L, B, i / 8, 0), onWall(L, B, i / 8, h), BARN_RED.dark, 1, 0.45)
    line(ctx, onWall(B, R, i / 8, 0), onWall(B, R, i / 8, h), '#6d1c12', 1, 0.45)
  }
  // portão grande na parede da frente, com o X branco
  wallRect(ctx, L, B, 0.3, 0.7, 0, 32, gradient(ctx, 0, y - 30, 0, y + 10, BARN_RED.mid, BARN_RED.dark))
  const d = (s: number, t: number) => onWall(L, B, s, t)
  line(ctx, d(0.3, 0), d(0.7, 32), TRIM.light, 2.6)
  line(ctx, d(0.3, 32), d(0.7, 0), TRIM.light, 2.6)
  line(ctx, d(0.5, 0), d(0.5, 32), TRIM.mid, 1.6)
  wallRect(ctx, L, B, 0.27, 0.73, 31, 35, TRIM.light, 1.1) // verga
  // cantos e beirada brancos
  line(ctx, L, [L[0], L[1] - h], TRIM.light, 2.4)
  line(ctx, B, [B[0], B[1] - h], TRIM.light, 2.4)
  line(ctx, R, [R[0], R[1] - h], TRIM.light, 2.4)
  const { gableTop } = gableRoof(ctx, x, y, hw, hh, h, 40, ROOF, BARN_RED)
  // janela do palheiro na empena, com feno aparecendo
  const gx = gableTop[0], gy = gableTop[1] + 24
  poly(ctx, [[gx - 8, gy + 8], [gx + 8, gy + 16], [gx + 8, gy + 2], [gx - 8, gy - 6]], '#3a1a10', 1.2)
  poly(ctx, [[gx - 7, gy + 7], [gx + 7, gy + 14], [gx + 7, gy + 10], [gx - 7, gy + 3]], HAY.mid, 1)
  line(ctx, [gx - 9, gy - 7], [gx + 9, gy + 2], TRIM.light, 2)
  // fardo de feno encostado na frente
  ctx.save()
  ctx.translate(x - hw * 0.97, y + hh * 0.5) // no canto da esquerda, longe do portão
  ctx.scale(0.7, 0.7)
  shadow(ctx, 0, 2, 26, 9)
  hayBale(ctx, 0, 0, 22, 11, 15)
  ctx.restore()
}

// Ampliação de cada máquina: as de 1 célula (prensa, fritadeira, composteira, tear, forno) ficam pouco maiores
// que o desenho; as de 2x2 enchem as 4 células. O moinho, alto, é a maior.
export const MACHINE_SCALE: Record<string, number> = {
  juicer: 1.3,
  fryer: 1.3,
  composter: 1.25,
  loom: 1.35,
  oven: 1.3,
  feed_mill: 2.8,
  mill: 3.1,
  cannery: 2.7,
  dairy: 2.8,
  candy: 2.7,
  ice_cream: 3,
  kitchen: 2.4,
}
const machineScale = (machineId: string) => MACHINE_SCALE[machineId] ?? 1

// Área clicável (elipse relativa à base, no mundo) e altura do balão acima da base, já com a ampliação
const BARN_HIT = { dx: 0, dy: -46, rx: 84, ry: 62 }
const MACHINE_HIT = { dx: 0, dy: -28, rx: 38, ry: 36 }

type Target = { kind: 'barn' } | { kind: 'well' } | { kind: 'machine'; id: string }
const scaleOf = (target: Target) => (target.kind === 'barn' ? BARN_SCALE : target.kind === 'well' ? WELL_SCALE : machineScale(target.id))

export function buildingHit(target: Target) {
  const hit = target.kind === 'barn' ? BARN_HIT : MACHINE_HIT
  const k = scaleOf(target)
  return { dx: hit.dx * k, dy: hit.dy * k, rx: hit.rx * k, ry: hit.ry * k }
}

export const bubbleLift = (target: Target) => (target.kind === 'barn' ? 92 * BARN_SCALE : 62 * scaleOf(target) + 8)

// ---------- Máquinas ----------

function juicer(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 0, 3, 30, 11)
  // caneca de suco ao lado
  ctx.beginPath()
  ctx.roundRect(15, -14, 10, 13, 2)
  ctx.fillStyle = gradient(ctx, 15, 0, 25, 0, '#ffc15a', '#f08a24')
  ctx.fill(); outline(ctx, 1.1)
  // barril
  cylinder(ctx, -2, 0, 17, 7.5, 24, WOOD)
  for (const t of [6, 17]) {
    ctx.beginPath()
    ctx.ellipse(-2, -t, 17, 7.5, 0, 0, Math.PI)
    ctx.strokeStyle = METAL.dark
    ctx.lineWidth = 2
    ctx.stroke()
  }
  // bagaço de laranja em cima
  ellipse(ctx, -2, -24, 13, 5.5, gradient(ctx, -15, -30, 11, -18, '#ffc15a', '#e07d17'), 1)
  // armação da prensa: dois postes, travessa e o fuso com a manivela
  const post = (px: number) => {
    ctx.beginPath()
    ctx.roundRect(px - 2.5, -54, 5, 34, 1.5)
    ctx.fillStyle = gradient(ctx, px - 2.5, 0, px + 2.5, 0, WOOD.light, WOOD.dark)
    ctx.fill(); outline(ctx)
  }
  post(-18)
  post(14)
  ctx.beginPath()
  ctx.roundRect(-22, -58, 40, 7, 2)
  ctx.fillStyle = gradient(ctx, 0, -58, 0, -51, WOOD.light, WOOD.dark)
  ctx.fill(); outline(ctx)
  line(ctx, [-2, -51], [-2, -30], METAL.dark, 3.2)
  line(ctx, [-2, -51], [-2, -30], METAL.light, 1.2)
  ellipse(ctx, -2, -30, 10, 4, gradient(ctx, -12, -34, 8, -26, WOOD.light, WOOD.mid), 1.1)
  line(ctx, [-12, -62], [8, -62], METAL.dark, 2.6)
  line(ctx, [-2, -58], [-2, -62], METAL.dark, 2.6)
  circle(ctx, -12, -62, 2.6, '#d9493a', 1)
  circle(ctx, 8, -62, 2.6, '#d9493a', 1)
  // bica pingando suco
  poly(ctx, [[-10, -9], [-18, -6], [-18, -3], [-10, -5]], METAL.mid, 1)
  ctx.fillStyle = '#ffb236'
  ctx.beginPath()
  ctx.arc(-18, 1, 2, 0, Math.PI * 2)
  ctx.fill()
}

function feedMill(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 2, 3, 34, 12)
  isoBox(ctx, 0, 0, 26, 13, 28, box(WOOD))
  const { L, B, R } = corners(0, 0, 26, 13)
  for (let i = 1; i < 5; i++) line(ctx, onWall(L, B, 0, (i * 28) / 5), onWall(L, B, 1, (i * 28) / 5), WOOD.dark, 1, 0.5)
  wallRect(ctx, L, B, 0.32, 0.68, 0, 18, '#4a2c14', 1.1) // porta
  wallRect(ctx, B, R, 0.3, 0.7, 12, 22, HAY.mid, 1) // janela com grãos
  gableRoof(ctx, 0, 0, 26, 13, 28, 16, ROOF, WOOD)
  // funil de metal em cima
  poly(ctx, [[-4, -50], [10, -46], [6, -36], [-2, -38]], gradient(ctx, -4, 0, 10, 0, METAL.light, METAL.dark))
  ellipse(ctx, 3, -48.5, 7.5, 3, '#e3b34a', 1)
  ctx.save()
  ctx.translate(26, 8)
  ctx.scale(0.75, 0.75)
  sack(ctx, 0, 0)
  ctx.restore()
}

function mill(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 2, 3, 28, 10)
  // torre de pedra afunilando
  poly(ctx, [[-16, 0], [16, 0], [10, -50], [-10, -50]], gradient(ctx, -16, 0, 16, 0, STONE.light, STONE.dark))
  ctx.beginPath()
  ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI)
  ctx.fillStyle = STONE.dark
  ctx.fill(); outline(ctx)
  for (const [y0, y1] of [[-12, -12], [-26, -26], [-39, -39]]) line(ctx, [-14 + (-y0 * 0.08), y0], [14 - (-y1 * 0.08), y1], STONE.dark, 1, 0.6)
  ctx.beginPath()
  ctx.roundRect(-5, -15, 10, 15, [5, 5, 0, 0])
  ctx.fillStyle = '#4a2c14'
  ctx.fill(); outline(ctx, 1.1)
  // telhado cônico
  poly(ctx, [[-14, -48], [14, -48], [0, -70]], gradient(ctx, -14, 0, 14, 0, ROOF.light, ROOF.dark))
  // pás (4 velas de lona com treliça), giradas em volta do eixo
  const hub: Pt = [3, -46]
  for (const a of [0.35, 0.35 + Math.PI / 2, 0.35 + Math.PI, 0.35 + (3 * Math.PI) / 2]) {
    ctx.save()
    ctx.translate(hub[0], hub[1])
    ctx.rotate(a)
    line(ctx, [0, 0], [34, 0], WOOD.dark, 2.2)
    poly(ctx, [[8, 1.5], [33, 1.5], [33, 9], [8, 9]], gradient(ctx, 8, 0, 33, 0, TRIM.light, TRIM.dark), 1.1)
    for (const k of [14, 20, 26]) line(ctx, [k, 1.5], [k, 9], WOOD.mid, 0.9, 0.8)
    ctx.restore()
  }
  circle(ctx, hub[0], hub[1], 3.6, WOOD.mid, 1.2)
}

function cannery(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 2, 3, 34, 12)
  isoBox(ctx, 0, 0, 28, 14, 18, box(WOOD))
  const { L, B } = corners(0, 0, 28, 14)
  wallRect(ctx, L, B, 0.12, 0.45, 3, 14, WOOD.dark, 1)
  wallRect(ctx, L, B, 0.55, 0.88, 3, 14, WOOD.dark, 1)
  // panela de metal com vapor
  cylinder(ctx, -10, -18, 10, 4.5, 14, METAL)
  ellipse(ctx, -10, -32, 8, 3.4, '#c4402f', 1)
  steam(ctx, -10, -40)
  // potes de conserva
  jar(ctx, 6, -16, '#d9433a')
  jar(ctx, 16, -12, '#f08a24')
  jar(ctx, 9, -8, '#e25f3c')
}

function fryer(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 2, 3, 32, 12)
  isoBox(ctx, 0, 0, 25, 12.5, 16, box(STONE))
  const { L, B } = corners(0, 0, 25, 12.5)
  // boca do fogão com fogo
  wallRect(ctx, L, B, 0.3, 0.7, 2, 11, '#2b160c', 1.1)
  const f = onWall(L, B, 0.5, 4)
  ctx.beginPath()
  ctx.moveTo(f[0] - 5, f[1])
  ctx.quadraticCurveTo(f[0] - 4, f[1] - 7, f[0], f[1] - 9)
  ctx.quadraticCurveTo(f[0] + 4, f[1] - 6, f[0] + 5, f[1])
  ctx.closePath()
  ctx.fillStyle = gradient(ctx, 0, f[1] - 9, 0, f[1], FIRE.light, FIRE.dark)
  ctx.fill()
  // tacho de cobre com óleo e batatas
  ctx.beginPath()
  ctx.ellipse(0, -18, 25, 11, 0, 0, Math.PI)
  ctx.lineTo(-25, -18)
  ctx.fillStyle = gradient(ctx, -25, 0, 25, 0, COPPER.light, COPPER.dark)
  ctx.fill(); outline(ctx)
  ctx.beginPath()
  ctx.ellipse(0, -18, 25, 11, 0, Math.PI, 0)
  ctx.lineTo(25, -12)
  ctx.ellipse(0, -12, 25, 11, 0, 0, Math.PI)
  ctx.fillStyle = gradient(ctx, -25, 0, 25, 0, COPPER.mid, COPPER.dark)
  ctx.fill(); outline(ctx)
  ellipse(ctx, 0, -20, 21, 8.5, gradient(ctx, -20, -28, 20, -12, '#ffe58a', '#e3a12a'), 1.1)
  for (const [cx, cy] of [[-9, -21], [-2, -17], [6, -22], [11, -18], [1, -24]]) {
    ctx.beginPath()
    ctx.ellipse(cx, cy, 3.6, 2, 0.4, 0, Math.PI * 2)
    ctx.fillStyle = '#f7d27a'
    ctx.fill(); outline(ctx, 0.9)
  }
  // alças
  for (const s of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(s * 27, -17, 4, 0, Math.PI * 2)
    ctx.strokeStyle = OUTLINE
    ctx.lineWidth = 2.4
    ctx.stroke()
  }
  steam(ctx, 4, -30)
}

function composter(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 2, 3, 32, 12)
  const hw = 27, hh = 13.5, h = 22
  isoBox(ctx, 0, 0, hw, hh, h, box(WOOD))
  const { L, B, R } = corners(0, 0, hw, hh)
  // frestas entre as ripas
  for (const t of [6, 12, 18]) {
    line(ctx, onWall(L, B, 0.02, t), onWall(L, B, 0.98, t), '#3b2412', 1.6, 0.8)
    line(ctx, onWall(B, R, 0.02, t), onWall(B, R, 0.98, t), '#2a180a', 1.6, 0.8)
  }
  // composto escuro aparecendo no topo, com folhas e cascas
  const top = corners(0, -h + 1, hw * 0.82, hh * 0.82)
  poly(ctx, [top.T, top.R, top.B, top.L], gradient(ctx, -hw, -h - hh, hw, -h + hh, '#7a5130', '#4a2e18'), 1)
  for (const [dx, dy, c] of [[-10, -h - 1, LEAF.mid], [5, -h - 3, '#e5483b'], [12, -h + 2, LEAF.light], [-3, -h + 4, '#f08a24'], [-15, -h + 2, LEAF.dark]] as [number, number, string][]) {
    ctx.beginPath()
    ctx.ellipse(dx, dy, 3.4, 1.8, 0.6, 0, Math.PI * 2)
    ctx.fillStyle = c
    ctx.fill(); outline(ctx, 0.8)
  }
  // pá encostada
  line(ctx, [20, -2], [30, -34], WOOD.dark, 2.6)
  poly(ctx, [[17, 2], [24, 0], [23, -8], [17, -6]], METAL.mid, 1)
}

function dairy(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 2, 3, 34, 12)
  const BLUE = { light: '#8ec0f2', mid: '#5b8fd6', dark: '#35609e' }
  isoBox(ctx, 0, 0, 26, 13, 26, box(TRIM))
  const { L, B, R } = corners(0, 0, 26, 13)
  wallRect(ctx, L, B, 0.34, 0.66, 0, 18, BLUE.mid, 1.1) // porta azul
  // placa com uma fatia de queijo na parede da direita
  wallRect(ctx, B, R, 0.25, 0.75, 9, 20, WOOD.light, 1)
  const q = onWall(B, R, 0.5, 14)
  poly(ctx, [[q[0] - 5, q[1] + 2], [q[0] + 5, q[1] + 2], [q[0] + 5, q[1] - 3]], '#ffd23f', 0.9)
  gableRoof(ctx, 0, 0, 26, 13, 26, 16, BLUE, TRIM)
  // latão de leite
  cylinder(ctx, 26, 8, 6, 2.6, 15, METAL)
  cylinder(ctx, 26, -7, 3.5, 1.6, 4, METAL)
}

function candy(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 2, 3, 34, 12)
  const PINK = { light: '#f7b3c8', mid: '#e47fa0', dark: '#b4506f' }
  isoBox(ctx, 0, 0, 28, 14, 18, box(PINK))
  const { L, B } = corners(0, 0, 28, 14)
  for (let i = 1; i < 6; i++) line(ctx, onWall(L, B, i / 6, 0), onWall(L, B, i / 6, 18), PINK.dark, 1, 0.45)
  // potes no balcão
  jar(ctx, -12, -18, '#d9334a')
  jar(ctx, -2, -14, '#f08a24')
  jar(ctx, 8, -18, '#d9334a')
  // postes e toldo listrado
  for (const px of [-26, 26]) line(ctx, [px, -2], [px, -44], WOOD.dark, 2.4)
  const stripes = 6
  for (let i = 0; i < stripes; i++) {
    const a = -30 + (60 * i) / stripes
    const b = -30 + (60 * (i + 1)) / stripes
    poly(ctx, [[a, -46 + a * 0.12], [b, -46 + b * 0.12], [b + 4, -36 + b * 0.12], [a + 4, -36 + a * 0.12]], i % 2 ? TRIM.light : PINK.mid, 1)
  }
  for (let i = 0; i < stripes; i++) {
    const a = -26 + (60 * i) / stripes
    ctx.beginPath()
    ctx.arc(a + 5, -36 + (a + 5) * 0.12, 5, 0, Math.PI)
    ctx.fillStyle = i % 2 ? TRIM.light : PINK.mid
    ctx.fill(); outline(ctx, 1)
  }
}

function loom(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 2, 3, 30, 10)
  // pés em A e as traves
  for (const px of [-20, 18]) {
    line(ctx, [px - 6, 2], [px, -46], WOOD.dark, 4)
    line(ctx, [px + 6, 4], [px, -46], WOOD.mid, 4)
  }
  ctx.beginPath()
  ctx.roundRect(-24, -50, 46, 6, 2)
  ctx.fillStyle = gradient(ctx, 0, -50, 0, -44, WOOD.light, WOOD.dark)
  ctx.fill(); outline(ctx)
  // fios coloridos e o pano tecido embaixo
  const colors = ['#e5483b', '#f2dc3a', '#5b8fd6', '#6cc04a', '#f08a24', '#b476d6']
  for (let i = 0; i < 12; i++) line(ctx, [-16 + i * 3, -44], [-16 + i * 3, -22], colors[i % colors.length], 1.4)
  ctx.beginPath()
  ctx.roundRect(-18, -24, 38, 12, 2)
  ctx.fillStyle = gradient(ctx, 0, -24, 0, -12, '#f7efe0', '#d8c9ae')
  ctx.fill(); outline(ctx, 1.1)
  for (let i = 0; i < 3; i++) line(ctx, [-17, -21 + i * 4], [19, -21 + i * 4], colors[i * 2], 1.6)
  ctx.beginPath()
  ctx.roundRect(-22, -12, 44, 5, 2.5)
  ctx.fillStyle = gradient(ctx, 0, -12, 0, -7, WOOD.light, WOOD.dark)
  ctx.fill(); outline(ctx)
  // novelo no chão
  circle(ctx, 24, -3, 5, gradient(ctx, 19, -8, 29, 2, '#fff6e2', '#d8c9ae'), 1.1)
  line(ctx, [20, -5], [27, -1], '#c9b48c', 1, 0.9)
}

function oven(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 2, 3, 34, 12)
  isoBox(ctx, 0, 0, 28, 14, 10, box(STONE))
  // cúpula de barro
  ctx.beginPath()
  ctx.ellipse(0, -10, 26, 10, 0, 0, Math.PI)
  ctx.ellipse(0, -10, 26, 30, 0, Math.PI, 0)
  ctx.closePath()
  ctx.fillStyle = gradient(ctx, -26, -40, 26, -10, CLAY.light, CLAY.dark)
  ctx.fill(); outline(ctx)
  line(ctx, [-16, -30], [-8, -36], '#f3d3a6', 2, 0.8)
  // boca com o fogo dentro
  ctx.beginPath()
  ctx.moveTo(-17, -8)
  ctx.lineTo(-17, -16)
  ctx.quadraticCurveTo(-10, -28, -3, -16)
  ctx.lineTo(-3, -6)
  ctx.closePath()
  ctx.fillStyle = '#2b160c'
  ctx.fill(); outline(ctx, 1.2)
  ctx.beginPath()
  ctx.moveTo(-14, -8)
  ctx.quadraticCurveTo(-12, -16, -10, -18)
  ctx.quadraticCurveTo(-7, -14, -6, -7)
  ctx.closePath()
  ctx.fillStyle = gradient(ctx, 0, -18, 0, -7, FIRE.light, FIRE.dark)
  ctx.fill()
  // chaminé e lenha
  cylinder(ctx, 8, -36, 4.5, 2, 9, BRICK)
  steam(ctx, 9, -52)
  for (const [lx, ly] of [[22, 6], [27, 3], [24, 0]]) {
    ctx.beginPath()
    ctx.ellipse(lx, ly, 6, 2.6, -0.3, 0, Math.PI * 2)
    ctx.fillStyle = gradient(ctx, lx - 6, 0, lx + 6, 0, WOOD.light, WOOD.dark)
    ctx.fill(); outline(ctx, 1)
  }
}

function iceCream(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 2, 3, 30, 11)
  const MINT = { light: '#bff0e6', mid: '#7fd3c3', dark: '#3f9e8e' }
  isoBox(ctx, 0, -4, 24, 12, 20, box(MINT))
  const { L, B } = corners(0, -4, 24, 12)
  // rodas
  for (const s of [0.2, 0.8]) {
    const w = onWall(L, B, s, -2)
    circle(ctx, w[0], w[1], 5, gradient(ctx, w[0] - 5, 0, w[0] + 5, 0, '#6b7480', '#3a3f46'), 1.2)
    circle(ctx, w[0], w[1], 1.6, METAL.light, 0.8)
  }
  // casquinha pintada na lateral
  const c = onWall(L, B, 0.5, 12)
  poly(ctx, [[c[0] - 4, c[1] - 2], [c[0] + 4, c[1] + 2], [c[0] + 1, c[1] + 9]], '#e3a85a', 0.9)
  circle(ctx, c[0], c[1] - 3, 4, '#f7b3c8', 0.9)
  // tampas da geladeira no topo
  for (const u of [-8, 8]) ellipse(ctx, u, -25 + u * 0.1, 7, 3.2, METAL.light, 1)
  // guarda-sol listrado
  line(ctx, [2, -26], [2, -66], WOOD.dark, 2.2)
  for (let i = 0; i < 6; i++) {
    const a0 = Math.PI + (Math.PI * i) / 6
    const a1 = Math.PI + (Math.PI * (i + 1)) / 6
    poly(ctx, [[2, -70], [2 + Math.cos(a0) * 30, -56 + Math.sin(a0) * -2], [2 + Math.cos(a1) * 30, -56 + Math.sin(a1) * -2]], i % 2 ? TRIM.light : '#e47fa0', 1)
  }
  circle(ctx, 2, -71, 2, '#e5483b', 1)
}

function kitchen(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 2, 4, 42, 15)
  const WALL = { light: '#fff1d4', mid: '#efd3a0', dark: '#bf9d64' }
  const hw = 33, hh = 16.5, h = 30
  isoBox(ctx, 0, 0, hw, hh, h, box(WALL))
  const { L, B, R } = corners(0, 0, hw, hh)
  // janela acesa na frente e porta do lado
  wallRect(ctx, L, B, 0.18, 0.46, 12, 24, gradient(ctx, 0, -24, 0, -12, '#ffe9a8', '#f7b545'), 1.1)
  line(ctx, onWall(L, B, 0.32, 12), onWall(L, B, 0.32, 24), WOOD.dark, 1.4)
  line(ctx, onWall(L, B, 0.18, 18), onWall(L, B, 0.46, 18), WOOD.dark, 1.4)
  wallRect(ctx, L, B, 0.6, 0.86, 0, 22, gradient(ctx, 0, -22, 0, 0, WOOD.mid, WOOD.dark), 1.1)
  wallRect(ctx, B, R, 0.3, 0.7, 12, 22, gradient(ctx, 0, -22, 0, -12, '#ffe9a8', '#f7b545'), 1.1)
  // vigas de madeira nos cantos
  line(ctx, L, [L[0], L[1] - h], WOOD.mid, 2.6)
  line(ctx, B, [B[0], B[1] - h], WOOD.mid, 2.6)
  line(ctx, R, [R[0], R[1] - h], WOOD.mid, 2.6)
  // chaminé (antes do telhado da frente cobrir a base dela)
  isoBox(ctx, -6, -h - 14, 5, 2.5, 22, box(BRICK))
  gableRoof(ctx, 0, 0, hw, hh, h, 22, BRICK, WALL)
  steam(ctx, -5, -h - 44)
}

const MACHINE_DRAW: Record<string, (ctx: CanvasRenderingContext2D) => void> = {
  juicer,
  feed_mill: feedMill,
  mill,
  cannery,
  fryer,
  composter,
  dairy,
  candy,
  loom,
  oven,
  ice_cream: iceCream,
  kitchen,
}

export function drawMachine(ctx: CanvasRenderingContext2D, machineId: string, x: number, y: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(machineScale(machineId), machineScale(machineId))
  ;(MACHINE_DRAW[machineId] ?? feedMill)(ctx)
  ctx.restore()
}

// ---------- Poço ----------

const WELL_SCALE = 1.3

// Mureta de pedra redonda com água escura, dois esteios de madeira, telhadinho e o balde pendurado
export function drawWell(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(WELL_SCALE, WELL_SCALE)
  shadow(ctx, 2, 3, 30, 11)
  // esteio de trás
  poly(ctx, [[13, -10], [16, -10], [16, -50], [13, -50]], gradient(ctx, 13, 0, 16, 0, WOOD.light, WOOD.dark), 1.1)
  cylinder(ctx, 0, 0, 22, 11, 15, STONE)
  // pedras na mureta
  for (const [dx, dy] of [[-15, -8], [-5, -4], [6, -4], [15, -8], [-10, -13], [10, -13]]) {
    ctx.beginPath()
    ctx.ellipse(dx, dy, 4.2, 2.4, 0, 0, Math.PI * 2)
    ctx.strokeStyle = STONE.dark
    ctx.lineWidth = 0.9
    ctx.globalAlpha = 0.6
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  ellipse(ctx, 0, -15, 16, 7.5, gradient(ctx, -16, -22, 16, -8, '#2f5f86', '#173450'), 1.2) // água
  line(ctx, [-6, -17], [2, -14], '#7fb3dc', 1.4, 0.8)
  // esteio da frente, travessa com a corda e o balde
  poly(ctx, [[-16, -6], [-13, -6], [-13, -50], [-16, -50]], gradient(ctx, -16, 0, -13, 0, WOOD.light, WOOD.dark), 1.1)
  line(ctx, [-15, -46], [15, -46], WOOD.dark, 3)
  line(ctx, [0, -46], [0, -32], '#c9a66b', 1.2)
  poly(ctx, [[-4, -33], [4, -33], [3, -25], [-3, -25]], gradient(ctx, -4, 0, 4, 0, METAL.light, METAL.dark), 1)
  // telhadinho de duas águas
  poly(ctx, [[-22, -46], [0, -62], [3, -58], [-19, -42]], gradient(ctx, 0, -62, 0, -42, ROOF.light, ROOF.mid), 1.2)
  poly(ctx, [[0, -62], [22, -48], [19, -44], [3, -58]], gradient(ctx, 0, -62, 0, -44, ROOF.mid, ROOF.dark), 1.2)
  ctx.restore()
}

// ---------- Animais (no cercadinho ao lado do celeiro) ----------

function chicken(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = SHADOW
  ctx.beginPath()
  ctx.ellipse(1, 0, 8, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  line(ctx, [-2, -1], [-2, -5], '#e3a12a', 1.4)
  line(ctx, [2, -1], [2, -5], '#e3a12a', 1.4)
  poly(ctx, [[5, -9], [11, -15], [9, -7]], TRIM.mid, 1) // rabo
  ellipse(ctx, 1, -9, 7.5, 5.5, gradient(ctx, -6, -14, 8, -4, '#ffffff', TRIM.dark))
  circle(ctx, -5, -15, 4, gradient(ctx, -9, -19, -1, -11, '#ffffff', TRIM.mid), 1.1)
  poly(ctx, [[-6, -19], [-4, -21.5], [-2.5, -19]], '#e5483b', 0.9) // crista
  poly(ctx, [[-9, -15.5], [-11.5, -14.5], [-9, -13.5]], '#f7b928', 0.8) // bico
  ctx.fillStyle = OUTLINE
  ctx.beginPath()
  ctx.arc(-6, -15.5, 0.9, 0, Math.PI * 2)
  ctx.fill()
  line(ctx, [-1, -10], [4, -8], TRIM.dark, 1, 0.8) // asa
}

function cow(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = SHADOW
  ctx.beginPath()
  ctx.ellipse(1, 0, 15, 4.5, 0, 0, Math.PI * 2)
  ctx.fill()
  for (const lx of [-9, -4, 5, 10]) {
    ctx.beginPath()
    ctx.roundRect(lx - 1.8, -9, 3.6, 9, 1.2)
    ctx.fillStyle = lx < 0 ? TRIM.light : TRIM.dark
    ctx.fill(); outline(ctx, 1)
  }
  ellipse(ctx, 1, -13, 13, 7.5, gradient(ctx, -12, -20, 14, -6, '#ffffff', TRIM.dark))
  for (const [sx, sy, rx, ry] of [[-3, -15, 4, 3], [6, -11, 3.5, 2.6], [8, -17, 2.4, 1.8]]) {
    ctx.beginPath()
    ctx.ellipse(sx, sy, rx, ry, 0.3, 0, Math.PI * 2)
    ctx.fillStyle = '#3a2a22'
    ctx.fill()
  }
  line(ctx, [14, -14], [17, -7], OUTLINE, 1.2) // rabo
  // cabeça, chifres e focinho
  ctx.beginPath()
  ctx.roundRect(-18, -22, 9, 10, 3.5)
  ctx.fillStyle = gradient(ctx, -18, 0, -9, 0, '#ffffff', TRIM.mid)
  ctx.fill(); outline(ctx, 1.1)
  poly(ctx, [[-17, -22], [-19, -26], [-15.5, -22.5]], TRIM.dark, 0.9)
  poly(ctx, [[-11, -22], [-9, -26], [-12.5, -22.5]], TRIM.dark, 0.9)
  ellipse(ctx, -13.5, -13.5, 5, 3, '#f2a6a6', 1)
  ctx.fillStyle = OUTLINE
  for (const ex of [-16, -11]) {
    ctx.beginPath()
    ctx.arc(ex, -18.5, 0.9, 0, Math.PI * 2)
    ctx.fill()
  }
}

function sheep(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = SHADOW
  ctx.beginPath()
  ctx.ellipse(1, 0, 12, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  for (const lx of [-6, -2, 4, 8]) line(ctx, [lx, -1], [lx, -7], '#3a3a3a', 2.4)
  // lã: bolinhas sobrepostas
  for (const [bx, by, r] of [[-6, -11, 5], [0, -14, 6], [6, -11, 5], [0, -9, 6], [8, -14, 4], [-4, -16, 4]]) {
    circle(ctx, bx, by, r, gradient(ctx, bx - r, by - r, bx + r, by + r, '#ffffff', TRIM.dark), 1)
  }
  ellipse(ctx, -11, -14, 4, 5, gradient(ctx, -15, -19, -7, -9, '#5a5a5a', '#2a2a2a'), 1)
  ellipse(ctx, -14.5, -16, 2.4, 1.2, '#3a3a3a', 0.8)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(-12, -15, 0.9, 0, Math.PI * 2)
  ctx.fill()
}

const ANIMAL_SCALE = 1.4 // perto do celeiro ampliado, no tamanho do desenho eles sumiam

const ANIMAL_DRAW: Record<string, (ctx: CanvasRenderingContext2D) => void> = { chicken, cow, sheep }

export function drawAnimal(ctx: CanvasRenderingContext2D, animalId: string, x: number, y: number, flip: boolean) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(flip ? -ANIMAL_SCALE : ANIMAL_SCALE, ANIMAL_SCALE)
  ;(ANIMAL_DRAW[animalId] ?? chicken)(ctx)
  ctx.restore()
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
      ctx.font = '600 13px Fredoka, system-ui, sans-serif'
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


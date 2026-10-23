// Terra arada desenhada por código, no mesmo estilo cartoon da grama (degradês, sem granulado).
//
// Cada tile é um losango. Pintamos num espaço "uv" onde o tile vai de -0.5 a 0.5:
//   u anda na direção das colunas (para baixo e à direita na tela)
//   v anda na direção das linhas  (para baixo e à esquerda na tela)
// Os sulcos correm ao longo de u e se repetem em v a cada 0.25, no mesmo lugar em todos os
// tiles, então os sulcos de tiles vizinhos se emendam sem linha de divisão.

const FURROWS = 4 // sulcos por tile
const VARIANTS = 3 // variações de torrões/pedrinhas, para a terra não parecer carimbada

function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type SoilGeometry = { halfW: number; halfH: number }

// Pinta um tile (já com a transformação uv aplicada ao canvas dado)
export function paintSoilTile(ctx: CanvasRenderingContext2D, { halfW, halfH }: SoilGeometry, scale: number, variant: number) {
  const w = halfW * 2 * scale
  const h = halfH * 2 * scale
  ctx.save()
  // uv -> pixels do canvas: o centro do tile fica no meio do canvas
  ctx.transform(halfW * scale, halfH * scale, -halfW * scale, halfH * scale, w / 2, h / 2)

  // Cobre um pouco além do tile (±0.52) e depois recorta no losango um pouco maior que o tile:
  // assim tiles vizinhos se sobrepõem de leve e não aparece fresta entre eles.
  ctx.beginPath()
  ctx.rect(-0.53, -0.53, 1.06, 1.06)
  ctx.clip()

  const period = 1 / FURROWS
  for (let k = -1; k <= FURROWS; k++) {
    const v0 = -0.5 + k * period
    // De um vale escuro, sobe até o topo claro do sulco e desce até o próximo vale
    const g = ctx.createLinearGradient(0, v0, 0, v0 + period)
    g.addColorStop(0, '#64401f')
    g.addColorStop(0.22, '#8a5630')
    g.addColorStop(0.5, '#c58a54')
    g.addColorStop(0.78, '#9c6538')
    g.addColorStop(1, '#64401f')
    ctx.fillStyle = g
    ctx.fillRect(-0.6, v0, 1.2, period + 0.002)
  }

  const rand = seededRandom(900 + variant * 77)
  // Torrões: pequenas elipses claras e escuras, só dentro do tile
  for (let i = 0; i < 26; i++) {
    const u = (rand() - 0.5) * 0.88
    const v = (rand() - 0.5) * 0.88
    const light = rand() < 0.55
    ctx.fillStyle = light ? 'rgba(204,150,100,0.55)' : 'rgba(70,40,22,0.4)'
    ctx.beginPath()
    ctx.ellipse(u, v, 0.018 + rand() * 0.03, 0.01 + rand() * 0.015, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  // Algumas pedrinhas
  for (let i = 0; i < 3; i++) {
    const u = (rand() - 0.5) * 0.8
    const v = (rand() - 0.5) * 0.8
    ctx.fillStyle = 'rgba(150,140,128,0.9)'
    ctx.beginPath()
    ctx.ellipse(u, v, 0.03, 0.017, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(214,206,192,0.9)'
    ctx.beginPath()
    ctx.ellipse(u - 0.006, v - 0.005, 0.014, 0.007, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // Recorte final no losango (um pouco maior que o tile real)
  ctx.save()
  ctx.globalCompositeOperation = 'destination-in'
  ctx.beginPath()
  const m = 1.5 * scale // folga em pixels
  ctx.moveTo(w / 2, -m)
  ctx.lineTo(w + m, h / 2)
  ctx.lineTo(w / 2, h + m)
  ctx.lineTo(-m, h / 2)
  ctx.closePath()
  ctx.fillStyle = '#000'
  ctx.fill()
  ctx.restore()
}

// Gera as variações como imagens prontas (tile desenhado com `scale` vezes mais pixels)
export function createSoilTiles(
  geo: SoilGeometry,
  scale: number,
  makeCanvas: (w: number, h: number) => HTMLCanvasElement,
): HTMLCanvasElement[] {
  return Array.from({ length: VARIANTS }, (_, variant) => {
    const canvas = makeCanvas(Math.round(geo.halfW * 2 * scale), Math.round(geo.halfH * 2 * scale))
    const ctx = canvas.getContext('2d')
    if (ctx) paintSoilTile(ctx, geo, scale, variant)
    return canvas
  })
}

// Bits dos lados do tile que dão para fora da terra arada (vizinho sem terra)
export const EDGE = { north: 1, east: 2, south: 4, west: 8 } as const

// Contorno suave nos lados expostos, para a terra "entrar" na grama em vez de parecer recorte.
// north = linha anterior (aresta superior direita), east = coluna seguinte (inferior direita),
// south = linha seguinte (inferior esquerda), west = coluna anterior (superior esquerda).
export function drawSoilEdges(ctx: CanvasRenderingContext2D, x: number, y: number, { halfW, halfH }: SoilGeometry, mask: number) {
  const top = [x, y - halfH]
  const right = [x + halfW, y]
  const bottom = [x, y + halfH]
  const left = [x - halfW, y]
  const edges: [number, number[], number[]][] = [
    [EDGE.north, top, right],
    [EDGE.east, right, bottom],
    [EDGE.south, bottom, left],
    [EDGE.west, left, top],
  ]
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const [bit, a, b] of edges) {
    if (!(mask & bit)) continue
    // faixa larga e transparente (suaviza) + linha escura fina (define a borda)
    for (const [width, color] of [
      [7, 'rgba(60,34,18,0.16)'],
      [3.2, 'rgba(60,34,18,0.55)'],
    ] as const) {
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.beginPath()
      ctx.moveTo(a[0], a[1])
      ctx.lineTo(b[0], b[1])
      ctx.stroke()
    }
  }
}

// Tufos de grama sobre as bordas expostas: escondem a linha reta e misturam a terra com o gramado.
// As posições dependem só do tile (sem aleatório), então não "piscam" a cada desenho.
export function drawGrassFringe(ctx: CanvasRenderingContext2D, x: number, y: number, { halfW, halfH }: SoilGeometry, mask: number) {
  const top = [x, y - halfH]
  const right = [x + halfW, y]
  const bottom = [x, y + halfH]
  const left = [x - halfW, y]
  const edges: [number, number[], number[]][] = [
    [EDGE.north, top, right],
    [EDGE.east, right, bottom],
    [EDGE.south, bottom, left],
    [EDGE.west, left, top],
  ]
  const rand = seededRandom(Math.floor(x * 31 + y * 17))
  for (const [bit, a, b] of edges) {
    if (!(mask & bit)) continue
    const count = 7
    for (let i = 0; i < count; i++) {
      const t = (i + 0.2 + rand() * 0.6) / count
      const px = a[0] + (b[0] - a[0]) * t
      const py = a[1] + (b[1] - a[1]) * t
      const h = 7 + rand() * 7
      const lean = (rand() - 0.5) * 6
      const tone = rand()
      ctx.beginPath()
      ctx.moveTo(px - 2.6, py)
      ctx.quadraticCurveTo(px - 2.4 + lean * 0.1, py - h * 0.55, px + lean, py - h)
      ctx.quadraticCurveTo(px + 2.4 + lean * 0.6, py - h * 0.5, px + 2.6, py)
      ctx.closePath()
      const g = ctx.createLinearGradient(px, py, px + lean, py - h)
      g.addColorStop(0, tone < 0.5 ? '#237a38' : '#2f8f43')
      g.addColorStop(1, tone < 0.5 ? '#6cc650' : '#9be064')
      ctx.fillStyle = g
      ctx.fill()
    }
  }
}

// Textura da grama, gerada por código (sem imagem). Ela é desenhada uma vez numa tela
// pequena e depois repetida pelo mapa inteiro, então precisa "emendar" nas bordas.
//
// A técnica: fundo escuro + centenas de tufos de folhas sobrepostas. Cada folha tem um
// degradê (escuro na base, claro na ponta) e os tufos são pintados de trás para frente,
// então os de baixo cobrem os de cima e a grama ganha profundidade.
export const GRASS_TEXTURE_SIZE = 512

// Gerador de números pseudo-aleatórios com semente: o resultado é sempre o mesmo
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Rgb = [number, number, number]
const mix = (a: Rgb, b: Rgb, t: number): string =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`

// Paleta: de tufos "no fundo" (escuros) até tufos "na frente" (claros)
const BASE_DARK: Rgb = [28, 104, 48]
const BASE_LIGHT: Rgb = [52, 150, 62]
const TIP_DARK: Rgb = [70, 168, 70]
const TIP_LIGHT: Rgb = [150, 222, 92]

export function paintGrassTexture(ctx: CanvasRenderingContext2D, size = GRASS_TEXTURE_SIZE) {
  const rand = seededRandom(20261021)

  // Desenha o mesmo elemento deslocado de ±size quando ele passa da borda,
  // para o que sai por um lado reaparecer do outro (textura sem emenda).
  function wrap(x: number, y: number, reach: number, draw: (x: number, y: number) => void) {
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        const px = x + dx
        const py = y + dy
        if (px + reach < 0 || px - reach > size || py + reach < 0 || py - reach > size) continue
        draw(px, py)
      }
    }
  }

  // 1. Fundo escuro (o que se vê entre os tufos)
  ctx.fillStyle = '#1f6a34'
  ctx.fillRect(0, 0, size, size)

  // 2. Uma folha: curva, com ponta fina, e degradê da base até a ponta
  function blade(px: number, py: number, h: number, w: number, lean: number, base: string, tip: string) {
    const tx = px + lean
    const ty = py - h
    ctx.beginPath()
    ctx.moveTo(px - w / 2, py)
    ctx.quadraticCurveTo(px - w * 0.6 + lean * 0.1, py - h * 0.55, tx, ty)
    ctx.quadraticCurveTo(px + w * 0.5 + lean * 0.6, py - h * 0.5, px + w / 2, py)
    ctx.closePath()
    const g = ctx.createLinearGradient(px, py, tx, ty)
    g.addColorStop(0, base)
    g.addColorStop(1, tip)
    ctx.fillStyle = g
    ctx.fill()
  }

  // 3. Tufos, sorteados e pintados de cima para baixo (os de baixo ficam por cima)
  const clumps = Array.from({ length: 560 }, () => ({
    x: rand() * size,
    y: rand() * size,
    h: 34 + rand() * 26,
    tone: rand(), // 0 = escuro, 1 = claro
    blades: 3 + Math.floor(rand() * 3),
    seed: rand(),
  })).sort((a, b) => a.y - b.y)

  for (const c of clumps) {
    const base = mix(BASE_DARK, BASE_LIGHT, c.tone)
    const tip = mix(TIP_DARK, TIP_LIGHT, c.tone)
    wrap(c.x, c.y, c.h + 6, (px, py) => {
      const local = seededRandom(Math.floor(c.seed * 1e9))
      // folhas de fora primeiro, a do meio (mais alta) por último
      const order = Array.from({ length: c.blades }, (_, i) => i).sort(
        (a, b) => Math.abs(b - (c.blades - 1) / 2) - Math.abs(a - (c.blades - 1) / 2),
      )
      for (const i of order) {
        const t = c.blades === 1 ? 0 : i / (c.blades - 1) - 0.5 // -0.5 .. 0.5
        const h = c.h * (1 - Math.abs(t) * 0.55) * (0.9 + local() * 0.2)
        const lean = t * c.h * 0.95 + (local() - 0.5) * 5
        blade(px + t * 7, py, h, 9 + local() * 4, lean, base, tip)
      }
    })
  }

  // 4. Alguns detalhes: florzinhas espalhadas
  const flowerColors = ['#fff6d8', '#ffe36a', '#ff9fc0']
  for (let i = 0; i < 12; i++) {
    const x = rand() * size
    const y = rand() * size
    const color = flowerColors[Math.floor(rand() * flowerColors.length)]
    wrap(x, y, 6, (px, py) => {
      ctx.fillStyle = color
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(px + Math.cos(a) * 2.6, py + Math.sin(a) * 2.6, 1.9, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#e6a516'
      ctx.beginPath()
      ctx.arc(px, py, 1.5, 0, Math.PI * 2)
      ctx.fill()
    })
  }
}

// Cria o padrão repetível a partir da textura. A textura tem o dobro de pixels e é reduzida
// pela metade, para ficar nítida em telas de alta resolução.
export function createGrassPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const tex = document.createElement('canvas')
  tex.width = GRASS_TEXTURE_SIZE
  tex.height = GRASS_TEXTURE_SIZE
  const tctx = tex.getContext('2d')
  if (!tctx) return null
  paintGrassTexture(tctx)
  const pattern = ctx.createPattern(tex, 'repeat')
  pattern?.setTransform(new DOMMatrix().scale(0.5)) // 512px de textura cobrem 256 unidades do mundo
  return pattern
}

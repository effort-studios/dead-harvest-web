// Textura da grama, gerada por código (sem imagem). Ela é desenhada uma vez numa tela
// pequena e depois repetida pelo mapa inteiro, então precisa "emendar" nas bordas.
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

  // 1. Base
  ctx.fillStyle = '#69ab4d'
  ctx.fillRect(0, 0, size, size)

  // 2. Manchas grandes e suaves, mais claras e mais escuras: quebram a uniformidade
  for (let i = 0; i < 48; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 45 + rand() * 70
    const light = rand() < 0.5
    const rgb = light ? '150,215,100' : '38,105,52'
    const alpha = 0.1 + rand() * 0.1
    wrap(x, y, r, (px, py) => {
      const g = ctx.createRadialGradient(px, py, 0, px, py, r)
      g.addColorStop(0, `rgba(${rgb},${alpha})`)
      g.addColorStop(1, `rgba(${rgb},0)`)
      ctx.fillStyle = g
      ctx.fillRect(px - r, py - r, r * 2, r * 2)
    })
  }

  // 3. Grão fino: varia um pouco o brilho de cada pixel
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 14
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)

  // 4. Tufos de capim: grupos de 3 lâminas inclinadas, escuras e claras
  ctx.lineCap = 'round'
  ctx.lineWidth = 1.6
  for (let i = 0; i < 1250; i++) {
    const x = rand() * size
    const y = rand() * size
    const dark = rand() < 0.55
    const len = 6 + rand() * 6
    const color = dark ? 'rgba(52,118,52,0.5)' : 'rgba(165,226,110,0.55)'
    wrap(x, y, len + 4, (px, py) => {
      ctx.strokeStyle = color
      ctx.beginPath()
      for (let b = -1; b <= 1; b++) {
        const angle = -Math.PI / 2 + b * 0.5 + (rand() - 0.5) * 0.3
        ctx.moveTo(px, py)
        ctx.lineTo(px + Math.cos(angle) * len, py + Math.sin(angle) * len * (b === 0 ? 1 : 0.8))
      }
      ctx.stroke()
    })
  }

  // 5. Algumas florzinhas e pedrinhas espalhadas
  const flowerColors = ['#ffffff', '#ffe36a', '#ff9fc0', '#c9a6ff']
  for (let i = 0; i < 22; i++) {
    const x = rand() * size
    const y = rand() * size
    const color = flowerColors[Math.floor(rand() * flowerColors.length)]
    wrap(x, y, 6, (px, py) => {
      ctx.fillStyle = color
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(px + Math.cos(a) * 2.4, py + Math.sin(a) * 2.4, 1.7, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#e6a516'
      ctx.beginPath()
      ctx.arc(px, py, 1.4, 0, Math.PI * 2)
      ctx.fill()
    })
  }
  for (let i = 0; i < 10; i++) {
    const x = rand() * size
    const y = rand() * size
    wrap(x, y, 5, (px, py) => {
      ctx.fillStyle = 'rgba(120,128,120,0.75)'
      ctx.beginPath()
      ctx.ellipse(px, py, 3.2, 2.1, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(200,206,196,0.7)'
      ctx.beginPath()
      ctx.ellipse(px - 0.8, py - 0.7, 1.4, 0.8, 0, 0, Math.PI * 2)
      ctx.fill()
    })
  }
}

// Cria o padrão repetível a partir da textura. O texture é desenhado com o dobro de pixels
// e reduzido pela metade, para ficar nítido em telas de alta resolução.
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

import type { Avatar } from '../game/avatar'

// Retrato do jogador em pixel art, gerado por código numa grade de 40x40.
// Cada peça é uma "máscara" (quais pixels ela ocupa) pintada com 4 tons em faixas (luz vindo de cima
// e da esquerda) e um contorno de 1 pixel na borda. Detalhes pequenos (olhos, boca, sobrancelhas)
// são desenhados pixel a pixel. O resultado vira um SVG com retângulos nítidos (cache por avatar).

const SIZE = 40
type Tones = [light: string, base: string, shade: string, dark: string]
type Mask = (x: number, y: number) => boolean

const OUTLINE = '#2a170a'

const SKIN: Record<Avatar['skin'], Tones> = {
  porcelain: ['#fff1e4', '#fbe0c8', '#eab89a', '#c98f72'],
  light: ['#ffe0bd', '#f4c795', '#dd9f6c', '#b9774b'],
  tan: ['#f0c38f', '#dba46c', '#bb7c46', '#93582c'],
  olive: ['#d8a873', '#c08a52', '#9c6434', '#774520'],
  brown: ['#ad7a52', '#8f5e38', '#6e4224', '#512d15'],
  dark: ['#7d5539', '#5c3a24', '#422614', '#2c180b'],
}

const BLUSH: Record<Avatar['skin'], string> = {
  porcelain: '#f2a3a0',
  light: '#e8826e',
  tan: '#d9705a',
  olive: '#b85e45',
  brown: '#8a4532',
  dark: '#6b3324',
}

const HAIR: Tones = ['#a8693a', '#6b3f22', '#4a2a15', '#2e1a0c']

const OUTFIT: Record<Avatar['outfit'], Tones> = {
  overalls_blue: ['#7fb0e6', '#4f86c6', '#356aa8', '#244d80'],
  overalls_red: ['#f07a6c', '#d9483b', '#b0322a', '#82211b'],
  shirt_green: ['#8ccf6f', '#5fae4a', '#458a36', '#2f6326'],
  shirt_purple: ['#b18fe0', '#8a62c4', '#6a479f', '#4b3074'],
  coat_brown: ['#b07a4e', '#8a5a35', '#6b4426', '#4a2d17'],
  shirt_yellow: ['#ffe07a', '#f2c53d', '#cf9f25', '#9c7418'],
}
const UNDERSHIRT: Tones = ['#fff8e8', '#f6ecd5', '#dfd0ae', '#bfae88']
const GOLD: Tones = ['#fff0a0', '#f2cd62', '#c99a2e', '#8f6a1a']
const STRAW: Tones = ['#fff0a6', '#f0cd62', '#d1a93f', '#a17e26']
const RED: Tones = ['#f07a6c', '#d94b3a', '#b0322a', '#82211b']
const BLUE: Tones = ['#7fa8e6', '#4a7fd0', '#3463a8', '#244a80']
const WOOL: Tones = ['#ffffff', '#f6f1e6', '#d9d0bd', '#b0a58f']
const LEATHER: Tones = ['#c9935a', '#a8723a', '#855628', '#5e3a19']
const PINK: Tones = ['#ffc2d6', '#ff8fb3', '#e0628d', '#b0406a']

class Grid {
  px: (string | null)[] = new Array(SIZE * SIZE).fill(null)
  set(x: number, y: number, color: string) {
    if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) this.px[y * SIZE + x] = color
  }
}

const ellipse = (cx: number, cy: number, rx: number, ry: number): Mask => (x, y) => {
  const dx = (x + 0.5 - cx) / rx
  const dy = (y + 0.5 - cy) / ry
  return dx * dx + dy * dy <= 1
}
const rect = (x0: number, y0: number, x1: number, y1: number): Mask => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1
const and = (...ms: Mask[]): Mask => (x, y) => ms.every((m) => m(x, y))
const or = (...ms: Mask[]): Mask => (x, y) => ms.some((m) => m(x, y))
const not = (m: Mask): Mask => (x, y) => !m(x, y)
const mirror = (m: Mask): Mask => (x, y) => m(SIZE - 1 - x, y)

// Pinta uma máscara com 4 tons em faixas. (cx, cy, rx, ry) é o "volume" usado no sombreado:
// quanto mais para baixo e para a direita dele, mais escuro. Borda da máscara = contorno.
function paint(g: Grid, mask: Mask, tones: Tones, vol: [number, number, number, number], outline: string | null = OUTLINE) {
  const [cx, cy, rx, ry] = vol
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!mask(x, y)) continue
      const edge = !mask(x - 1, y) || !mask(x + 1, y) || !mask(x, y - 1) || !mask(x, y + 1)
      if (edge && outline) {
        g.set(x, y, outline)
        continue
      }
      const v = 0.55 * ((x + 0.5 - cx) / rx) + 0.5 * ((y + 0.5 - cy) / ry)
      g.set(x, y, tones[v < -0.45 ? 0 : v < 0.25 ? 1 : v < 0.62 ? 2 : 3])
    }
  }
}

// Desenha um "sprite" escrito como texto: cada letra é uma cor da paleta, '.' é transparente
function sprite(g: Grid, x0: number, y0: number, rows: string[], palette: Record<string, string>) {
  rows.forEach((row, dy) =>
    [...row].forEach((ch, dx) => {
      if (ch !== '.') g.set(x0 + dx, y0 + dy, palette[ch])
    }),
  )
}
const flip = (rows: string[]) => rows.map((r) => [...r].reverse().join(''))

// ---------- Geometria do corpo ----------

// Cabeça: oval que afina no queixo
const head: Mask = (x, y) => {
  const t = (y + 0.5 - 18) / 11
  if (t < -1 || t > 1) return false
  const scale = t > 0 ? 1 - 0.3 * t * t : 1
  const dx = (x + 0.5 - 20) / (9.6 * scale)
  return dx * dx + t * t <= 1
}
const ears = or(ellipse(10, 19.5, 2.4, 3.2), ellipse(30, 19.5, 2.4, 3.2))
const neck = rect(16, 26, 23, 33)
const shoulders = and(ellipse(20, 45, 20.5, 14.5), (_x, y) => y >= 30)

// Franja: altura da ponta do cabelo em cada coluna da testa (fios desencontrados)
const FRINGE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 15, 13, 14, 15, 16, 14, 13, 13, 14, 16, 15, 14, 13, 15, 14, 0]
const hairCap = and(ellipse(20, 14.5, 11.8, 11.5), (_x, y) => y <= 21)
const hair: Mask = (x, y) => {
  if (!hairCap(x, y)) return false
  if (x >= 12 && x <= 27) return y <= FRINGE[x] // testa: só até a franja
  return y <= 17 // laterais (costeletas) param acima da orelha
}

// ---------- Peças ----------

function drawBackground(g: Grid) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const d = Math.hypot(x + 0.5 - 20, y + 0.5 - 17) / 22
      g.set(x, y, d > 0.98 ? '#c4a273' : d > 0.7 ? '#d6ba88' : '#e2c99a')
    }
  }
}

function drawOutfit(g: Grid, outfit: Avatar['outfit'], skin: Tones) {
  const tones = OUTFIT[outfit]
  const vol: [number, number, number, number] = [20, 33, 20, 9]
  paint(g, shoulders, tones, vol)
  paint(g, neck, skin, [17, 28, 6, 6])
  // sombra do queixo no pescoço
  for (let x = 17; x <= 22; x++) g.set(x, 27, skin[2])

  if (outfit.startsWith('overalls')) {
    const shirt: Mask = (x, y) => y >= 29 && y <= 36 && Math.abs(x + 0.5 - 20) <= 6.5 - (y - 29) * 0.35
    paint(g, and(shoulders, shirt), UNDERSHIRT, [19, 31, 6, 5])
    const strapL: Mask = (x, y) => y >= 30 && y <= 37 && Math.abs(x - (9 + (y - 30) * 0.8)) <= 1.3
    paint(g, and(shoulders, or(strapL, mirror(strapL))), tones, vol)
    paint(g, rect(14, 35, 25, 40), tones, [19, 36, 8, 4])
    for (let x = 16; x <= 23; x += 2) g.set(x, 38, tones[2]) // costura
    sprite(g, 15, 36, ['g'], { g: GOLD[1] })
    sprite(g, 24, 36, ['g'], { g: GOLD[1] })
  } else if (outfit === 'shirt_purple') {
    const v: Mask = (x, y) => y >= 30 && y <= 35 && x >= 16 + (y - 30) * 0.7 && x <= 23 - (y - 30) * 0.7
    paint(g, v, skin, [18, 31, 5, 4])
  } else if (outfit === 'coat_brown') {
    const inner: Mask = (x, y) => y >= 30 && x >= 16 + (y - 30) * 0.5 && x <= 23 - (y - 30) * 0.5
    paint(g, and(shoulders, inner), UNDERSHIRT, [19, 31, 6, 5])
    const lapel: Mask = (x, y) => y >= 30 && y <= 39 && x <= 18 - Math.floor((y - 30) / 3) && x >= 18 - (y - 30) * 1.1 - 1
    paint(g, and(shoulders, or(lapel, mirror(lapel))), tones.map((_, i) => tones[Math.min(i + 1, 3)]) as Tones, vol)
    sprite(g, 19, 37, ['kk'], { k: OUTLINE })
  } else {
    // gola redonda
    for (let x = 15; x <= 24; x++) g.set(x, 30, tones[3])
    g.set(14, 31, tones[3])
    g.set(25, 31, tones[3])
    if (outfit === 'shirt_yellow') {
      for (let x = 0; x < SIZE; x++) {
        for (const y of [34, 37]) if (shoulders(x, y) && shoulders(x - 1, y) && shoulders(x + 1, y)) g.set(x, y, tones[2])
      }
    }
  }
}

function drawHead(g: Grid, skin: Tones) {
  paint(g, ears, skin, [20, 18, 10, 6])
  // dobra da orelha
  sprite(g, 9, 19, ['s', 's'], { s: skin[3] })
  sprite(g, 30, 19, ['s', 's'], { s: skin[3] })
  paint(g, head, skin, [17, 15, 10, 12])
}

function drawHair(g: Grid) {
  paint(g, hair, HAIR, [16, 8, 11, 11])
  // fios: linhas mais escuras saindo do topo
  const strands: [number, number][] = [[14, 6], [13, 8], [13, 10], [19, 5], [19, 7], [18, 9], [24, 5], [25, 7], [25, 9], [28, 9], [29, 11], [11, 12]]
  for (const [x, y] of strands) if (hair(x, y)) g.set(x, y, HAIR[2])
  // brilho
  const shine: [number, number][] = [[15, 5], [16, 5], [17, 4], [21, 4], [22, 4], [12, 8]]
  for (const [x, y] of shine) if (hair(x, y)) g.set(x, y, HAIR[0])
}

function drawBeard(g: Grid, beard: Avatar['beard']) {
  const mouthArea = rect(16, 23, 23, 25)
  if (beard === 'stubble') {
    for (let y = 21; y < 30; y++)
      for (let x = 0; x < SIZE; x++) {
        const onJaw = head(x, y) && head(x - 1, y) && head(x + 1, y) && head(x, y + 1) && (y >= 24 || x <= 13 || x >= 26)
        if (onJaw && !mouthArea(x, y) && (x + 2 * y) % 3 === 0) g.set(x, y, HAIR[2])
      }
  } else if (beard === 'goatee') {
    paint(g, or(ellipse(20, 28, 3, 3), rect(18, 26, 21, 29)), HAIR, [19, 26, 4, 3])
  } else if (beard === 'full') {
    const area: Mask = (x, y) => (head(x, y) && (y >= 23 || (y >= 19 && (x <= 12 || x >= 27)))) || ellipse(20, 29, 7, 3.5)(x, y)
    paint(g, and(area, not(and(mouthArea, (_x, y) => y >= 24))), HAIR, [17, 24, 10, 7])
  }
}

type Eye = string[]
const EYE: Eye = ['.kkk.', 'kwhpk', '.wii.']
const EYE_BIG: Eye = ['.kkk.', 'kwhpk', 'kwiik', '.www.']
const EYE_CLOSED: Eye = ['k...k', '.kkk.']
const EYE_SLEEPY: Eye = ['kkkkk', '.sss.']

function drawFace(g: Grid, face: Avatar['face'], skin: Tones, blush: string, lightMouth: boolean) {
  const pal = {
    k: OUTLINE,
    w: '#f7f1e8',
    i: '#5f7f45', // íris verde
    p: '#1e120a',
    h: '#ffffff',
    b: HAIR[3],
    s: skin[2],
    m: lightMouth ? '#f3d9b8' : '#8a3a2c',
    d: '#4a1a12',
    r: blush,
  }
  // bochechas e nariz
  sprite(g, 13, 22, ['rr'], pal)
  sprite(g, 25, 22, ['rr'], pal)
  sprite(g, 20, 20, ['s', 's', 'ss'], pal)

  const browsHappy = ['.bbbb', 'b....']
  const browsFlat = ['bbbbb']
  let browY = 16
  let left = EYE
  let right = EYE
  let brows = browsHappy
  let mouth = ['m....m', '.mmmm.']
  if (face === 'calm') {
    brows = browsFlat
    mouth = ['.mmmm.']
  } else if (face === 'wink') {
    right = EYE_CLOSED
  } else if (face === 'surprised') {
    browY = 15
    left = right = EYE_BIG
    mouth = ['..mm..', '.mddm.', '..mm..']
  } else if (face === 'sleepy') {
    brows = browsFlat
    browY = 17
    left = right = EYE_SLEEPY
    mouth = ['..mm..']
  }
  sprite(g, 13, browY, brows, pal)
  sprite(g, 22, browY, flip(brows), pal)
  sprite(g, 13, 18, left, pal)
  sprite(g, 22, 18, right, pal)
  sprite(g, 17, 24, mouth, pal)
}

function drawMustache(g: Grid) {
  sprite(g, 15, 23, ['.hhhhhhhh.', 'bb......bb'], { h: HAIR[1], b: HAIR[3] })
}

function drawHat(g: Grid, hat: Avatar['hat']) {
  if (hat === 'straw') {
    const brim = ellipse(20, 11, 19.8, 3.2)
    paint(g, brim, STRAW, [16, 10, 20, 3])
    const crown = and(ellipse(20, 10, 8.6, 8.4), (_x, y) => y <= 10)
    paint(g, crown, STRAW, [17, 5, 8, 6])
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (crown(x, y) && y < 7 && (x + y) % 3 === 0 && crown(x, y - 1) && crown(x - 1, y)) g.set(x, y, STRAW[2]) // trama
    paint(g, and(crown, rect(0, 7, 39, 9)), RED, [18, 8, 8, 2])
    for (let x = 4; x <= 35; x += 3) if (brim(x, 12) && brim(x, 13)) g.set(x, 12, STRAW[2])
  } else if (hat === 'cap') {
    const dome = and(ellipse(20, 11.5, 10.6, 9.5), (_x, y) => y <= 11)
    paint(g, dome, RED, [16, 5, 10, 7])
    for (let y = 3; y <= 10; y++) g.set(19, y, RED[2])
    sprite(g, 19, 1, ['bb'], { b: RED[3] })
    const visor = and(ellipse(20, 11, 12, 3), (_x, y) => y >= 11)
    paint(g, visor, RED.map((_, i) => RED[Math.min(i + 1, 3)]) as Tones, [18, 12, 12, 2])
  } else if (hat === 'beanie') {
    const dome = and(ellipse(20, 11.5, 10.6, 8.5), (_x, y) => y <= 11)
    paint(g, dome, BLUE, [16, 6, 10, 6])
    const cuff = and(rect(9, 9, 30, 13), not(or(rect(9, 9, 9, 9), rect(30, 9, 30, 9), rect(9, 13, 9, 13), rect(30, 13, 30, 13))))
    paint(g, cuff, BLUE.map((_, i) => BLUE[Math.min(i + 1, 3)]) as Tones, [18, 11, 11, 3])
    for (let x = 11; x <= 28; x += 2) for (let y = 10; y <= 12; y++) g.set(x, y, BLUE[1]) // canelado
    paint(g, ellipse(20, 3.5, 3.6, 3.6), WOOL, [19, 2, 3, 3])
  } else if (hat === 'cowboy') {
    const brim = or(ellipse(20, 11.5, 19.6, 2.8), ellipse(2.5, 9.5, 2.5, 3), ellipse(37.5, 9.5, 2.5, 3))
    paint(g, brim, LEATHER, [16, 10, 20, 3])
    const crown = and(ellipse(20, 11, 7.8, 10), (_x, y) => y <= 11, not(rect(18, 0, 21, 2)))
    paint(g, crown, LEATHER, [17, 5, 8, 6])
    paint(g, and(crown, rect(0, 8, 39, 10)), LEATHER.map((_, i) => LEATHER[Math.min(i + 2, 3)]) as Tones, [18, 9, 8, 2], null)
    sprite(g, 19, 8, ['gg', 'gg'], { g: GOLD[1] })
  } else if (hat === 'flower') {
    sprite(g, 23, 9, ['.kkk', 'kllk', 'kll.', '.k..'], { l: '#5fae4a', k: OUTLINE })
    sprite(g, 25, 2, [
      '..kkk.kkk..',
      '.kpppkpppk.',
      '.kpqpppqpk.',
      'kkppkkkppkk',
      'kpppkyykpppk',
      'kpqpkyykpqpk',
      '.kppkkkkppk.',
      '..kppppppk..',
      '...kpqqpk...',
      '....kkkk....',
    ], { k: OUTLINE, p: PINK[1], q: PINK[0], y: '#ffd23f' })
  }
}

// ---------- Saída ----------

function toSvg(g: Grid): string {
  let rects = ''
  for (let y = 0; y < SIZE; y++) {
    let x = 0
    while (x < SIZE) {
      const color = g.px[y * SIZE + x]
      let end = x + 1
      while (end < SIZE && g.px[y * SIZE + end] === color) end++
      if (color) rects += `<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${color}"/>`
      x = end
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" shape-rendering="crispEdges">${rects}</svg>`
}

const cache = new Map<string, string>()

// URL (data:) da imagem do retrato; a mesma combinação de peças é gerada uma vez só
export function avatarImageUrl(avatar: Avatar): string {
  const key = `${avatar.skin}|${avatar.face}|${avatar.hat}|${avatar.beard}|${avatar.outfit}`
  let url = cache.get(key)
  if (!url) {
    const g = new Grid()
    const skin = SKIN[avatar.skin]
    drawBackground(g)
    drawOutfit(g, avatar.outfit, skin)
    drawHead(g, skin)
    drawHair(g)
    drawBeard(g, avatar.beard)
    drawFace(g, avatar.face, skin, BLUSH[avatar.skin], avatar.beard === 'full')
    if (avatar.beard === 'mustache') drawMustache(g)
    drawHat(g, avatar.hat)
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(toSvg(g))}`
    cache.set(key, url)
  }
  return url
}

export const AVATAR_PIXELS = SIZE

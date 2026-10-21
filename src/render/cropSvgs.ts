// Sprites das plantas de tomate e abóbora, desenhados em SVG (3 estágios cada:
// 0 = broto, 1 = crescendo, 2 = madura). O milho usa os sprites do pacote isométrico.
// Cada SVG tem 64x64 e a base da planta fica em (32, 52).

const DEFS = `<defs>
  <linearGradient id="lf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3f9a3a"/><stop offset="1" stop-color="#8fd95f"/></linearGradient>
  <radialGradient id="tm" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#ff9a86"/><stop offset=".5" stop-color="#e5483b"/><stop offset="1" stop-color="#b02419"/></radialGradient>
  <radialGradient id="pk" cx=".35" cy=".28" r=".9"><stop offset="0" stop-color="#ffc678"/><stop offset=".5" stop-color="#f08a24"/><stop offset="1" stop-color="#c2600f"/></radialGradient>
  <radialGradient id="gr" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#b5e07a"/><stop offset="1" stop-color="#5f9a2c"/></radialGradient>
</defs>`

const SHADOW = '<ellipse cx="32" cy="53" rx="17" ry="5.5" fill="#000" opacity=".2"/>'
const LEAF_OUTLINE = '#2d6a2a'

// Folha apontando para cima a partir de (0,0): `path` é o contorno, o resto vira transformação
const POINTED = 'M0 0C-6-3-8-11 0-17C8-11 6-3 0 0Z'
const BROAD = 'M0 0C-9-1-14-8-9-14C-6-12-3-13 0-16C3-13 6-12 9-14C14-8 9-1 0 0Z'

function leaf(x: number, y: number, deg: number, scale: number, path = POINTED) {
  return `<g transform="translate(${x} ${y}) rotate(${deg}) scale(${scale})">
    <path d="${path}" fill="url(#lf)" stroke="${LEAF_OUTLINE}" stroke-width="${1.2 / scale}" stroke-linejoin="round"/>
    <path d="M0-1V-12" stroke="${LEAF_OUTLINE}" stroke-width="${0.9 / scale}" opacity=".55" stroke-linecap="round"/>
  </g>`
}

function svg(inner: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${DEFS}${SHADOW}${inner}</svg>`
}

// Encolhe um desenho em volta da base da planta (32, 52)
const shrink = (inner: string, k: number) => `<g transform="translate(32 52) scale(${k}) translate(-32 -52)">${inner}</g>`

function tomato(stage: 0 | 1 | 2) {
  if (stage === 0) {
    return svg(`
      <path d="M32 52V43" stroke="#3f8f3a" stroke-width="2.4" stroke-linecap="round"/>
      ${leaf(32, 46, -68, 0.7)}${leaf(32, 46, 68, 0.7)}${leaf(32, 43, 0, 0.6)}`)
  }
  const stake = `<rect x="40" y="13" width="2.6" height="40" rx="1.3" fill="#b07a3e" stroke="#6b4421" stroke-width=".9"/>`
  const stem = `<path d="M32 52C31 40 33 28 33 16" stroke="#3f8f3a" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
  const leaves = [
    leaf(32, 46, -72, 1), leaf(32, 46, 72, 1),
    leaf(32, 38, -55, 1.1), leaf(32, 38, 58, 1.1),
    leaf(33, 30, -38, 1.1), leaf(33, 30, 42, 1.1),
    leaf(33, 23, -18, 1), leaf(33, 23, 22, 1),
    leaf(33, 18, 0, 1.15),
  ].join('')
  if (stage === 1) {
    const flowers = [[25, 33], [40, 28], [28, 24]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#ffe066" stroke="#c9a017" stroke-width=".8"/>`)
      .join('')
    const green = `<circle cx="39" cy="38" r="3.4" fill="url(#gr)" stroke="#3d6a1a" stroke-width="1"/>`
    return svg(shrink(stake + stem + leaves + flowers + green, 0.86))
  }
  const fruit = (x: number, y: number, r: number) => `
    <circle cx="${x}" cy="${y}" r="${r}" fill="url(#tm)" stroke="#7a1c12" stroke-width="1.1"/>
    <path d="M${x - r * 0.55} ${y - r * 0.45}a${r * 0.7} ${r * 0.7} 0 0 1 ${r * 0.6}-${r * 0.35}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M${x} ${y - r * 0.95}l${r * 0.35} ${r * 0.4} ${r * 0.55}-${r * 0.2}-${r * 0.25} ${r * 0.5}-${r * 0.65} ${r * 0.1}-${r * 0.65}-${r * 0.1}-${r * 0.25}-${r * 0.5} ${r * 0.55} ${r * 0.2}z" fill="#58b042" stroke="#2d6a2a" stroke-width=".8" stroke-linejoin="round"/>`
  return svg(shrink(stake + stem + leaves + fruit(23, 40, 5.6) + fruit(41, 36, 5.8) + fruit(35, 27, 5) + fruit(27, 49, 4.6), 0.86))
}

function pumpkin(stage: 0 | 1 | 2) {
  if (stage === 0) {
    return svg(`
      <path d="M32 52V46" stroke="#3f8f3a" stroke-width="2.4" stroke-linecap="round"/>
      ${leaf(32, 47, -55, 0.38, BROAD)}${leaf(32, 47, 55, 0.38, BROAD)}`)
  }
  const vines = `
    <path d="M32 52C22 50 14 53 8 48" stroke="#4a9a38" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M32 52C42 50 50 53 57 48" stroke="#4a9a38" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
  if (stage === 1) {
    const leaves = [
      leaf(14, 49, -70, 0.62, BROAD), leaf(51, 49, 70, 0.62, BROAD),
      leaf(22, 49, -30, 0.7, BROAD), leaf(43, 49, 32, 0.7, BROAD),
      leaf(32, 47, 0, 0.75, BROAD),
    ].join('')
    const bud = `<ellipse cx="32" cy="50" rx="5" ry="4" fill="url(#gr)" stroke="#3d6a1a" stroke-width="1"/>`
    const petals = [0, 72, 144, 216, 288]
      .map((d) => `<circle cx="${24 + 3.2 * Math.cos((d * Math.PI) / 180)}" cy="${43 + 3.2 * Math.sin((d * Math.PI) / 180)}" r="2.6" fill="#ffc83a" stroke="#c98412" stroke-width=".8"/>`)
      .join('')
    const flower = petals + `<circle cx="24" cy="43" r="1.8" fill="#f08a24"/>`
    return svg(vines + leaves + bud + flower)
  }
  const back = [leaf(15, 49, -70, 0.6, BROAD), leaf(50, 49, 70, 0.6, BROAD), leaf(24, 41, -35, 0.6, BROAD), leaf(41, 41, 35, 0.6, BROAD)].join('')
  const body = `
    <ellipse cx="32" cy="43.5" rx="14.5" ry="10.8" fill="url(#pk)" stroke="#8f4709" stroke-width="1.4"/>
    <ellipse cx="32" cy="43.5" rx="9.6" ry="10.8" fill="none" stroke="#b85f12" stroke-width="1.2" opacity=".85"/>
    <ellipse cx="32" cy="43.5" rx="4.6" ry="10.8" fill="#f9a43f" fill-opacity=".55" stroke="#b85f12" stroke-width="1.2" opacity=".9"/>
    <path d="M21 37a12 8 0 0 1 8-4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>
    <path d="M31 33c0-4 1.4-6 4.4-7l1.8 2.8c-2 .8-2.8 2-2.8 4.4z" fill="#6b8f2e" stroke="#3d5a18" stroke-width="1.3" stroke-linejoin="round"/>`
  const front = leaf(20, 52, -50, 0.5, BROAD) + leaf(45, 52, 50, 0.5, BROAD)
  return svg(vines + back + body + front)
}

export const CROP_SPRITE_NAMES = [
  'tomato_0', 'tomato_1', 'tomato_2',
  'pumpkin_0', 'pumpkin_1', 'pumpkin_2',
] as const
export type CropSpriteName = (typeof CROP_SPRITE_NAMES)[number]

export const CROP_SVGS: Record<CropSpriteName, string> = {
  tomato_0: tomato(0), tomato_1: tomato(1), tomato_2: tomato(2),
  pumpkin_0: pumpkin(0), pumpkin_1: pumpkin(1), pumpkin_2: pumpkin(2),
}

export const CROP_SVG_SIZE = 64
export const CROP_SVG_ANCHOR = { x: 32, y: 52 } // base da planta

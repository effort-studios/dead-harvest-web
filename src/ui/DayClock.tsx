import { useEffect, useRef } from 'react'
import { formatDuration } from '@/features/farm/model/crops'
import { clockTime, dayHour, dayPhase, PHASE_LABEL, phaseSpan, type DayPhase } from '@/features/farm/model/daycycle'
import { LateNightIcon, MoonIcon, SunIcon, SunriseIcon, SunsetIcon } from './Icons'

// Relógio do dia: uma cúpula em pixel art com o céu da hora atual e um ponteiro de 24 horas, ao lado
// das placas com o dia, a fase e a hora. Tudo sai do horário do jogo (dayHour, dayPhase, clockTime):
// nada aqui conta tempo por conta própria.
//
// A cúpula é desenhada pixel a pixel num canvas pequeno e ampliada 2x sem suavizar (pixels nítidos).
const W = 40
const H = 52
const PIVOT = { x: 40, y: 26 } // o ponteiro gira em torno do meio da borda reta (lado direito)
const RX = 36 // raios da borda de fora da cúpula (meia elipse abrindo para a esquerda)
const RY = 25
const SKY_RING = 4 // anéis 0..3 = contorno, moldura dourada (2) e contorno de dentro; daí para dentro é céu

const OUTLINE = '#4a2a12'
const GOLD_LIGHT = '#ffd75e'
const GOLD = '#f2b234'
const GOLD_DARK = '#c67d1c'
const HAND = '#ffd23f'
const STAR = '#fff6c0'

// Céu de cada fase em faixas de cor chapada, de cima para baixo
const SKY: Record<DayPhase, string[]> = {
  lateNight: ['#0e1430', '#141c40', '#1a2450', '#212d5e'], // madrugada: azul-escuro
  dawn: ['#2c4680', '#5470ac', '#e6906c', '#f7b46a'], // amanhecer: azul em cima, laranja no horizonte
  morning: ['#62b2ee', '#7fc4f4', '#9dd5fa', '#c3e8ff'], // manhã: azul-claro
  afternoon: ['#56a8ea', '#72bcf2', '#92cef8', '#b8e2fc'], // tarde: céu claro
  dusk: ['#d9607e', '#ef8a5c', '#f6b048', '#ffd47a'], // entardecer: rosa, laranja e dourado
  night: ['#0b1028', '#101838', '#162048', '#1c2856'], // noite: azul-escuro
}
const STARRY: DayPhase[] = ['lateNight', 'night']

// Direção do ponteiro: 00h para cima, 12h para a esquerda, 24h para baixo (o dia inteiro numa
// meia-volta; as pontas ficam longe da borda reta, onde a cúpula é estreita)
const angleOf = (hour: number) => ((245 - (130 * hour) / 24) * Math.PI) / 180

// Ponto do céu na direção da hora, a uma fração `k` do raio do céu
function pointAt(hour: number, k: number) {
  const a = angleOf(hour)
  return { x: PIVOT.x - 0.5 + (RX - SKY_RING) * k * Math.cos(a), y: PIVOT.y - 0.5 + (RY - SKY_RING) * k * Math.sin(a) }
}

// Marcações das horas principais
const TICK_HOURS = [0, 6, 12, 18]

// Estrelas fixas (x, y; as com true são em cruz, maiores)
const STARS: [number, number, boolean][] = [[10, 14, true], [22, 7, false], [6, 26, false], [15, 36, true], [26, 16, false], [8, 40, false], [20, 44, false], [29, 9, true], [13, 22, false]]

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
const luminance = (c: string) => {
  const [r, g, b] = hex(c)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

// Anel de cada pixel da cúpula (-1 = fora). Fixo: calculado uma vez.
const RINGS: number[] = (() => {
  const rings: number[] = []
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - PIVOT.x
      const dy = y + 0.5 - PIVOT.y
      let ring = -1
      while (ring < SKY_RING && (dx / (RX - ring - 1)) ** 2 + (dy / (RY - ring - 1)) ** 2 <= 1) ring++
      // a borda reta (direita) também tem contorno e moldura
      rings.push(Math.min(ring, Math.floor(-dx)))
    }
  }
  return rings
})()

// Topo e altura do céu, para dividir as faixas
const SKY_TOP = PIVOT.y - (RY - SKY_RING)
const SKY_HEIGHT = 2 * (RY - SKY_RING)

function drawDial(ctx: CanvasRenderingContext2D, hour: number, phase: DayPhase) {
  const img = ctx.createImageData(W, H)
  const put = (x: number, y: number, color: string, onlySky = false) => {
    x = Math.round(x)
    y = Math.round(y)
    if (x < 0 || y < 0 || x >= W || y >= H) return
    const ring = RINGS[y * W + x]
    if (ring < 0 || (onlySky && ring < SKY_RING)) return
    const [r, g, b] = hex(color)
    const i = (y * W + x) * 4
    img.data.set([r, g, b, 255], i)
  }
  const sky = SKY[phase]

  // cúpula: contorno, moldura dourada com luz em cima e sombra embaixo, céu em faixas
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ring = RINGS[y * W + x]
      if (ring < 0) continue
      const top = y < PIVOT.y
      if (ring === 0 || ring === 3) put(x, y, OUTLINE)
      else if (ring === 1) put(x, y, top ? GOLD_LIGHT : GOLD)
      else if (ring === 2) put(x, y, top ? GOLD : GOLD_DARK)
      else {
        const pos = ((y - SKY_TOP) / SKY_HEIGHT) * sky.length
        let band = Math.min(Math.max(Math.floor(pos), 0), sky.length - 1)
        // linha de pixels alternados entre uma faixa e outra (pontilhado, sem degradê)
        if (band > 0 && pos - band < sky.length / SKY_HEIGHT && (x + y) % 2 === 0) band--
        put(x, y, sky[band])
      }
    }
  }

  if (STARRY.includes(phase)) {
    for (const [x, y, big] of STARS) {
      put(x, y, STAR, true)
      if (big) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(x + ox, y + oy, '#c9cfef', true)
    }
  }

  // O ponteiro aponta para o sol (5h–19h) ou para a lua (noite); na madrugada, só estrelas.
  // Ficam além da ponta do ponteiro e longe da borda, então nada se esbarra.
  const body = pointAt(hour, 0.74)
  if (hour >= 5 && hour < 19) sun(put, body.x, body.y, phase === 'dawn' || phase === 'dusk')
  else if (phase === 'night') moon(put, body.x, body.y)

  // marcações de 00h, 06h, 12h e 18h na beira do céu: claras no céu escuro, escuras no claro
  const tickColor = luminance(sky[1]) < 110 ? '#f8dfa8' : OUTLINE
  for (const h of TICK_HOURS) {
    const a = angleOf(h)
    for (const k of [0, 1, 2]) put(PIVOT.x + (RX - SKY_RING - 1 - k) * Math.cos(a), PIVOT.y + (RY - SKY_RING - 1 - k) * Math.sin(a), tickColor, true)
  }

  // ponteiro: linha dourada com contorno, da borda reta até perto da beira
  const tip = pointAt(hour, 0.46)
  const from = { x: PIVOT.x - 2, y: PIVOT.y - 0.5 }
  const steps = Math.ceil(Math.max(Math.abs(tip.x - from.x), Math.abs(tip.y - from.y)))
  const line = Array.from({ length: steps + 1 }, (_, i) => ({ x: from.x + ((tip.x - from.x) * i) / steps, y: from.y + ((tip.y - from.y) * i) / steps }))
  for (const p of line) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(p.x + ox, p.y + oy, OUTLINE)
  for (const [ox, oy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [1, -1], [-1, 1], [-1, -1]]) put(tip.x + ox, tip.y + oy, OUTLINE)
  for (const p of line) put(p.x, p.y, HAND)
  for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(tip.x + ox, tip.y + oy, HAND)

  // pino do ponteiro
  for (let y = -4; y <= 4; y++) {
    for (let x = -4; x <= 1; x++) {
      const d = Math.hypot(x, y)
      if (d <= 3.6) put(PIVOT.x - 2 + x, PIVOT.y - 0.5 + y, d <= 2.4 ? (y < 0 ? GOLD_LIGHT : GOLD) : OUTLINE)
    }
  }

  ctx.putImageData(img, 0, 0)
}

type Put = (x: number, y: number, color: string, onlySky?: boolean) => void

// Sol: disco amarelo com borda laranja e 8 raios; mais alaranjado no amanhecer e no entardecer
function sun(put: Put, cx: number, cy: number, low: boolean) {
  const core = low ? '#ffb347' : '#ffd23f'
  for (let y = -5; y <= 5; y++) {
    for (let x = -5; x <= 5; x++) {
      const d = Math.hypot(x, y)
      if (d <= 2.3) put(cx + x, cy + y, x < 0 && y < 0 && d > 1 ? '#fff3a0' : core, true)
      else if (d <= 3.3) put(cx + x, cy + y, '#e0701c', true)
      else if (d > 4.2 && d <= 5.3 && (x === 0 || y === 0 || Math.abs(x) === Math.abs(y))) put(cx + x, cy + y, '#ffb52e', true)
    }
  }
}

// Lua: crescente clara
function moon(put: Put, cx: number, cy: number) {
  for (let y = -4; y <= 4; y++) {
    for (let x = -4; x <= 4; x++) {
      const inside = Math.hypot(x, y) <= 3.6
      const cut = Math.hypot(x - 1.8, y + 1.2) <= 3
      if (inside && !cut) put(cx + x, cy + y, Math.hypot(x, y) > 2.7 ? '#d8c97a' : '#fbe9a0', true)
    }
  }
}

const PHASE_ICON: Record<DayPhase, (props: { size?: number }) => React.JSX.Element> = {
  lateNight: LateNightIcon,
  dawn: SunriseIcon,
  morning: SunIcon,
  afternoon: SunIcon,
  dusk: SunsetIcon,
  night: MoonIcon,
}

const hh = (hour: number) => `${String(hour).padStart(2, '0')}h`

export function DayClock({ time, day }: { time: number; day: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phase = dayPhase(time)
  const label = PHASE_LABEL[phase]
  const PhaseIcon = PHASE_ICON[phase]
  // horário da fase no jogo x quanto ela dura de verdade (depende da duração do dia no servidor)
  const span = phaseSpan(phase)
  const hour = dayHour(time)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) drawDial(ctx, hour, phase)
  }, [hour, phase])

  return (
    <div
      className="day-clock"
      title={`Dia ${day} · ${clockTime(time)}\n${label}: ${hh(span.start)}–${hh(span.end % 24)} no jogo (${formatDuration(Math.round(span.realSeconds))} reais)`}
    >
      <canvas ref={canvasRef} className="clock-dome" width={W} height={H} aria-hidden="true" />

      <div className="clock-frame">
        <div className="clock-plate clock-day">Dia {day}</div>
        <div className="clock-plate clock-phase">
          <PhaseIcon size={20} />
          <span>{label}</span>
        </div>
        <div className="clock-plate clock-time">{clockTime(time)}</div>
      </div>
    </div>
  )
}

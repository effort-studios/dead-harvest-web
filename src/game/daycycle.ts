// Ciclo do dia. O tempo é contado em ticks (1 tick = 1 segundo) desde o amanhecer.
export const DAY_LENGTH = 600 // um dia inteiro dura 10 minutos
export const DAY_START = 120 // jogo novo começa de manhã

// Cor que cobre o mapa em cada ponto do dia (fração 0 a 1). O valor `a` é a opacidade.
// A tela é multiplicada por essa cor: branco com a = 0 deixa o mapa como está (dia claro).
type Keyframe = { at: number; r: number; g: number; b: number; a: number }
const KEYFRAMES: Keyframe[] = [
  { at: 0.0, r: 30, g: 35, b: 90, a: 0.52 }, // fim da noite
  { at: 0.06, r: 255, g: 140, b: 110, a: 0.28 }, // amanhecer rosado
  { at: 0.12, r: 255, g: 200, b: 140, a: 0.14 }, // sol nascendo
  { at: 0.2, r: 255, g: 255, b: 255, a: 0 }, // dia
  { at: 0.55, r: 255, g: 255, b: 255, a: 0 },
  { at: 0.63, r: 255, g: 170, b: 80, a: 0.22 }, // tarde dourada
  { at: 0.7, r: 255, g: 110, b: 60, a: 0.34 }, // pôr do sol
  { at: 0.76, r: 90, g: 50, b: 120, a: 0.46 }, // crepúsculo
  { at: 0.83, r: 15, g: 25, b: 80, a: 0.58 }, // noite
  { at: 0.95, r: 15, g: 25, b: 80, a: 0.56 },
  { at: 1.0, r: 30, g: 35, b: 90, a: 0.52 }, // igual ao início, para o ciclo emendar
]

export function dayFraction(time: number): number {
  return (((time % DAY_LENGTH) + DAY_LENGTH) % DAY_LENGTH) / DAY_LENGTH
}

// Cor (CSS) do filtro de luz no horário `time`, misturando linearmente os dois pontos vizinhos
export function skyTint(time: number): string {
  const f = dayFraction(time)
  const i = KEYFRAMES.findIndex((k) => k.at > f)
  const next = KEYFRAMES[i === -1 ? KEYFRAMES.length - 1 : i]
  const prev = KEYFRAMES[Math.max(0, (i === -1 ? KEYFRAMES.length - 1 : i) - 1)]
  const span = next.at - prev.at
  const t = span === 0 ? 0 : (f - prev.at) / span
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t)
  return `rgba(${mix(prev.r, next.r)}, ${mix(prev.g, next.g)}, ${mix(prev.b, next.b)}, ${(prev.a + (next.a - prev.a) * t).toFixed(3)})`
}

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night'

export function dayPhase(time: number): DayPhase {
  const f = dayFraction(time)
  if (f >= 0.95 || f < 0.12) return 'dawn'
  if (f < 0.55) return 'day'
  if (f < 0.76) return 'dusk'
  return 'night'
}

export const PHASE_LABEL: Record<DayPhase, string> = {
  dawn: 'Amanhecer',
  day: 'Dia',
  dusk: 'Entardecer',
  night: 'Noite',
}

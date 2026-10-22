// Ciclo do dia. O tempo é contado em segundos desde o começo do dia (5h, início do amanhecer). A duração
// do dia é regra do servidor (DAY_LENGTH_SECONDS no .env da API) e chega pelo catálogo.
// O relógio é linear: o dia inteiro cobre 24 horas, então com 24 min de dia 1 s real = 1 min no jogo.
// As fases seguem o horário: amanhecer 5h–8h, manhã 8h–13h, tarde 13h–19h, noite 19h–5h.
let dayLength = 1440

export function setDayLength(seconds: number) {
  dayLength = seconds
}

export const dayLengthSeconds = () => dayLength

const DAY_START_HOUR = 5
const MINUTES_PER_DAY = 24 * 60

// Minutos de relógio desde o começo do dia (0 a 1439)
function dayMinutes(time: number): number {
  const t = ((time % dayLength) + dayLength) % dayLength
  return Math.floor((t * MINUTES_PER_DAY) / dayLength)
}

// Hora do relógio, com fração, de 5 a 29 (29h = 5h do dia seguinte)
export function dayHour(time: number): number {
  const t = ((time % dayLength) + dayLength) % dayLength
  return DAY_START_HOUR + (t / dayLength) * 24
}

// Cor que cobre o mapa em cada hora do dia (de 5h até 29h = 5h do dia seguinte). O valor `a` é a opacidade.
// A tela é multiplicada por essa cor: branco com a = 0 deixa o mapa como está (dia claro).
type Keyframe = { hour: number; r: number; g: number; b: number; a: number }
const KEYFRAMES: Keyframe[] = [
  { hour: 5, r: 30, g: 35, b: 90, a: 0.52 }, // começo do amanhecer: ainda escuro
  { hour: 6, r: 255, g: 140, b: 110, a: 0.28 }, // amanhecer rosado
  { hour: 7, r: 255, g: 200, b: 140, a: 0.14 }, // sol nascendo
  { hour: 8, r: 255, g: 255, b: 255, a: 0 }, // manhã clara
  { hour: 13, r: 255, g: 255, b: 255, a: 0 }, // fim da manhã
  { hour: 15.5, r: 255, g: 170, b: 80, a: 0.22 }, // tarde dourada
  { hour: 17.5, r: 255, g: 110, b: 60, a: 0.34 }, // pôr do sol
  { hour: 19, r: 90, g: 50, b: 120, a: 0.46 }, // crepúsculo: começa a noite
  { hour: 22, r: 15, g: 25, b: 80, a: 0.58 }, // noite
  { hour: 26.5, r: 15, g: 25, b: 80, a: 0.56 },
  { hour: 29, r: 30, g: 35, b: 90, a: 0.52 }, // igual ao início, para o ciclo emendar
]

// Cor (CSS) do filtro de luz no horário `time`, misturando linearmente os dois pontos vizinhos
export function skyTint(time: number): string {
  const h = dayHour(time)
  const i = KEYFRAMES.findIndex((k) => k.hour > h)
  const next = KEYFRAMES[i === -1 ? KEYFRAMES.length - 1 : i]
  const prev = KEYFRAMES[Math.max(0, (i === -1 ? KEYFRAMES.length - 1 : i) - 1)]
  const span = next.hour - prev.hour
  const t = span === 0 ? 0 : (h - prev.hour) / span
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t)
  return `rgba(${mix(prev.r, next.r)}, ${mix(prev.g, next.g)}, ${mix(prev.b, next.b)}, ${(prev.a + (next.a - prev.a) * t).toFixed(3)})`
}

export type DayPhase = 'dawn' | 'morning' | 'afternoon' | 'night'

export const NIGHT_START_HOUR = 19

export function dayPhase(time: number): DayPhase {
  const h = dayHour(time)
  if (h < 8) return 'dawn'
  if (h < 13) return 'morning'
  if (h < NIGHT_START_HOUR) return 'afternoon'
  return 'night'
}

export const PHASE_LABEL: Record<DayPhase, string> = {
  dawn: 'Amanhecer',
  morning: 'Manhã',
  afternoon: 'Tarde',
  night: 'Noite',
}

// Ex.: "06:53". Os minutos andam um a um, como num relógio.
export function clockTime(time: number): string {
  const total = DAY_START_HOUR * 60 + dayMinutes(time) // minutos desde 0h
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Ciclo do dia. O tempo é contado em segundos desde a meia-noite (o dia vira às 00h). A duração
// do dia é regra do servidor (DAY_LENGTH_SECONDS no .env da API) e chega pelo catálogo.
// O relógio é linear: o dia inteiro cobre 24 horas, então com 24 min de dia 1 s real = 1 min no jogo.
// As fases (DAY_PHASES, mais abaixo) são definidas pela hora do jogo; a duração real de cada uma sai daí.
let dayLength = 1440

export function setDayLength(seconds: number) {
  dayLength = seconds
}

export const dayLengthSeconds = () => dayLength

const MINUTES_PER_DAY = 24 * 60

// Minutos de relógio desde a meia-noite (0 a 1439)
function dayMinutes(time: number): number {
  const t = ((time % dayLength) + dayLength) % dayLength
  return Math.floor((t * MINUTES_PER_DAY) / dayLength)
}

// Hora do relógio, com fração, de 0 a 24
export function dayHour(time: number): number {
  const t = ((time % dayLength) + dayLength) % dayLength
  return (t / dayLength) * 24
}

// Cor que cobre o mapa em cada hora do dia, seguindo as fases (madrugada 0h–5h, amanhecer 5h–6h,
// manhã 6h–12h, tarde 12h–17h, entardecer 17h–19h, noite 19h–0h). O valor `a` é a opacidade.
// A tela é multiplicada por essa cor: branco com a = 0 deixa o mapa como está (dia claro).
type Keyframe = { hour: number; r: number; g: number; b: number; a: number }
const KEYFRAMES: Keyframe[] = [
  { hour: 0, r: 15, g: 25, b: 80, a: 0.58 }, // meia-noite
  { hour: 4.5, r: 30, g: 40, b: 95, a: 0.52 }, // fim da madrugada
  { hour: 5, r: 70, g: 70, b: 130, a: 0.42 }, // começo do amanhecer: ainda azulado
  { hour: 5.5, r: 255, g: 140, b: 110, a: 0.28 }, // amanhecer rosado
  { hour: 6, r: 255, g: 200, b: 140, a: 0.14 }, // sol nascendo
  { hour: 7, r: 255, g: 255, b: 255, a: 0 }, // manhã clara
  { hour: 16.5, r: 255, g: 255, b: 255, a: 0 }, // fim da tarde
  { hour: 17.3, r: 255, g: 190, b: 100, a: 0.18 }, // entardecer dourado
  { hour: 18.2, r: 255, g: 120, b: 80, a: 0.32 }, // pôr do sol
  { hour: 18.7, r: 235, g: 100, b: 120, a: 0.36 }, // céu rosado
  { hour: 19, r: 90, g: 50, b: 120, a: 0.46 }, // crepúsculo: começa a noite
  { hour: 20, r: 15, g: 25, b: 80, a: 0.58 }, // noite
  { hour: 24, r: 15, g: 25, b: 80, a: 0.58 }, // igual à meia-noite, para o ciclo emendar
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

export type DayPhase = 'lateNight' | 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night'

// Fases do dia pela hora do JOGO (não pelo tempo real). São referências de ambientação e podem
// mudar no futuro (ex.: conforme a estação). Cada fase vai do seu início até o início da próxima;
// a última vai até 24h, então elas cobrem as 24 horas sem buracos nem sobreposição.
export const DAY_PHASES: { id: DayPhase; label: string; start: number }[] = [
  { id: 'lateNight', label: 'Madrugada', start: 0 },
  { id: 'dawn', label: 'Amanhecer', start: 5 },
  { id: 'morning', label: 'Manhã', start: 6 },
  { id: 'afternoon', label: 'Tarde', start: 12 },
  { id: 'dusk', label: 'Entardecer', start: 17 },
  { id: 'night', label: 'Noite', start: 19 },
]

export const PHASE_LABEL = Object.fromEntries(DAY_PHASES.map((p) => [p.id, p.label])) as Record<DayPhase, string>

export function dayPhase(time: number): DayPhase {
  const h = dayHour(time)
  return DAY_PHASES.findLast((p) => p.start <= h)!.id
}

// Horário da fase no jogo (início e fim, em horas) e quanto ela dura em tempo real (segundos),
// conforme a duração do dia configurada no servidor
export function phaseSpan(phase: DayPhase): { start: number; end: number; realSeconds: number } {
  const i = DAY_PHASES.findIndex((p) => p.id === phase)
  const start = DAY_PHASES[i].start
  const end = DAY_PHASES[i + 1]?.start ?? 24
  return { start, end, realSeconds: ((end - start) * dayLength) / 24 }
}

// Ex.: "06:53". Os minutos andam um a um, como num relógio.
export function clockTime(time: number): string {
  const total = dayMinutes(time) // minutos desde 0h
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

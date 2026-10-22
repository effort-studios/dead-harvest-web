import { clockTime, dayHour, dayPhase, PHASE_LABEL } from '../game/daycycle'
import { MoonIcon, SunIcon } from './Icons'

// Relógio do dia, como o do Stardew: uma cúpula com o céu do dia inteiro pintado fixo (dia embaixo,
// noite em cima, sol e lua parados) e um ponteiro que gira do amanhecer (5h, apontando para baixo),
// pela esquerda, até a madrugada (5h do dia seguinte, apontando para cima). Ao lado, placas com o
// dia, a fase e a hora. A moldura é dourada com contorno marrom, como os ícones do jogo.
const OUTLINE = '#4a2a12'

// Cúpula: meia elipse abrindo para a esquerda; o pivô do ponteiro fica na borda reta
const PIVOT = { x: 78, y: 52 }
const SKY = { rx: 66, ry: 41 } // parte de dentro da cúpula (o céu)
const dome = (rx: number, ry: number) => `M${PIVOT.x} ${PIVOT.y - ry} A${rx} ${ry} 0 0 0 ${PIVOT.x} ${PIVOT.y + ry}Z`

// Ângulo (graus, eixo y para baixo) de uma hora do dia: 5h = 90° (baixo), 17h = 180° (esquerda), 29h = 270° (cima)
const angleOf = (hour: number) => 90 + (180 * (hour - 5)) / 24

// Ponto dentro da cúpula na direção da hora, a uma fração `k` do raio do céu
function pointAt(hour: number, k: number) {
  const a = (angleOf(hour) * Math.PI) / 180
  return { x: PIVOT.x + SKY.rx * k * Math.cos(a), y: PIVOT.y + SKY.ry * k * Math.sin(a) }
}

// Cor do céu ao longo do dia (hora -> cor), misturada entre os pontos vizinhos
const SKY_COLORS: [number, [number, number, number]][] = [
  [5, [58, 62, 122]], // fim da madrugada
  [6.2, [240, 150, 130]], // amanhecer rosado
  [7.4, [255, 214, 150]], // sol nascendo
  [8.5, [128, 204, 255]], // manhã
  [16, [128, 204, 255]], // fim da tarde clara
  [17.4, [255, 180, 92]], // tarde dourada
  [18.5, [226, 112, 90]], // pôr do sol
  [19.6, [74, 58, 122]], // crepúsculo
  [21, [30, 40, 92]], // noite
  [29, [44, 50, 104]], // madrugada
]

function skyColor(hour: number): string {
  const i = Math.max(1, SKY_COLORS.findIndex(([h]) => h > hour))
  const [h0, c0] = SKY_COLORS[i - 1]
  const [h1, c1] = SKY_COLORS[i]
  const t = Math.min(Math.max((hour - h0) / (h1 - h0), 0), 1)
  return `rgb(${c0.map((v, k) => Math.round(v + (c1[k] - v) * t)).join(',')})`
}

// O céu em fatias de 10 minutos, cada uma com a sua cor (fica um degradê em leque)
const SLICE_HOURS = 1 / 6
const SLICES = Array.from({ length: 24 / SLICE_HOURS }, (_, i) => {
  const h0 = 5 + i * SLICE_HOURS
  const far = (h: number) => {
    const a = (angleOf(h) * Math.PI) / 180
    return `${(PIVOT.x + 140 * Math.cos(a)).toFixed(2)} ${(PIVOT.y + 140 * Math.sin(a)).toFixed(2)}`
  }
  return { d: `M${PIVOT.x} ${PIVOT.y} L${far(h0)} L${far(h0 + SLICE_HOURS)}Z`, color: skyColor(h0 + SLICE_HOURS / 2) }
})

// Marcas na borda a cada 3 horas; as de 6h, 12h, 18h e 0h são maiores
const TICKS = Array.from({ length: 7 }, (_, i) => {
  const hour = 8 + i * 3
  const big = hour % 6 === 0
  const a = pointAt(hour, big ? 0.8 : 0.86)
  const b = pointAt(hour, 0.97)
  return { hour, big, d: `M${a.x.toFixed(2)} ${a.y.toFixed(2)} L${b.x.toFixed(2)} ${b.y.toFixed(2)}` }
})

// Estrelas no pedaço da noite (hora, distância do pivô, raio)
const STARS: [number, number, number][] = [[20.5, 0.78, 1.3], [22.5, 0.5, 1], [24, 0.82, 1.4], [26, 0.4, 1.1], [27, 0.74, 1.2], [21.5, 0.32, 0.9]]

const SUN = pointAt(12, 0.58)
const MOON = pointAt(24.5, 0.6)

export function DayClock({ time, day }: { time: number; day: number }) {
  const phase = dayPhase(time)
  const label = PHASE_LABEL[phase]
  const tip = pointAt(dayHour(time), 0.74) // o ponteiro não chega na borda

  return (
    <div className="day-clock" title={`Dia ${day} · ${label} · ${clockTime(time)}`}>
      <svg className="clock-dome" viewBox="0 0 80 104" width="80" height="104" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <defs>
          <linearGradient id="clk-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6c04a" />
            <stop offset="1" stopColor="#c67d1c" />
          </linearGradient>
          <clipPath id="clk-clip">
            <path d={dome(SKY.rx, SKY.ry)} />
          </clipPath>
        </defs>

        <path d={dome(72, 48)} fill="url(#clk-gold)" stroke={OUTLINE} strokeWidth="3" />

        <g clipPath="url(#clk-clip)">
          {SLICES.map((s, i) => (
            <path key={i} d={s.d} fill={s.color} stroke={s.color} strokeWidth="0.6" />
          ))}
          {STARS.map(([hour, k, r], i) => {
            const p = pointAt(hour, k)
            return <circle key={i} cx={p.x} cy={p.y} r={r} fill="#fff6c0" />
          })}
          <g transform={`translate(${SUN.x - 9} ${SUN.y - 9}) scale(.5625)`}>
            <SunShape />
          </g>
          <g transform={`translate(${MOON.x - 8} ${MOON.y - 8}) scale(.5)`}>
            <MoonShape />
          </g>
          {TICKS.map((t) => (
            <path key={t.hour} d={t.d} stroke={OUTLINE} strokeWidth={t.big ? 2 : 1.3} opacity=".7" />
          ))}
        </g>
        <path d={dome(SKY.rx, SKY.ry)} fill="none" stroke={OUTLINE} strokeWidth="2.4" />

        {/* ponteiro dourado */}
        <path d={`M${PIVOT.x} ${PIVOT.y} L${tip.x} ${tip.y}`} stroke={OUTLINE} strokeWidth="5" />
        <path d={`M${PIVOT.x} ${PIVOT.y} L${tip.x} ${tip.y}`} stroke="#f2c14a" strokeWidth="2.4" />
        <circle cx={tip.x} cy={tip.y} r="3" fill="#f2c14a" stroke={OUTLINE} strokeWidth="1.6" />
        <circle cx={PIVOT.x - 1} cy={PIVOT.y} r="6" fill="url(#clk-gold)" stroke={OUTLINE} strokeWidth="2" />
      </svg>

      <div className="clock-frame">
        <div className="clock-plate clock-day">Dia {day}</div>
        <div className="clock-plate clock-phase">
          {phase === 'night' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
          <span>{label}</span>
        </div>
        <div className="clock-plate clock-time">{clockTime(time)}</div>
      </div>
    </div>
  )
}

// Sol e lua desenhados na caixa 32x32 (o grupo é reduzido para caber no ponteiro)
function SunShape() {
  return (
    <>
      <g stroke="#f08a24" strokeWidth="3.4">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
          <path key={d} d={`M16 16 L${16 + 15 * Math.cos((d * Math.PI) / 180)} ${16 + 15 * Math.sin((d * Math.PI) / 180)}`} />
        ))}
      </g>
      <circle cx="16" cy="16" r="9" fill="#ffd23f" stroke={OUTLINE} strokeWidth="2.6" />
    </>
  )
}

function MoonShape() {
  return <path d="M20 3C11 4 6 11 8 19c2 8 11 12 19 8-9 1-14-6-11-14 1-4 2-8 4-10z" fill="#f3efc2" stroke={OUTLINE} strokeWidth="2.6" />
}

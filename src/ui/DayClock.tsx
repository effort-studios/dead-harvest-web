import { clockTime, dayFraction, dayPhase, PHASE_LABEL, skyTint } from '../game/daycycle'
import { MoonIcon, SunIcon } from './Icons'

// Relógio do dia: uma cúpula de céu com o sol (ou a lua) percorrendo um arco, ao lado de placas
// com o dia, a fase e a hora. A moldura é dourada com contorno marrom, como os ícones do jogo.
const OUTLINE = '#4a2a12'

// Cúpula: meia elipse abrindo para a esquerda; o pivô do ponteiro fica na borda reta
const PIVOT = { x: 78, y: 52 }
const ARC = { rx: 54, ry: 36 } // trajeto do sol/lua dentro da cúpula
const dome = (rx: number, ry: number) => `M${PIVOT.x} ${PIVOT.y - ry} A${rx} ${ry} 0 0 0 ${PIVOT.x} ${PIVOT.y + ry}Z`

const STARS: [number, number, number][] = [[34, 24, 1.6], [48, 14, 1.2], [26, 52, 1.2], [44, 36, 1.4], [56, 22, 1], [38, 72, 1.3], [54, 84, 1.1]]

// Sol de manhã e de tarde, lua de noite. A posição no arco vai de baixo (ângulo 90°), pela esquerda, até o topo (270°).
function sunOrMoon(time: number) {
  const f = dayFraction(time)
  const night = f >= 0.75
  const p = night ? (f - 0.75) / 0.25 : f / 0.75
  const a = ((90 + 180 * p) * Math.PI) / 180
  return { night, x: PIVOT.x + ARC.rx * Math.cos(a), y: PIVOT.y + ARC.ry * Math.sin(a) }
}

export function DayClock({ time, day }: { time: number; day: number }) {
  const phase = dayPhase(time)
  const label = PHASE_LABEL[phase]
  const body = sunOrMoon(time)

  return (
    <div className="day-clock" title={`Dia ${day} · ${label}`}>
      <svg className="clock-dome" viewBox="0 0 80 104" width="80" height="104" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <defs>
          <linearGradient id="clk-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6c04a" />
            <stop offset="1" stopColor="#c67d1c" />
          </linearGradient>
          <linearGradient id="clk-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#74c4ff" />
            <stop offset="1" stopColor="#cdeeff" />
          </linearGradient>
          <clipPath id="clk-clip">
            <path d={dome(66, 41)} />
          </clipPath>
        </defs>

        <path d={dome(72, 48)} fill="url(#clk-gold)" stroke={OUTLINE} strokeWidth="3" />
        <path d={dome(66, 41)} fill="url(#clk-sky)" stroke={OUTLINE} strokeWidth="2.4" />

        <g clipPath="url(#clk-clip)">
          <ellipse cx="38" cy="30" rx="9" ry="3.6" fill="#fff" opacity=".85" />
          <ellipse cx="46" cy="27.5" rx="6" ry="3.2" fill="#fff" opacity=".85" />
          <ellipse cx="30" cy="76" rx="8" ry="3.2" fill="#fff" opacity=".8" />
          {/* a luz do dia escurece o céu com a mesma cor que cobre o mapa */}
          <rect x="0" y="0" width="80" height="104" fill={skyTint(time)} style={{ mixBlendMode: 'multiply' }} />
          {STARS.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#fff6c0" style={{ opacity: phase === 'night' ? 1 : 0, transition: 'opacity 2s' }} />
          ))}
          {/* ponteiro dourado até o sol/lua */}
          <path d={`M${PIVOT.x} ${PIVOT.y} L${body.x} ${body.y}`} stroke={OUTLINE} strokeWidth="5" />
          <path d={`M${PIVOT.x} ${PIVOT.y} L${body.x} ${body.y}`} stroke="#e9b13a" strokeWidth="2.6" />
          <g transform={`translate(${body.x - 10.4} ${body.y - 10.4}) scale(.65)`}>{body.night ? <MoonShape /> : <SunShape />}</g>
        </g>
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

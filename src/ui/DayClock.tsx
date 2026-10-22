import { dayFraction, dayPhase, PHASE_LABEL } from '../game/daycycle'

// Relógio do dia: aro dourado dentado, mostrador com as 4 fases em cores e um ponteiro fixo à direita.
// O mostrador gira com o tempo; a fase que está sob o ponteiro é a atual.
const OUTLINE = '#4a2a12'
const CX = 50
const CY = 50
const R_DIAL = 33

// Cor de cada fase, na ordem em que aparecem no dia (cada uma ocupa um quarto)
const WEDGES = ['#e8776a', '#f6c744', '#e8892f', '#3a56a8'] // amanhecer, manhã, tarde, noite

// Ponto do círculo a `deg` graus, contados a partir das 3 horas, no sentido horário
function point(r: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return `${(CX + r * Math.cos(a)).toFixed(2)} ${(CY + r * Math.sin(a)).toFixed(2)}`
}

function wedgePath(index: number) {
  const start = index * 90
  return `M${CX} ${CY} L${point(R_DIAL, start)} A${R_DIAL} ${R_DIAL} 0 0 1 ${point(R_DIAL, start + 90)}Z`
}

// Aro com dentes (engrenagem): 16 dentes entre dois raios
function gearPath() {
  const teeth = 16
  const outer = 46
  const inner = 41.5
  const step = 360 / teeth
  const pts: string[] = []
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    pts.push(point(inner, a), point(outer, a + step * 0.18), point(outer, a + step * 0.5), point(inner, a + step * 0.68))
  }
  return `M${pts.join('L')}Z`
}

const GEAR = gearPath()
const SPOKES = [0, 90, 180, 270]

export function DayClock({ time, day }: { time: number; day: number }) {
  // Ângulo contínuo (dias inteiros + fração): nunca volta atrás, então não precisa tratar a virada do dia
  const angle = -(day - 1 + dayFraction(time)) * 360
  const label = PHASE_LABEL[dayPhase(time)]

  return (
    <div className="day-clock" title={`Dia ${day} · ${label}`}>
      <svg viewBox="0 0 124 100" width="150" height="121" strokeLinejoin="round" strokeLinecap="round" role="img" aria-label={`Dia ${day}, ${label}`}>
        <defs>
          <linearGradient id="clk-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffd96a" />
            <stop offset="1" stopColor="#c9811a" />
          </linearGradient>
        </defs>

        <ellipse cx={CX + 2} cy={CY + 4} rx="46" ry="44" fill="#000" opacity=".25" />
        <path d={GEAR} fill="url(#clk-gold)" stroke={OUTLINE} strokeWidth="2.4" />
        <circle cx={CX} cy={CY} r="38" fill="#a8641a" stroke={OUTLINE} strokeWidth="2" />

        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: 'transform 1s linear',
          }}
        >
          {WEDGES.map((color, i) => (
            <path key={i} d={wedgePath(i)} fill={color} />
          ))}
          {SPOKES.map((d) => (
            <path key={d} d={`M${CX} ${CY} L${point(R_DIAL, d)}`} stroke={OUTLINE} strokeWidth="1.4" opacity=".55" />
          ))}
        </g>
        <circle cx={CX} cy={CY} r={R_DIAL} fill="none" stroke={OUTLINE} strokeWidth="2" />
        <path d={`M${point(R_DIAL - 3, -140)} A${R_DIAL - 3} ${R_DIAL - 3} 0 0 1 ${point(R_DIAL - 3, -70)}`} stroke="#fff" strokeWidth="2" opacity=".35" fill="none" />

        <text
          x={CX}
          y={CY + 5}
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
          fill="#fff"
          stroke={OUTLINE}
          strokeWidth="3.4"
          paintOrder="stroke"
        >
          Dia {day}
        </text>

        {/* ponteiro fixo à direita, apontando para a fase atual */}
        <path d="M82 43 L116 30 L116 70 L82 57Z" fill="#3b2a1d" stroke="#1f130a" strokeWidth="2" />
        {[92, 100, 108].map((x) => (
          <rect key={x} x={x - 2} y={43 - (x - 82) * 0.382 + 3} width="4" height={8 + (x - 82) * 0.765} rx="1.5" fill="#d8b98a" stroke="#1f130a" strokeWidth="1" />
        ))}
      </svg>
    </div>
  )
}

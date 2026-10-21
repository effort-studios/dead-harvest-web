import type { ReactNode } from 'react'
import type { CropId } from '../game/crops'

// Ícones do jogo desenhados em SVG, no mesmo estilo do UI Pack: contorno marrom grosso,
// cores chapadas e um brilho simples. Todos usam a caixa 32x32 e escalam pelo `size`.
const OUTLINE = '#4a2a12'

type IconProps = { size?: number }

function Svg({ size = 24, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      className="svg-icon"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function CoinIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <circle cx="16" cy="16" r="13" fill="#f7b928" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="16" cy="16" r="9" fill="#ffd966" stroke="#c98412" strokeWidth="1.6" />
      {/* brotinho no centro da moeda */}
      <path d="M16 22v-7" stroke="#7a4a12" strokeWidth="2" fill="none" />
      <path d="M16 15c0-3-2-4.6-4.6-4.6 0 2.8 1.8 4.6 4.6 4.6zM16 15c0-3 2-4.6 4.6-4.6 0 2.8-1.8 4.6-4.6 4.6z" fill="#6bb04a" stroke="#3f7a2a" strokeWidth="1" />
      <path d="M7.6 12a9 9 0 0 1 5-4.6" stroke="#fff3d6" strokeWidth="2" fill="none" opacity="0.9" />
    </Svg>
  )
}

export function SunIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="14" y="1.8" width="4" height="6.2" rx="2" fill="#ffb52e" stroke={OUTLINE} strokeWidth="1.6" transform={`rotate(${i * 45} 16 16)`} />
      ))}
      <circle cx="16" cy="16" r="8.5" fill="#ffd23f" stroke={OUTLINE} strokeWidth="2" />
      <path d="M11 13.5a6 6 0 0 1 3.6-3.2" stroke="#fff3d6" strokeWidth="2" fill="none" opacity="0.9" />
    </Svg>
  )
}

export function MoonIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M21 3.5A12.5 12.5 0 1 0 28.5 21 10 10 0 0 1 21 3.5Z" fill="#fbe9a0" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="12.5" cy="19" r="1.8" fill="#e2cb6f" />
      <circle cx="17" cy="24" r="1.2" fill="#e2cb6f" />
      <path d="M26 4.5l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#fff3d6" stroke={OUTLINE} strokeWidth="1" />
    </Svg>
  )
}

export function ShopIcon({ size }: IconProps) {
  const red = '#e0463a'
  const cream = '#fff3d6'
  return (
    <Svg size={size}>
      {/* barraca */}
      <rect x="5" y="14" width="22" height="14" rx="1.5" fill="#c98a4a" stroke={OUTLINE} strokeWidth="2" />
      <rect x="5" y="21" width="22" height="7" rx="1.5" fill="#a86a2e" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="11" cy="19" r="2.3" fill="#e5483b" stroke={OUTLINE} strokeWidth="1.2" />
      <circle cx="16" cy="19" r="2.3" fill="#f08a24" stroke={OUTLINE} strokeWidth="1.2" />
      <circle cx="21" cy="19" r="2.3" fill="#ffd23f" stroke={OUTLINE} strokeWidth="1.2" />
      {/* toldo listrado */}
      {Array.from({ length: 4 }, (_, i) => (
        <polygon
          key={i}
          points={`${7 + 4.5 * i},5 ${7 + 4.5 * (i + 1)},5 ${3 + 6.5 * (i + 1)},12 ${3 + 6.5 * i},12`}
          fill={i % 2 ? cream : red}
        />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <path key={i} d={`M${3 + 6.5 * i} 12a3.25 3.25 0 0 0 6.5 0z`} fill={i % 2 ? cream : red} stroke={OUTLINE} strokeWidth="1.5" />
      ))}
      <path d="M7 5H25L29 12H3Z" fill="none" stroke={OUTLINE} strokeWidth="2" />
    </Svg>
  )
}

export function BulbIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M8.6 7.6l-2-2M23.4 7.6l2-2M4.6 15h-2.4M27.4 15h2.4" stroke="#e6a516" strokeWidth="2" fill="none" />
      <rect x="12" y="21" width="8" height="5" rx="1.2" fill="#9aa3ad" stroke={OUTLINE} strokeWidth="1.8" />
      <rect x="13.4" y="25.6" width="5.2" height="3.2" rx="1.6" fill="#6b7480" stroke={OUTLINE} strokeWidth="1.6" />
      <circle cx="16" cy="14.5" r="8.5" fill="#ffe27a" stroke={OUTLINE} strokeWidth="2" />
      <path d="M13 15.5l3 3 3-3" stroke="#c98412" strokeWidth="1.6" fill="none" />
      <path d="M10.5 11.5a6 6 0 0 1 3.2-3" stroke="#fff3d6" strokeWidth="2" fill="none" opacity="0.9" />
    </Svg>
  )
}

export function FarmerIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M5 31c0-6.5 5-9.5 11-9.5s11 3 11 9.5z" fill="#4f86c6" stroke={OUTLINE} strokeWidth="2" />
      <path d="M12 22v4M20 22v4" stroke="#2f5c96" strokeWidth="2" fill="none" />
      <circle cx="16" cy="16.5" r="7" fill="#f4c795" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="13.2" cy="17.2" r="1" fill={OUTLINE} />
      <circle cx="18.8" cy="17.2" r="1" fill={OUTLINE} />
      <circle cx="11.4" cy="19.4" r="1.3" fill="#ec8f7c" opacity="0.7" />
      <circle cx="20.6" cy="19.4" r="1.3" fill="#ec8f7c" opacity="0.7" />
      <path d="M13.6 20.2q2.4 1.8 4.8 0" stroke={OUTLINE} strokeWidth="1.4" fill="none" />
      {/* chapéu de palha */}
      <path d="M9.6 12c0-6 3-8.6 6.4-8.6s6.4 2.6 6.4 8.6z" fill="#f0cd62" stroke={OUTLINE} strokeWidth="2" />
      <path d="M9.9 10.4h12.2" stroke="#d94b3a" strokeWidth="2.4" fill="none" />
      <ellipse cx="16" cy="12.4" rx="11.5" ry="3.2" fill="#f0cd62" stroke={OUTLINE} strokeWidth="2" />
    </Svg>
  )
}

export function InfoIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <circle cx="16" cy="16" r="13" fill="#5aa0e0" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="16" cy="9.8" r="2" fill="#fff3d6" />
      <rect x="14.2" y="13.4" width="3.6" height="10" rx="1.8" fill="#fff3d6" />
      <path d="M8 11a9 9 0 0 1 4-3.6" stroke="#fff3d6" strokeWidth="1.6" fill="none" opacity="0.55" />
    </Svg>
  )
}

export function SaveIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M5 4h19l3 3v21H5z" fill="#5b86c9" stroke={OUTLINE} strokeWidth="2" />
      <rect x="9" y="4.8" width="13" height="7.4" fill="#dfe6ee" stroke={OUTLINE} strokeWidth="1.6" />
      <rect x="18" y="6.2" width="2.6" height="4.6" fill="#5b86c9" />
      <rect x="8" y="16" width="16" height="11" rx="1" fill="#fff3d6" stroke={OUTLINE} strokeWidth="1.6" />
      <path d="M11 20h10M11 23.6h7" stroke="#b98a5a" strokeWidth="1.3" fill="none" />
    </Svg>
  )
}

export function CloseIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M8 8l16 16M24 8L8 24" stroke={OUTLINE} strokeWidth="4.2" fill="none" />
    </Svg>
  )
}

export function CornIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <g transform="rotate(22 16 16)">
        <ellipse cx="16" cy="14.5" rx="5.6" ry="10.5" fill="#ffd23f" stroke={OUTLINE} strokeWidth="2" />
        <path d="M10.8 9h10.4M10.5 13h11M10.8 17h10.4M16 4.5v20" stroke="#e0a312" strokeWidth="1.3" fill="none" />
        <path d="M16 30C7 28 5.5 19 9.5 14c.4 6 3.4 10 6.5 11z" fill="#6bb04a" stroke={OUTLINE} strokeWidth="2" />
        <path d="M16 30c9-2 10.5-11 6.5-16-.4 6-3.4 10-6.5 11z" fill="#4ea03a" stroke={OUTLINE} strokeWidth="2" />
      </g>
    </Svg>
  )
}

export function TomatoIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <ellipse cx="16" cy="18" rx="12" ry="10.4" fill="#e5483b" stroke={OUTLINE} strokeWidth="2" />
      <path d="M7.6 16a9 8 0 0 1 5.2-5.6" stroke="#ff9f92" strokeWidth="2.2" fill="none" />
      <rect x="14.9" y="4.2" width="2.2" height="5.6" rx="1.1" fill="#3f7a2a" stroke={OUTLINE} strokeWidth="1.2" />
      <path d="M16 9.2l2.2 2.6 3.5-1-1.5 3.3L16 14.6l-4.2-.5-1.5-3.3 3.5 1z" fill="#58b042" stroke={OUTLINE} strokeWidth="1.5" />
    </Svg>
  )
}

export function PumpkinIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <ellipse cx="16" cy="19.5" rx="13" ry="9.6" fill="#f08a24" stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="16" cy="19.5" rx="8.8" ry="9.6" fill="none" stroke="#b85f12" strokeWidth="1.5" />
      <ellipse cx="16" cy="19.5" rx="4.2" ry="9.6" fill="#f9a43f" stroke="#b85f12" strokeWidth="1.5" />
      <path d="M13.5 12.2c-3-1.4-5.6-.8-7 1.4 3.2 1 5.4.2 7-1.4z" fill="#6bb04a" stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M14.4 10.2c-.3-3 1-4.8 3.8-5.8l1.6 2.4c-1.5.6-2.3 1.6-2.4 3.4z" fill="#6b8f2e" stroke={OUTLINE} strokeWidth="1.5" />
    </Svg>
  )
}

// Ícone da planta pelo id (usado nos slots da barra e na loja)
export function CropIcon({ crop, size }: { crop: CropId; size?: number }) {
  if (crop === 'corn') return <CornIcon size={size} />
  if (crop === 'tomato') return <TomatoIcon size={size} />
  return <PumpkinIcon size={size} />
}

import type { ReactNode } from 'react'

// Ícones do jogo desenhados em SVG, no mesmo estilo do UI Pack: contorno marrom grosso,
// cores chapadas e um brilho simples. Todos usam a caixa 32x32 e escalam pelo `size`.
export const OUTLINE = '#4a2a12'

export type IconProps = { size?: number }

export function Svg({ size = 24, children }: { size?: number; children: ReactNode }) {
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

const EYE_OUTLINE = 'M2.5 16C6 10 10.5 7.5 16 7.5S26 10 29.5 16C26 22 21.5 24.5 16 24.5S6 22 2.5 16z'

export function EyeIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d={EYE_OUTLINE} fill="#fff6dc" stroke={OUTLINE} strokeWidth="2.2" />
      <circle cx="16" cy="16" r="5" fill="#8a4f1c" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="17.8" cy="14.2" r="1.4" fill="#fff" />
    </Svg>
  )
}

// Olho riscado: a senha está visível e o clique a esconde
export function EyeOffIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d={EYE_OUTLINE} fill="#fff6dc" stroke={OUTLINE} strokeWidth="2.2" />
      <circle cx="16" cy="16" r="5" fill="#8a4f1c" stroke={OUTLINE} strokeWidth="2" />
      <path d="M5 27L27 5" stroke="#fff6dc" strokeWidth="6.5" />
      <path d="M5 27L27 5" stroke={OUTLINE} strokeWidth="2.6" />
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

export function MusicIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M12 24V8l14-3v16" fill="none" stroke={OUTLINE} strokeWidth="5" />
      <path d="M12 24V8l14-3v16" fill="none" stroke="#ffd966" strokeWidth="2" />
      <ellipse cx="9" cy="24" rx="5" ry="4" fill="#f7b928" stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="23" cy="21" rx="5" ry="4" fill="#f7b928" stroke={OUTLINE} strokeWidth="2" />
    </Svg>
  )
}

export function MusicOffIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M12 24V8l14-3v16" fill="none" stroke={OUTLINE} strokeWidth="5" opacity="0.5" />
      <path d="M12 24V8l14-3v16" fill="none" stroke="#c9b48a" strokeWidth="2" />
      <ellipse cx="9" cy="24" rx="5" ry="4" fill="#c9b48a" stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="23" cy="21" rx="5" ry="4" fill="#c9b48a" stroke={OUTLINE} strokeWidth="2" />
      <path d="M4 4L28 28" stroke={OUTLINE} strokeWidth="5" />
      <path d="M4 4L28 28" stroke="#e5484d" strokeWidth="2.4" />
    </Svg>
  )
}

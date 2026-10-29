import type { ReactNode } from 'react'

// Ícones do jogo. Os de coisas do jogo são pixel art (PixelIcon); os de comando (salvar, olho, fechar)
// continuam em SVG: contorno marrom grosso, cores chapadas, caixa 32x32 que escala pelo `size`.
export const OUTLINE = '#4a2a12'

export type IconProps = { size?: number }

export function Svg({ size = 24, children }: { size?: number; children: ReactNode }) {
  return (
    <svg className="svg-icon" width={size} height={size} viewBox="0 0 32 32" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      {children}
    </svg>
  )
}

// Ícone em pixel art (public/assets/icons/<nome>.png, 32x32, gerado na PixelLab): ampliado sem borrar
export function PixelIcon({ name, size = 24, src }: { name: string; size?: number; src?: string }) {
  return <img className="svg-icon pixel-icon" src={src ?? `/assets/icons/${name}.png`} width={size} height={size} alt="" draggable={false} aria-hidden="true" />
}

export const CoinIcon = ({ size }: IconProps) => <PixelIcon name="coin" size={size} />
export const FarmerIcon = ({ size }: IconProps) => <PixelIcon name="farmer" size={size} />

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

export function PlayIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M10 6.5v19l16-9.5z" fill="#fff0cc" stroke={OUTLINE} strokeWidth="2.4" />
    </Svg>
  )
}

export function PauseIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <rect x="7" y="6" width="7" height="20" rx="1.5" fill="#fff0cc" stroke={OUTLINE} strokeWidth="2.4" />
      <rect x="18" y="6" width="7" height="20" rx="1.5" fill="#fff0cc" stroke={OUTLINE} strokeWidth="2.4" />
    </Svg>
  )
}

// Pula para a música seguinte (a anterior é a mesma figura espelhada)
export function NextIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M6 7v18l12-9z" fill="#fff0cc" stroke={OUTLINE} strokeWidth="2.4" />
      <rect x="21" y="7" width="5" height="18" rx="1.5" fill="#fff0cc" stroke={OUTLINE} strokeWidth="2.4" />
    </Svg>
  )
}

export function PrevIcon({ size }: IconProps) {
  return (
    <span style={{ display: 'inline-flex', transform: 'scaleX(-1)' }}>
      <NextIcon size={size} />
    </span>
  )
}

export function VolumeIcon({ size, level = 2 }: IconProps & { level?: 0 | 1 | 2 }) {
  return (
    <Svg size={size}>
      <path d="M5 12h5l7-6v20l-7-6H5z" fill="#fff0cc" stroke={OUTLINE} strokeWidth="2.2" />
      {level === 0 ? (
        <path d="M22 12l7 8M29 12l-7 8" stroke="#e5484d" strokeWidth="2.6" fill="none" />
      ) : (
        <>
          <path d="M21.5 12.5a5 5 0 0 1 0 7" stroke={OUTLINE} strokeWidth="2.4" fill="none" />
          {level === 2 && <path d="M25 9a10 10 0 0 1 0 14" stroke={OUTLINE} strokeWidth="2.4" fill="none" />}
        </>
      )}
    </Svg>
  )
}

// Seta saindo da caixa: abre o link em outra aba
export function ExternalIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M13 7H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6" fill="none" stroke={OUTLINE} strokeWidth="2.6" />
      <path d="M19 5h8v8M27 5L14 18" fill="none" stroke={OUTLINE} strokeWidth="5" />
      <path d="M19 5h8v8M27 5L14 18" fill="none" stroke="#fff0cc" strokeWidth="2.2" />
    </Svg>
  )
}

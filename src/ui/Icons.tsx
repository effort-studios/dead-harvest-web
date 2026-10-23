import type { CropId } from '@/features/farm/model/crops'
import type { FruitId } from '@/features/farm/model/trees'
import { OUTLINE, Svg, type IconProps } from '@/shared/ui/icons'

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

// Madrugada: lua fria, com estrelas
export function LateNightIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M19 5A11 11 0 1 0 27 21 9 9 0 0 1 19 5Z" fill="#cfe3ff" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="12" cy="19" r="1.6" fill="#a9c6ee" />
      <path d="M26 3.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#eef5ff" stroke={OUTLINE} strokeWidth="1" />
      <path d="M28 13l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="#eef5ff" stroke={OUTLINE} strokeWidth="0.9" />
    </Svg>
  )
}

// Amanhecer (subindo) e entardecer (descendo): meio sol no horizonte, com a seta da direção
export function SunriseIcon({ size }: IconProps) {
  return <HorizonSun size={size} rising />
}

export function SunsetIcon({ size }: IconProps) {
  return <HorizonSun size={size} rising={false} />
}

function HorizonSun({ size, rising }: IconProps & { rising: boolean }) {
  const sun = rising ? '#ffc24a' : '#ff8a3d'
  const ray = rising ? '#ffb52e' : '#f0662e'
  return (
    <Svg size={size}>
      {[-60, -30, 0, 30, 60].map((d) => (
        <rect key={d} x="14.6" y="5.5" width="2.8" height="4.6" rx="1.4" fill={ray} stroke={OUTLINE} strokeWidth="1.3" transform={`rotate(${d} 16 21)`} />
      ))}
      <path d="M7.5 21a8.5 8.5 0 0 1 17 0Z" fill={sun} stroke={OUTLINE} strokeWidth="2" />
      <path d="M3 21h26" stroke={OUTLINE} strokeWidth="2.4" />
      <path d={rising ? 'M12.5 28.5l3.5-3.5 3.5 3.5' : 'M12.5 25l3.5 3.5 3.5-3.5'} stroke={OUTLINE} strokeWidth="2.2" fill="none" />
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

// Terreno: um pedaço de terra arada visto de cima, com cerquinha e um broto
export function PlotIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M3 15l13 7 13-7v3.5l-13 7-13-7z" fill="#7a4416" stroke={OUTLINE} strokeWidth="1.8" />
      <path d="M16 8l13 7-13 7-13-7z" fill="#b5713c" stroke={OUTLINE} strokeWidth="2" />
      <path d="M9 12.2l13 7M12.5 10.3l13 7M5.5 14l13 7" stroke="#8a5428" strokeWidth="1.4" fill="none" />
      <path d="M3 15V10.5M9.5 11.5V7M16 8V3.5M22.5 11.5V7M29 15v-4.5" stroke={OUTLINE} strokeWidth="2.6" />
      <path d="M3 12l6.5-3.5L16 5l6.5 3.5L29 12" stroke="#c98a4a" strokeWidth="1.6" fill="none" />
      <path d="M16 16.5v-3.2" stroke="#3f7a2a" strokeWidth="1.6" />
      <path d="M16 14c-1.8-.2-3-1.2-3.2-2.6 1.8 0 3 .9 3.2 2.6zM16 13.6c1.6-.4 2.7-1.5 2.8-2.9-1.7.2-2.7 1.2-2.8 2.9z" fill="#6cc04a" stroke={OUTLINE} strokeWidth="1" />
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

export function CarrotIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M16 11c-2-4-5-6-8-6 1 4 4 6 8 6zM16 11c2-4 5-6 8-6-1 4-4 6-8 6zM16 11c0-3 0-5 0-7 1.6 2 1.6 4.6 0 7z" fill="#58b042" stroke={OUTLINE} strokeWidth="1.6" />
      <g transform="rotate(-28 16 18)">
        <path d="M10.6 11.5C13 10 19 10 21.4 11.5L17.6 29c-.5 1.6-2.7 1.6-3.2 0z" fill="#f4892a" stroke={OUTLINE} strokeWidth="2" />
        <path d="M12.4 15.5h3.2M16.4 19h3M13.6 22.5h2.6" stroke="#b85f12" strokeWidth="1.4" fill="none" />
      </g>
    </Svg>
  )
}

export function PotatoIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M6 18C5 11 11 7 18 8c7 1 10 6 8 12-2 6-8 8-13 7-4-.6-6.4-4-7-9z" fill="#d1a265" stroke={OUTLINE} strokeWidth="2" />
      <path d="M9 14c1.5-2.4 4-3.6 6.6-3.6" stroke="#f1d8aa" strokeWidth="2.2" fill="none" />
      <circle cx="12" cy="19" r="1.2" fill="#8a5f2c" />
      <circle cx="19.5" cy="15.5" r="1.2" fill="#8a5f2c" />
      <circle cx="20.5" cy="22" r="1.2" fill="#8a5f2c" />
    </Svg>
  )
}

export function StrawberryIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M16 8C8 8 4.5 14 8.6 21c2 3.4 4.6 7.5 7.4 7.5s5.4-4.1 7.4-7.5C27.5 14 24 8 16 8z" fill="#e5384a" stroke={OUTLINE} strokeWidth="2" />
      <path d="M12 15v.1M17 13.5v.1M21 17v.1M14.5 20v.1M19 22.5v.1M16 26v.1M10.5 19.5v.1" stroke="#ffe27a" strokeWidth="2" />
      <path d="M8.5 12.5c1.6-1.6 3.4-2.2 5.2-2.2" stroke="#ff9aa0" strokeWidth="2" fill="none" />
      <path d="M16 9.2l-3.6-3 1.2 3.6-4.2.2 3.6 2.4L16 12.4l3.4 0 3.6-2.4-4.2-.2 1.2-3.6z" fill="#58b042" stroke={OUTLINE} strokeWidth="1.6" />
    </Svg>
  )
}

export function WatermelonIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M3.5 12h25a12.5 12.5 0 0 1-25 0z" fill="#4aa844" stroke={OUTLINE} strokeWidth="2" />
      <path d="M6 12h20a10 10 0 0 1-20 0z" fill="#ee4a5a" />
      <path d="M5.4 14.5C6.5 20 11 23.5 16 23.5s9.5-3.5 10.6-9" stroke="#f6f0d4" strokeWidth="1.6" fill="none" />
      <path d="M11 15.5v.1M16 17v.1M21 15.5v.1M13.5 19.5v.1M18.5 19.5v.1" stroke={OUTLINE} strokeWidth="2" />
    </Svg>
  )
}

// Ícone da planta pelo id (usado nos slots da barra e na loja)
export function CropIcon({ crop, size }: { crop: CropId; size?: number }) {
  if (crop === 'corn') return <CornIcon size={size} />
  if (crop === 'tomato') return <TomatoIcon size={size} />
  if (crop === 'carrot') return <CarrotIcon size={size} />
  if (crop === 'potato') return <PotatoIcon size={size} />
  if (crop === 'strawberry') return <StrawberryIcon size={size} />
  if (crop === 'watermelon') return <WatermelonIcon size={size} />
  return <PumpkinIcon size={size} />
}

export function AppleIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M16 10c-3-2.6-10-1.6-10 6 0 6 4 12 7.5 12 1.2 0 1.8-.6 2.5-.6s1.3.6 2.5.6C22 28 26 22 26 16c0-7.6-7-8.6-10-6z" fill="#e5483b" stroke={OUTLINE} strokeWidth="2" />
      <path d="M9.5 14.5c1-2 2.6-3 4.5-3.2" stroke="#ff9f92" strokeWidth="2.2" fill="none" />
      <path d="M16 10c0-2.5.8-4.5 2.8-6" stroke={OUTLINE} strokeWidth="2.2" fill="none" />
      <path d="M17.5 8c1.5-2.5 4-3 6-2.5-1 2.5-3.5 3.5-6 2.5z" fill="#58b042" stroke={OUTLINE} strokeWidth="1.6" />
    </Svg>
  )
}

export function OrangeIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <circle cx="16" cy="18" r="11.5" fill="#f59a23" stroke={OUTLINE} strokeWidth="2" />
      <path d="M8.5 15.5a8.5 8.5 0 0 1 5-4.8" stroke="#ffd08a" strokeWidth="2.2" fill="none" />
      <circle cx="16" cy="7.2" r="1.4" fill="#c2600f" />
      <path d="M16.5 7c1.5-2.5 4-3 6-2.5-1 2.5-3.5 3.5-6 2.5z" fill="#58b042" stroke={OUTLINE} strokeWidth="1.6" />
    </Svg>
  )
}

export function LemonIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M3.5 17.5c0-1.8 1-2.8 2.4-3.2 1.6-6 7-8.6 12.5-7 5.2 1.5 8 6 6.6 11.5 1.2.6 1.8 1.6 1.6 2.8-.4 2.2-3 2.8-5 3.6C16 28.5 7 27.5 6 22c-1.5-1-2.5-2.5-2.5-4.5z" fill="#f2dc3a" stroke={OUTLINE} strokeWidth="2" />
      <path d="M8.5 14.5c1.5-2.5 4-4 7-4" stroke="#fff6a8" strokeWidth="2.2" fill="none" />
      <path d="M21 8.5c1.8-2.2 4-2.8 6-2.2-.8 2.6-3.2 3.8-6 2.2z" fill="#58b042" stroke={OUTLINE} strokeWidth="1.6" />
    </Svg>
  )
}

// Ícone da fruta pelo id (inventário e venda)
export function FruitIcon({ fruit, size }: { fruit: FruitId; size?: number }) {
  if (fruit === 'apple') return <AppleIcon size={size} />
  if (fruit === 'orange') return <OrangeIcon size={size} />
  return <LemonIcon size={size} />
}

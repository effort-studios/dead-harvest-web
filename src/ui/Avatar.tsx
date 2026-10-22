import type { ReactNode } from 'react'
import type { Avatar as AvatarData } from '../game/avatar'

// Avatar do jogador desenhado em SVG (desenhado numa caixa 32x32 e enquadrado em busto: cabeça, chapéu e ombros), no mesmo estilo dos ícones: contorno marrom
// grosso e cores chapadas. É montado em camadas: roupa, cabeça, cabelo, barba, rosto, bigode e chapéu.
const OUTLINE = '#4a2a12'
const HAIR = '#5a3a1f'

const SKIN: Record<AvatarData['skin'], string> = {
  porcelain: '#fbe3cf',
  light: '#f4c795',
  tan: '#dba46c',
  olive: '#c08a52',
  brown: '#8f5e38',
  dark: '#5c3a24',
}

const OUTFIT: Record<AvatarData['outfit'], { body: string; detail: string }> = {
  overalls_blue: { body: '#4f86c6', detail: '#2f5c96' },
  overalls_red: { body: '#d9483b', detail: '#a02a22' },
  shirt_green: { body: '#5fae4a', detail: '#3d7a30' },
  shirt_purple: { body: '#8a62c4', detail: '#5e3f94' },
  coat_brown: { body: '#8a5a35', detail: '#5a3a1f' },
  shirt_yellow: { body: '#f2c53d', detail: '#c9982a' },
}

function Outfit({ kind }: { kind: AvatarData['outfit'] }) {
  const { body, detail } = OUTFIT[kind]
  let extra: ReactNode
  if (kind.startsWith('overalls')) {
    extra = <path d="M12 22v4M20 22v4" stroke={detail} strokeWidth="2" fill="none" />
  } else if (kind === 'coat_brown') {
    extra = (
      <>
        <path d="M16 22v9" stroke="#f3e6c8" strokeWidth="3" />
        <path d="M16 23.5v.1M16 27v.1" stroke={detail} strokeWidth="1.6" />
      </>
    )
  } else if (kind === 'shirt_yellow') {
    extra = <path d="M8 26h16M7 29h18" stroke={detail} strokeWidth="1.6" fill="none" />
  } else {
    extra = <path d="M13.2 22l2.8 3 2.8-3" stroke={detail} strokeWidth="1.8" fill="none" /> // gola em V
  }
  return (
    <>
      <path d="M5 31c0-6.5 5-9.5 11-9.5s11 3 11 9.5z" fill={body} stroke={OUTLINE} strokeWidth="2" />
      {extra}
    </>
  )
}

function Hair() {
  return <path d="M9.2 15.6c0-5.2 2.8-8.2 6.8-8.2s6.8 3 6.8 8.2c-1.5-2.8-4-4-6.8-4s-5.3 1.2-6.8 4z" fill={HAIR} stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round" />
}

function Beard({ kind }: { kind: AvatarData['beard'] }) {
  if (kind === 'stubble') {
    return <path d="M9.4 18.2c.4 5.6 3 7.6 6.6 7.6s6.2-2 6.6-7.6c-1.6 2.4-3.8 3.6-6.6 3.6s-5-1.2-6.6-3.6z" fill={HAIR} opacity=".35" />
  }
  if (kind === 'goatee') return <ellipse cx="16" cy="22.6" rx="2.4" ry="2" fill={HAIR} stroke={OUTLINE} strokeWidth="1.2" />
  if (kind === 'full') {
    return <path d="M9.2 17.8c-.4 6.4 2.6 9 6.8 9s7.2-2.6 6.8-9c-1.2 2.6-3.2 3.6-6.8 3.6s-5.6-1-6.8-3.6z" fill={HAIR} stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round" />
  }
  return null // 'none' e 'mustache' (o bigode vem depois do rosto)
}

function Face({ kind, lightMouth }: { kind: AvatarData['face']; lightMouth: boolean }) {
  const mouth = lightMouth ? '#f3d9b8' : OUTLINE // sobre a barba cheia o traço da boca fica claro
  const eyeL = { cx: 13.2, cy: 17.2 }
  const eyeR = { cx: 18.8, cy: 17.2 }
  const dots = (r: number) => (
    <>
      <circle {...eyeL} r={r} fill={OUTLINE} />
      <circle {...eyeR} r={r} fill={OUTLINE} />
    </>
  )
  const smile = <path d="M13.6 20.2q2.4 1.8 4.8 0" stroke={mouth} strokeWidth="1.7" fill="none" strokeLinecap="round" />
  return (
    <>
      <circle cx="11.4" cy="19.4" r="1.3" fill="#ec8f7c" opacity=".75" />
      <circle cx="20.6" cy="19.4" r="1.3" fill="#ec8f7c" opacity=".75" />
      {kind === 'happy' && (
        <>
          {dots(1.25)}
          {smile}
        </>
      )}
      {kind === 'calm' && (
        <>
          {dots(1.25)}
          <path d="M14.4 20.5h3.2" stroke={mouth} strokeWidth="1.7" strokeLinecap="round" />
        </>
      )}
      {kind === 'wink' && (
        <>
          <circle {...eyeL} r="1.25" fill={OUTLINE} />
          <path d="M17.6 17.5q1.2-1.2 2.4 0" stroke={OUTLINE} strokeWidth="1.7" fill="none" strokeLinecap="round" />
          {smile}
        </>
      )}
      {kind === 'surprised' && (
        <>
          {dots(1.5)}
          <circle cx="16" cy="20.7" r="1.2" fill="none" stroke={mouth} strokeWidth="1.3" />
        </>
      )}
      {kind === 'sleepy' && (
        <>
          <path d="M12 17.4q1.2 1 2.4 0M17.6 17.4q1.2 1 2.4 0" stroke={OUTLINE} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M14.6 20.4q1.4 1 2.8 0" stroke={mouth} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

function Mustache() {
  return <path d="M12.4 19.6q1.7-1.6 3.6-.4 1.9-1.2 3.6.4-1.7 1.2-3.6.5-1.9.7-3.6-.5z" fill={HAIR} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
}

function Hat({ kind }: { kind: AvatarData['hat'] }) {
  switch (kind) {
    case 'straw':
      return (
        <>
          <path d="M9.6 12c0-6 3-8.6 6.4-8.6s6.4 2.6 6.4 8.6z" fill="#f0cd62" stroke={OUTLINE} strokeWidth="2" />
          <path d="M9.9 10.4h12.2" stroke="#d94b3a" strokeWidth="2.4" fill="none" />
          <ellipse cx="16" cy="12.4" rx="11.5" ry="3.2" fill="#f0cd62" stroke={OUTLINE} strokeWidth="2" />
        </>
      )
    case 'cap':
      return (
        <>
          <path d="M9.2 12.4c0-5.2 2.6-8 6.8-8s6.8 2.8 6.8 8z" fill="#d94b3a" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
          <path d="M16 4.6v7.8" stroke="#a02a22" strokeWidth="1.2" />
          <path d="M9 12.4h14.8c1.8 0 3 .8 3.2 2-2.4-.8-5.6-1.2-9-1.2H9z" fill="#b83a2e" stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round" />
        </>
      )
    case 'beanie':
      return (
        <>
          <path d="M9.2 12.4c0-5.2 2.6-8 6.8-8s6.8 2.8 6.8 8z" fill="#4a7fd0" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
          <rect x="8.6" y="10.6" width="14.8" height="3.4" rx="1.4" fill="#2f5c96" stroke={OUTLINE} strokeWidth="1.8" />
          <circle cx="16" cy="4.2" r="2.2" fill="#f6f1e6" stroke={OUTLINE} strokeWidth="1.6" />
        </>
      )
    case 'cowboy':
      return (
        <>
          <path d="M10.6 11.6c0-5 1.4-8 5.4-8s5.4 3 5.4 8z" fill="#a8723a" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
          <path d="M10.8 9.4h10.4" stroke="#6b4421" strokeWidth="2" />
          <path d="M2.8 11.2q4 2.4 13.2 2.4t13.2-2.4q.4 3.4-3.6 4.2-4.8 1-9.6 1t-9.6-1q-4-.8-3.6-4.2z" fill="#a8723a" stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round" />
        </>
      )
    case 'flower':
      return (
        <g transform="translate(22 10.6)">
          {[0, 72, 144, 216, 288].map((d) => (
            <circle key={d} cx={2.8 * Math.cos((d * Math.PI) / 180)} cy={2.8 * Math.sin((d * Math.PI) / 180)} r="2.2" fill="#ff8fb3" stroke={OUTLINE} strokeWidth="1" />
          ))}
          <circle r="1.6" fill="#ffd23f" stroke={OUTLINE} strokeWidth="1" />
        </g>
      )
    default:
      return null
  }
}

export function Avatar({ avatar, size = 32 }: { avatar: AvatarData; size?: number }) {
  return (
    <svg className="svg-icon" width={size} height={size} viewBox="2 2 28 28" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <Outfit kind={avatar.outfit} />
      <circle cx="16" cy="16.5" r="7" fill={SKIN[avatar.skin]} stroke={OUTLINE} strokeWidth="2" />
      {(avatar.hat === 'none' || avatar.hat === 'flower') && <Hair />}
      <Beard kind={avatar.beard} />
      <Face kind={avatar.face} lightMouth={avatar.beard === 'full'} />
      {avatar.beard === 'mustache' && <Mustache />}
      <Hat kind={avatar.hat} />
    </svg>
  )
}

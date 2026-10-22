import type { ReactNode } from 'react'
import type { Avatar as AvatarData } from '../game/avatar'

// Retrato do jogador em SVG (caixa 64x64): rosto grande com orelhas, sobrancelhas, olhos com íris e
// brilho, nariz, pescoço e ombros, com sombra e luz na pele. Mesmo estilo do jogo (contorno marrom
// escuro, cores chapadas), só que mais próximo e detalhado. Montado em camadas:
// roupa, pescoço, orelhas, cabeça, cabelo, barba, rosto, bigode e chapéu.
const OUTLINE = '#4a2a12'
const HAIR = '#4a2c17'
const HAIR_LIGHT = '#7a4a28'
const MOUTH = '#7a2e22'

type Tone = { base: string; shade: string; light: string }
const SKIN: Record<AvatarData['skin'], Tone> = {
  porcelain: { base: '#fbe3cf', shade: '#e8b99d', light: '#fff1e4' },
  light: { base: '#f4c795', shade: '#d99d6c', light: '#ffe0bd' },
  tan: { base: '#dba46c', shade: '#b97a45', light: '#efc28d' },
  olive: { base: '#c08a52', shade: '#9a6234', light: '#d5a671' },
  brown: { base: '#8f5e38', shade: '#6b3f22', light: '#a97650' },
  dark: { base: '#5c3a24', shade: '#3d2414', light: '#7a5236' },
}

const OUTFIT: Record<AvatarData['outfit'], { body: string; dark: string }> = {
  overalls_blue: { body: '#4f86c6', dark: '#2f5c96' },
  overalls_red: { body: '#d9483b', dark: '#a02a22' },
  shirt_green: { body: '#5fae4a', dark: '#3d7a30' },
  shirt_purple: { body: '#8a62c4', dark: '#5e3f94' },
  coat_brown: { body: '#8a5a35', dark: '#5a3a1f' },
  shirt_yellow: { body: '#f2c53d', dark: '#c9982a' },
}

const SHOULDERS = 'M2 64C3 55 11 51 22 49.5Q32 53.5 42 49.5C53 51 61 55 62 64Z'

// Roupa e pescoço ficam juntos porque a gola desenha por cima do pescoço
function Body({ outfit, tone }: { outfit: AvatarData['outfit']; tone: Tone }) {
  const { body, dark } = OUTFIT[outfit]
  const neck = (
    <>
      <path d="M25.5 40V51Q32 56 38.5 51V40Z" fill={tone.base} stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M26.6 40V47Q32 51 37.4 47V40Z" fill={tone.shade} opacity=".6" />
    </>
  )
  const base = <path d={SHOULDERS} fill={body} stroke={OUTLINE} strokeWidth="2.4" />

  let collar: ReactNode
  if (outfit.startsWith('overalls')) {
    collar = (
      <>
        <path d="M23 50Q32 56 41 50L41 64H23Z" fill="#f6ecd5" />
        <path d="M19.5 52.5L24 58M44.5 52.5L40 58" stroke={body} strokeWidth="5" />
        <path d="M19.5 52.5L24 58M44.5 52.5L40 58" stroke={OUTLINE} strokeWidth="1" opacity=".5" />
        <rect x="23" y="57" width="18" height="7" fill={body} stroke={OUTLINE} strokeWidth="1.8" />
        <path d="M26 60.5h12" stroke={dark} strokeWidth="1.4" strokeDasharray="2 1.6" />
        <circle cx="24.5" cy="58.5" r="1.5" fill="#f2cd62" stroke={OUTLINE} strokeWidth="1" />
        <circle cx="39.5" cy="58.5" r="1.5" fill="#f2cd62" stroke={OUTLINE} strokeWidth="1" />
      </>
    )
  } else if (outfit === 'shirt_purple') {
    collar = (
      <>
        <path d="M26 50.5L32 58L38 50.5Q32 54 26 50.5Z" fill={tone.base} stroke={OUTLINE} strokeWidth="1.8" />
        <path d="M24.5 50L32 59.5L39.5 50" stroke={dark} strokeWidth="2.4" fill="none" />
      </>
    )
  } else if (outfit === 'coat_brown') {
    collar = (
      <>
        <path d="M24 50Q32 56 40 50L36 64H28Z" fill="#f3e6c8" />
        <path d="M22 49.5L30 63L22 64L12 57Z M42 49.5L34 63L42 64L52 57Z" fill={dark} stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="32" cy="60" r="1.1" fill={OUTLINE} />
      </>
    )
  } else if (outfit === 'shirt_yellow') {
    collar = (
      <>
        <path d="M24 50Q32 57 40 50" stroke={dark} strokeWidth="3" fill="none" />
        <path d="M5 57.5Q32 62 59 57.5M3 62.5Q32 67 61 62.5" stroke={dark} strokeWidth="1.8" fill="none" />
      </>
    )
  } else {
    collar = <path d="M24 50Q32 57 40 50" stroke={dark} strokeWidth="3" fill="none" /> // gola redonda
  }
  return (
    <>
      {base}
      {neck}
      {collar}
    </>
  )
}

const HEAD = 'M16.5 27C16.5 13 23 8.5 32 8.5S47.5 13 47.5 27C47.5 39.5 41.5 47.5 32 47.5S16.5 39.5 16.5 27Z'

function Ears({ tone }: { tone: Tone }) {
  return (
    <>
      <ellipse cx="15.5" cy="30" rx="3.2" ry="4.6" fill={tone.base} stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="48.5" cy="30" rx="3.2" ry="4.6" fill={tone.base} stroke={OUTLINE} strokeWidth="2" />
      <path d="M15 28.5Q16.5 30 15 32.5M49 28.5Q47.5 30 49 32.5" stroke={tone.shade} strokeWidth="1.5" fill="none" />
    </>
  )
}

function Head({ tone, blush }: { tone: Tone; blush: number }) {
  return (
    <>
      <path d={HEAD} fill={tone.base} stroke={OUTLINE} strokeWidth="2.4" />
      {/* luz da esquerda, sombra à direita */}
      <path d="M47.5 27C47.5 39.5 41.5 47.5 32 47.5C38 46 43 40 43.5 30C43.5 22 41 15 36.5 10.5C43 11.5 47.5 17 47.5 27Z" fill={tone.shade} opacity=".5" />
      <ellipse cx="24.5" cy="36" rx="3.2" ry="2" fill={tone.light} opacity=".6" />
      <ellipse cx="32" cy="14" rx="7" ry="2.2" fill={tone.light} opacity=".45" />
      <circle cx="23.5" cy="37.5" r="2.8" fill="#ec8f7c" opacity={blush} />
      <circle cx="40.5" cy="37.5" r="2.8" fill="#ec8f7c" opacity={blush} />
    </>
  )
}

// Cabelo com volume, franja e uns fios soltos (aparece sem chapéu e com a flor)
function Hair() {
  return (
    <>
      <path d="M26 6L24 1.8L29.5 4.5Z M33.5 4.5L36.5 1L38.5 5.5Z" fill={HAIR} stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M15 27C12.5 12 21 4 32 4S51.5 12 49 27C48 22 46 18.5 42 16.5C38 21.5 26 21.5 22 16.5C18 18.5 16 22 15 27Z" fill={HAIR} stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M23 10Q28 6.5 34 7.5M37 8.5Q42.5 10 45 14.5M20.5 14Q22 11.5 24.5 10.5" stroke={HAIR_LIGHT} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M27 17.5L26.2 20.5M33 18.5L33 21.5M39 17.5L40 20.5" stroke={OUTLINE} strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
    </>
  )
}

function Beard({ kind }: { kind: AvatarData['beard'] }) {
  if (kind === 'stubble') {
    return <path d="M17.5 31C18 42 24 47 32 47S46 42 46.5 31C44 37 39 40.5 32 40.5S20 37 17.5 31Z" fill={HAIR} opacity=".32" />
  }
  if (kind === 'goatee') {
    return <path d="M28.5 44.5Q32 50 35.5 44.5Q35 42 32 42.3Q29 42 28.5 44.5Z" fill={HAIR} stroke={OUTLINE} strokeWidth="1.3" strokeLinejoin="round" />
  }
  if (kind === 'full') {
    return (
      <>
        <path d="M16.5 30C16 42 22 52 32 52S48 42 47.5 30C46 37 42 40 37 40.2Q32 38.5 27 40.2C22 40 18 37 16.5 30Z" fill={HAIR} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
        <path d="M22 44Q25 48 29 49.5M42 44Q39 48 35 49.5" stroke={HAIR_LIGHT} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </>
    )
  }
  return null // 'none' e 'mustache' (o bigode vem depois do rosto)
}

function Eye({ cx, tall = 2.9 }: { cx: number; tall?: number }) {
  return (
    <>
      <ellipse cx={cx} cy="29.5" rx="3.8" ry={tall} fill="#fff" stroke={OUTLINE} strokeWidth="1.5" />
      <circle cx={cx + 0.5} cy="29.7" r="2.3" fill="#5a3a22" />
      <circle cx={cx + 0.5} cy="29.7" r="1.2" fill={OUTLINE} />
      <circle cx={cx + 1.3} cy="28.8" r=".8" fill="#fff" />
    </>
  )
}

function Face({ kind, lightMouth, tone }: { kind: AvatarData['face']; lightMouth: boolean; tone: Tone }) {
  const mouth = lightMouth ? '#f3d9b8' : MOUTH
  const brow = (d: string) => <path d={d} stroke={HAIR} strokeWidth="2.4" fill="none" strokeLinecap="round" />
  const closedEye = (x: number) => <path d={`M${x - 3.8} 29.5Q${x} 32.5 ${x + 3.8} 29.5`} stroke={OUTLINE} strokeWidth="1.9" fill="none" strokeLinecap="round" />
  const smile = <path d="M27.5 40.2Q32 44 36.5 40.2" stroke={mouth} strokeWidth="1.9" fill="none" strokeLinecap="round" />
  return (
    <>
      {/* nariz */}
      <path d="M31 31.5Q29.8 35.5 31.2 37.2Q32 37.8 33.2 37.2" stroke={tone.shade} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {kind === 'happy' && (
        <>
          {brow('M21.5 24.5Q26 22 30.5 24M33.5 24Q38 22 42.5 24.5')}
          <Eye cx={26} />
          <Eye cx={38} />
          {smile}
        </>
      )}
      {kind === 'calm' && (
        <>
          {brow('M21.5 24Q26 23 30.5 24M33.5 24Q38 23 42.5 24')}
          <Eye cx={26} />
          <Eye cx={38} />
          <path d="M28.5 41H35.5" stroke={mouth} strokeWidth="1.9" strokeLinecap="round" />
        </>
      )}
      {kind === 'wink' && (
        <>
          {brow('M21.5 24.5Q26 22 30.5 24M33.5 22.5Q38 21.5 42.5 24')}
          <Eye cx={26} />
          {closedEye(38)}
          {smile}
        </>
      )}
      {kind === 'surprised' && (
        <>
          {brow('M21.5 22Q26 19.5 30.5 21.5M33.5 21.5Q38 19.5 42.5 22')}
          <Eye cx={26} tall={3.5} />
          <Eye cx={38} tall={3.5} />
          <ellipse cx="32" cy="41.5" rx="2" ry="2.6" fill={mouth} stroke={OUTLINE} strokeWidth="1.3" />
        </>
      )}
      {kind === 'sleepy' && (
        <>
          {brow('M21.5 25.5Q26 24.5 30.5 25.5M33.5 25.5Q38 24.5 42.5 25.5')}
          {closedEye(26)}
          {closedEye(38)}
          <path d="M29 41Q32 42.8 35 41" stroke={mouth} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

function Mustache() {
  return <path d="M25 38.5Q28.5 35.8 32 37.8Q35.5 35.8 39 38.5Q35.5 41 32 39.8Q28.5 41 25 38.5Z" fill={HAIR} stroke={OUTLINE} strokeWidth="1.3" strokeLinejoin="round" />
}

function Hat({ kind }: { kind: AvatarData['hat'] }) {
  switch (kind) {
    case 'straw':
      return (
        <>
          <path d="M18.5 18C18.5 7 25 3.5 32 3.5S45.5 7 45.5 18Z" fill="#f0cd62" stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M18.7 13.5H45.3L45.5 18H18.5Z" fill="#d94b3a" stroke={OUTLINE} strokeWidth="1.5" />
          <path d="M24 7.5Q28 5.5 32 5.5" stroke="#fff6c8" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity=".8" />
          <ellipse cx="32" cy="18.5" rx="27" ry="5.8" fill="#f0cd62" stroke={OUTLINE} strokeWidth="2.2" />
          <path d="M10 18.5Q20 22.5 32 22.8M54 18.5Q44 22.5 32 22.8M17 16.5Q32 20.5 47 16.5" stroke="#d1a93f" strokeWidth="1.3" fill="none" />
        </>
      )
    case 'cap':
      return (
        <>
          <path d="M17.5 20C17 8.5 24 4.5 32 4.5S47 8.5 46.5 20Z" fill="#d94b3a" stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M32 5V20M25 6.5Q24 13 24.5 20M39 6.5Q40 13 39.5 20" stroke="#a02a22" strokeWidth="1.4" fill="none" />
          <circle cx="32" cy="4.8" r="1.8" fill="#a02a22" stroke={OUTLINE} strokeWidth="1.2" />
          <path d="M14 20.5Q32 26.5 50 20.5Q50 24.5 32 25.5Q14 24.5 14 20.5Z" fill="#b83a2e" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
        </>
      )
    case 'beanie':
      return (
        <>
          <path d="M16.5 20C15.5 8 23 4 32 4S48.5 8 47.5 20Z" fill="#4a7fd0" stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M24 7Q23 13 24 17M32 5V16M40 7Q41 13 40 17" stroke="#3a64a8" strokeWidth="1.4" fill="none" />
          <rect x="14.5" y="15.5" width="35" height="7" rx="3" fill="#2f5c96" stroke={OUTLINE} strokeWidth="2" />
          <path d="M20 17V21M25 17V21M30 17V21M35 17V21M40 17V21M45 17V21" stroke="#4a7fd0" strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
          <circle cx="32" cy="3.5" r="4.2" fill="#f6f1e6" stroke={OUTLINE} strokeWidth="1.8" />
        </>
      )
    case 'cowboy':
      return (
        <>
          <path d="M20.5 17C19.5 7 23.5 2.5 32 2.5S44.5 7 43.5 17Z" fill="#a8723a" stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M25 4.5Q32 8.5 39 4.5" stroke="#6b4421" strokeWidth="1.6" fill="none" />
          <path d="M20.7 12.5H43.3L43.5 17H20.5Z" fill="#6b4421" stroke={OUTLINE} strokeWidth="1.4" />
          <circle cx="32" cy="14.7" r="1.3" fill="#f2cd62" stroke={OUTLINE} strokeWidth=".9" />
          <path d="M3 14.5Q8 24.5 32 23.5Q56 24.5 61 14.5Q55 20 32 19.5Q9 20 3 14.5Z" fill="#a8723a" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
        </>
      )
    case 'flower':
      return (
        <g transform="translate(44.5 13)">
          <path d="M-3 4Q-10 7 -12 2Q-6 0 -3 4Z" fill="#5fae4a" stroke={OUTLINE} strokeWidth="1.3" strokeLinejoin="round" />
          {[0, 72, 144, 216, 288].map((d) => (
            <ellipse key={d} cx="0" cy="-4.2" rx="2.8" ry="3.6" transform={`rotate(${d})`} fill="#ff8fb3" stroke={OUTLINE} strokeWidth="1.3" />
          ))}
          <circle r="2.4" fill="#ffd23f" stroke={OUTLINE} strokeWidth="1.2" />
        </g>
      )
    default:
      return null
  }
}

export function Avatar({ avatar, size = 64 }: { avatar: AvatarData; size?: number }) {
  const tone = SKIN[avatar.skin]
  return (
    <svg className="svg-icon" width={size} height={size} viewBox="0 0 64 64" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <Body outfit={avatar.outfit} tone={tone} />
      <Ears tone={tone} />
      <Head tone={tone} blush={avatar.skin === 'dark' || avatar.skin === 'brown' ? 0.22 : 0.45} />
      {(avatar.hat === 'none' || avatar.hat === 'flower') && <Hair />}
      <Beard kind={avatar.beard} />
      <Face kind={avatar.face} lightMouth={avatar.beard === 'full'} tone={tone} />
      {avatar.beard === 'mustache' && <Mustache />}
      <Hat kind={avatar.hat} />
    </svg>
  )
}

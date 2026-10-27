import { cropOfHarvest } from '@/features/farm/model/crops'
import { isFruitId } from '@/features/farm/model/trees'
import type { BuildingRef } from '@/features/farm/model/production'
import { OUTLINE, Svg, type IconProps } from '@/shared/ui/icons'
import { CropIcon, FruitIcon } from './icons'

// Ícones do armazém (colheitas, produtos dos animais e das máquinas), das máquinas, dos animais e do celeiro.
// Mesmo estilo dos outros ícones (caixa 32x32, contorno marrom, cores chapadas e um brilho). Os produtos usam
// poucos modelos (pote, garrafa, saco, prato...) pintados com a cor de cada um.

const SHINE = '#fff6e2'

function Jar({ size, color, lid = '#c9ced4' }: IconProps & { color: string; lid?: string }) {
  return (
    <Svg size={size}>
      <rect x="8" y="10" width="16" height="18" rx="4" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <rect x="7" y="5.5" width="18" height="6" rx="2" fill={lid} stroke={OUTLINE} strokeWidth="2" />
      <rect x="11" y="15" width="10" height="7" rx="1.5" fill="#fff3d6" stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M11 13v1" stroke={SHINE} strokeWidth="2" opacity="0.8" />
    </Svg>
  )
}

function Bottle({ size, color }: IconProps & { color: string }) {
  return (
    <Svg size={size}>
      <path d="M13 3.5h6v5c3 1.5 5 4 5 7.5v10a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 8 26V16c0-3.5 2-6 5-7.5z" fill="#e8f4f8" stroke={OUTLINE} strokeWidth="2" />
      <path d="M8.9 17h14.2v9a1.6 1.6 0 0 1-1.6 1.6h-11A1.6 1.6 0 0 1 8.9 26z" fill={color} />
      <rect x="12.5" y="2" width="7" height="3.5" rx="1" fill="#c98a4a" stroke={OUTLINE} strokeWidth="1.6" />
      <path d="M11 19v5" stroke={SHINE} strokeWidth="2" opacity="0.7" />
    </Svg>
  )
}

function Sack({ size, color, mark }: IconProps & { color: string; mark: string }) {
  return (
    <Svg size={size}>
      <path d="M9 11c-4 5-4 12 0 16 4 2 10 2 14 0 4-4 4-11 0-16z" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <path d="M10 11l-1.5-5 4 2 3.5-3.5 3.5 3.5 4-2L22 11z" fill={color} stroke={OUTLINE} strokeWidth="1.8" />
      <path d="M9.5 11.5h13" stroke="#8f5a2a" strokeWidth="2.2" />
      <circle cx="16" cy="20" r="4.2" fill={mark} stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M10.5 15.5c.5-1.4 1.4-2.4 2.6-3" stroke={SHINE} strokeWidth="1.8" fill="none" opacity="0.7" />
    </Svg>
  )
}

function Egg({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M16 4c-6 0-10 9-10 15a10 10 0 0 0 20 0C26 13 22 4 16 4z" fill="#fff6e2" stroke={OUTLINE} strokeWidth="2" />
      <path d="M11 13c1-3 2.6-5 4.4-5.6" stroke="#ffffff" strokeWidth="2.2" fill="none" />
      <path d="M20 24c2-1 3-3 3.2-5" stroke="#e8d6b4" strokeWidth="2" fill="none" />
    </Svg>
  )
}

function Ball({ size, color, line }: IconProps & { color: string; line: string }) {
  return (
    <Svg size={size}>
      <circle cx="16" cy="17" r="11" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <path d="M7 13c5 1 12 6 14 14M9.5 9.5c6 1 13 6 15.5 13M14 6.5c5 2 10 6 12.5 11" stroke={line} strokeWidth="1.6" fill="none" />
      <path d="M26 24c2 1 3 3 3 5" stroke={line} strokeWidth="1.8" fill="none" />
    </Svg>
  )
}

function Wool({ size }: IconProps) {
  return (
    <Svg size={size}>
      {[[10, 18, 6], [16, 13, 7], [22, 18, 6], [16, 21, 7], [11, 12, 4.5], [21, 11.5, 4.5]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#fbf6ea" stroke={OUTLINE} strokeWidth="1.6" />
      ))}
      <path d="M13 11.5c.8-1.4 2-2.2 3.4-2.4" stroke="#ffffff" strokeWidth="1.8" fill="none" />
    </Svg>
  )
}

// Montinho de esterco, com uma mosquinha
function Manure({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M5 26c0-3 2-4.5 4.5-4.8C9 17 12 15 15 15.4c.3-3.4 3-5.6 6-4.6-1 1.6-.6 3.4 1 4.2 3 1.2 4 4 3 6.2 2.4.6 3.6 2.4 3.4 4.8z" fill="#7a4a24" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 22c3-.8 7-.6 10 .4M14.5 17.5c2-.6 4-.3 5.6.5" stroke="#5a3214" strokeWidth="1.4" fill="none" />
      <path d="M12 20.5c1-1 2.4-1.4 3.6-1.2" stroke="#a87346" strokeWidth="1.6" fill="none" />
      <ellipse cx="24" cy="7" rx="2.4" ry="1.6" fill="#cfe3ff" stroke={OUTLINE} strokeWidth="1" />
      <circle cx="22" cy="8.4" r="1.3" fill={OUTLINE} />
    </Svg>
  )
}

function Chips({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M8 6h16l-1.5 3 1.5 3v14l-1.5 3H9.5L8 26V12l1.5-3z" fill="#e5483b" stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="16" cy="18" rx="5.5" ry="4" fill="#ffd23f" stroke={OUTLINE} strokeWidth="1.5" />
      <path d="M13.5 17.5c1-.8 3-.8 4.5.3" stroke="#e0a312" strokeWidth="1.2" fill="none" />
      <path d="M11 9h10" stroke={SHINE} strokeWidth="1.6" opacity="0.7" />
    </Svg>
  )
}

function Butter({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M4 21l9-5 15 5-9 5z" fill="#c9ced4" stroke={OUTLINE} strokeWidth="1.8" />
      <path d="M7 19.5v-5l8-4 10 3.5v5l-8 4z" fill="#ffe27a" stroke={OUTLINE} strokeWidth="2" />
      <path d="M7 14.5l10 3.5 8-4M17 18v5" stroke={OUTLINE} strokeWidth="1.6" fill="none" />
      <path d="M10 14l6-3" stroke={SHINE} strokeWidth="1.8" />
    </Svg>
  )
}

function Cheese({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M3.5 21L20 8l8.5 7v8.5L3.5 27z" fill="#ffd23f" stroke={OUTLINE} strokeWidth="2" />
      <path d="M3.5 21l25-6" stroke={OUTLINE} strokeWidth="1.6" />
      <circle cx="13" cy="22.5" r="1.8" fill="#e0a312" />
      <circle cx="22" cy="21.5" r="1.4" fill="#e0a312" />
      <circle cx="18" cy="15" r="1.4" fill="#e0a312" />
    </Svg>
  )
}

function Plate({ size, children }: IconProps & { children: React.ReactNode }) {
  return (
    <Svg size={size}>
      <ellipse cx="16" cy="23" rx="14" ry="5.5" fill="#f4f6f8" stroke={OUTLINE} strokeWidth="2" />
      {children}
    </Svg>
  )
}

function CornCake({ size }: IconProps) {
  return (
    <Plate size={size}>
      <path d="M5 13v7c0 3 5 5 11 5s11-2 11-5v-7z" fill="#f2b54a" stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="16" cy="13" rx="11" ry="5" fill="#ffd36e" stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="16" cy="13" rx="3" ry="1.4" fill="#c97a1a" stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M9 12c1-1.4 3-2.2 4.6-2.4" stroke={SHINE} strokeWidth="1.6" fill="none" />
    </Plate>
  )
}

function ApplePie({ size }: IconProps) {
  return (
    <Plate size={size}>
      <path d="M4.5 16v3c0 3 5 5.5 11.5 5.5S27.5 22 27.5 19v-3z" fill="#c98a4a" stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="16" cy="16" rx="11.5" ry="5.5" fill="#e5a95c" stroke={OUTLINE} strokeWidth="2" />
      <path d="M8 14l12 5M12 12l12 5M20 12L9 17.5M25 14l-11 6" stroke="#a8682c" strokeWidth="1.6" />
      <circle cx="16" cy="11" r="2" fill="#e5483b" stroke={OUTLINE} strokeWidth="1.2" />
    </Plate>
  )
}

function Polenta({ size }: IconProps) {
  return (
    <Plate size={size}>
      <path d="M8 14l7-3 8 3-7 3z" fill="#ffd23f" stroke={OUTLINE} strokeWidth="1.6" />
      <path d="M8 14v4l8 3v-4zM16 17v4l7-3v-4z" fill="#e0a312" stroke={OUTLINE} strokeWidth="1.6" />
      <path d="M9.5 18.5c2 2 6 3 10 1.5 2-.8 4-.6 5 .6-3 3-11 3.4-15-2.1z" fill="#d9433a" stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M12 13l3-1.3 3.5 1.3-3 1.3z" fill="#fff3a6" />
    </Plate>
  )
}

function Cone({ size, scoop }: IconProps & { scoop: string }) {
  return (
    <Svg size={size}>
      <path d="M9 15l7 15 7-15z" fill="#e3a85a" stroke={OUTLINE} strokeWidth="2" />
      <path d="M11 18l8 4M13 15.5l7.5 3.5M12.5 21l4-6M15 26l5.5-10" stroke="#b5762e" strokeWidth="1.3" />
      <circle cx="16" cy="11" r="7.5" fill={scoop} stroke={OUTLINE} strokeWidth="2" />
      <path d="M11.5 9c.8-2 2.4-3 4-3.2" stroke={SHINE} strokeWidth="2" fill="none" />
      <circle cx="16" cy="3.4" r="2" fill="#e5384a" stroke={OUTLINE} strokeWidth="1.3" />
    </Svg>
  )
}

function Cup({ size, scoop }: IconProps & { scoop: string }) {
  return (
    <Svg size={size}>
      <path d="M7 16h18l-2.5 12h-13z" fill="#7fd3c3" stroke={OUTLINE} strokeWidth="2" />
      <path d="M9 20h14" stroke="#3f9e8e" strokeWidth="1.6" />
      <path d="M7 16c0-6 4-10 9-10s9 4 9 10z" fill={scoop} stroke={OUTLINE} strokeWidth="2" />
      <path d="M11 12v.1M16 10v.1M20.5 12.5v.1" stroke={OUTLINE} strokeWidth="2" />
      <path d="M10.5 10.5c.8-1.6 2.2-2.6 3.8-3" stroke={SHINE} strokeWidth="1.8" fill="none" />
    </Svg>
  )
}

// Produto -> desenho. Item sem desenho próprio cai no pote marrom.
const PRODUCT_ICON: Record<string, (p: IconProps) => React.JSX.Element> = {
  egg: Egg,
  milk: (p) => <Bottle {...p} color="#fbfbf6" />,
  wool: Wool,
  manure: Manure,
  feed: (p) => <Sack {...p} color="#cfa96c" mark="#e3b34a" />,
  fertilizer: (p) => <Sack {...p} color="#8a5a32" mark="#6cc04a" />,
  cornmeal: (p) => <Sack {...p} color="#ead0a0" mark="#ffd23f" />,
  apple_juice: (p) => <Bottle {...p} color="#f2b23a" />,
  orange_juice: (p) => <Bottle {...p} color="#f58a1f" />,
  lemonade: (p) => <Bottle {...p} color="#f7ea7a" />,
  tomato_sauce: (p) => <Jar {...p} color="#d9433a" />,
  pickled_carrot: (p) => <Jar {...p} color="#f4892a" lid="#6cc04a" />,
  strawberry_jam: (p) => <Jar {...p} color="#c9203c" lid="#f7b3c8" />,
  pumpkin_sweet: (p) => <Jar {...p} color="#f08a24" lid="#c98a4a" />,
  potato_chips: Chips,
  butter: Butter,
  cheese: Cheese,
  yarn: (p) => <Ball {...p} color="#b476d6" line="#7d4aa0" />,
  corn_cake: CornCake,
  apple_pie: ApplePie,
  strawberry_ice_cream: (p) => <Cone {...p} scoop="#f7a6bf" />,
  watermelon_sorbet: (p) => <Cup {...p} scoop="#ee4a5a" />,
  polenta: Polenta,
}

// Ícone de qualquer item do armazém pelo id
export function ItemIcon({ itemId, size }: { itemId: string; size?: number }) {
  const crop = cropOfHarvest(itemId)
  if (crop) return <CropIcon crop={crop} size={size} />
  if (isFruitId(itemId)) return <FruitIcon fruit={itemId} size={size} />
  const draw = PRODUCT_ICON[itemId]
  return draw ? draw({ size }) : <Jar size={size} color="#a8682c" />
}

// ---------- Máquinas, celeiro e animais ----------

// Casinha com o telhado na cor da máquina e o produto principal na frente
const MACHINE_LOOK: Record<string, { roof: string; item: string }> = {
  juicer: { roof: '#f08a24', item: 'orange_juice' },
  feed_mill: { roof: '#b4753f', item: 'feed' },
  mill: { roof: '#6e4d3c', item: 'cornmeal' },
  cannery: { roof: '#c4402f', item: 'tomato_sauce' },
  fryer: { roof: '#cc6e38', item: 'potato_chips' },
  composter: { roof: '#51ae4a', item: 'fertilizer' },
  dairy: { roof: '#5b8fd6', item: 'cheese' },
  candy: { roof: '#e47fa0', item: 'strawberry_jam' },
  loom: { roof: '#b476d6', item: 'yarn' },
  oven: { roof: '#bb6a40', item: 'corn_cake' },
  ice_cream: { roof: '#7fd3c3', item: 'strawberry_ice_cream' },
  kitchen: { roof: '#8a2619', item: 'polenta' },
}

export function MachineIcon({ machineId, size = 24 }: { machineId: string; size?: number }) {
  const look = MACHINE_LOOK[machineId] ?? { roof: '#b4753f', item: 'feed' }
  return (
    <span className="machine-icon" style={{ width: size, height: size }}>
      <Svg size={size}>
        <path d="M5 14h22v14H5z" fill="#efd3a0" stroke={OUTLINE} strokeWidth="2" />
        <path d="M2.5 15L16 4l13.5 11z" fill={look.roof} stroke={OUTLINE} strokeWidth="2" />
        <path d="M8 12.5l8-6.5" stroke={SHINE} strokeWidth="1.6" opacity="0.6" />
      </Svg>
      <span className="machine-icon-item">
        <ItemIcon itemId={look.item} size={Math.round(size * 0.55)} />
      </span>
    </span>
  )
}

export function BarnIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M4 14l12-9 12 9v14H4z" fill="#c4402f" stroke={OUTLINE} strokeWidth="2" />
      <path d="M2.5 15L16 4.5 29.5 15" stroke="#4a3227" strokeWidth="3" fill="none" />
      <rect x="11" y="17" width="10" height="11" fill="#8a2619" stroke={OUTLINE} strokeWidth="1.6" />
      <path d="M11 17l10 11M21 17L11 28" stroke="#fff6e2" strokeWidth="1.8" />
      <rect x="13.5" y="9.5" width="5" height="4" fill="#e3b34a" stroke={OUTLINE} strokeWidth="1.4" />
    </Svg>
  )
}

export function WellIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M8 9V27M24 9V27" stroke="#7e4a27" strokeWidth="2.6" />
      <path d="M3.5 11L16 3l12.5 8" fill="#6e4d3c" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 8v8" stroke="#c9a66b" strokeWidth="1.4" />
      <rect x="13" y="15" width="6" height="5" rx="1" fill="#aeb5bd" stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M5 21h22v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="#aaa498" stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="16" cy="21" rx="11" ry="2.6" fill="#2f5f86" stroke={OUTLINE} strokeWidth="1.6" />
      <path d="M9 25h4M17 26h5" stroke="#7c776d" strokeWidth="1.3" />
    </Svg>
  )
}

// Regador verde com o bico para a direita
export function CanIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M21 15l7-6 1.5 1.5-6.5 8" fill="#51ae4a" stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M27.5 7.5l3 3" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M6 13h16v13a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="#6cc04a" stroke={OUTLINE} strokeWidth="2" />
      <path d="M9 13c0-5 10-5 10 0" stroke={OUTLINE} strokeWidth="2.2" fill="none" />
      <path d="M9 17v8" stroke={SHINE} strokeWidth="2" opacity="0.7" />
    </Svg>
  )
}

// Ícone de qualquer prédio (máquina, celeiro ou poço)
export function BuildingIcon({ target, size }: { target: BuildingRef; size?: number }) {
  if (target.kind === 'barn') return <BarnIcon size={size} />
  if (target.kind === 'well') return <WellIcon size={size} />
  return <MachineIcon machineId={target.id} size={size} />
}

function Chicken({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M22 13l6-5-1 9z" fill="#efe0c0" stroke={OUTLINE} strokeWidth="1.6" />
      <ellipse cx="17" cy="19" rx="10" ry="8" fill="#fffaf0" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="10" cy="11" r="5" fill="#fffaf0" stroke={OUTLINE} strokeWidth="2" />
      <path d="M8 6.5l1.5-3 1.5 2 1.5-2 .5 3.5z" fill="#e5483b" stroke={OUTLINE} strokeWidth="1.2" />
      <path d="M5.5 11.5L2.5 12.5l3 1.5z" fill="#f7b928" stroke={OUTLINE} strokeWidth="1.2" />
      <circle cx="9" cy="10.5" r="1" fill={OUTLINE} />
      <path d="M14 27v3M19 27v3" stroke="#e3a12a" strokeWidth="2" />
    </Svg>
  )
}

function Cow({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M8 22v6M13 22v6M21 22v6M26 22v6" stroke={OUTLINE} strokeWidth="2.6" />
      <ellipse cx="18" cy="17" rx="11" ry="7.5" fill="#fffaf0" stroke={OUTLINE} strokeWidth="2" />
      <path d="M15 12c3 0 4 3 2 5s-5 1-5-1 1-4 3-4zM23 16c2 0 2.5 2.5 1 3.5s-3 0-3-1.2 1-2.3 2-2.3z" fill="#3a2a22" />
      <rect x="2.5" y="9" width="10" height="11" rx="4" fill="#fffaf0" stroke={OUTLINE} strokeWidth="2" />
      <path d="M3.5 9.5l-1-4 3 3M11.5 9.5l1-4-3 3" fill="#c9b48c" stroke={OUTLINE} strokeWidth="1.3" />
      <ellipse cx="7.5" cy="18" rx="5" ry="3" fill="#f2a6a6" stroke={OUTLINE} strokeWidth="1.5" />
      <circle cx="5.5" cy="13" r="1" fill={OUTLINE} />
      <circle cx="9.5" cy="13" r="1" fill={OUTLINE} />
    </Svg>
  )
}

function Sheep({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M11 23v6M16 23v6M21 23v6M25 22v6" stroke="#3a3a3a" strokeWidth="2.6" />
      {[[12, 17, 6], [18, 13, 6.5], [24, 17, 5.5], [18, 20, 6.5], [24, 12, 4]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#fbf6ea" stroke={OUTLINE} strokeWidth="1.6" />
      ))}
      <ellipse cx="7" cy="15" rx="4.5" ry="5.5" fill="#3f3f3f" stroke={OUTLINE} strokeWidth="1.8" />
      <path d="M3.5 12.5l-2-1.5M10 12l2-1.8" stroke="#3f3f3f" strokeWidth="2.4" />
      <circle cx="5.5" cy="14.5" r="1" fill="#ffffff" />
    </Svg>
  )
}

const ANIMAL_ICON: Record<string, (p: IconProps) => React.JSX.Element> = { chicken: Chicken, cow: Cow, sheep: Sheep }

export function AnimalIcon({ animalId, size }: { animalId: string; size?: number }) {
  return (ANIMAL_ICON[animalId] ?? Chicken)({ size })
}

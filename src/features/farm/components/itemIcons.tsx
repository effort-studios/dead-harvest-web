import { cropOfHarvest } from '@/features/farm/model/crops'
import { isFruitId } from '@/features/farm/model/trees'
import type { BuildingRef } from '@/features/farm/model/production'
import { PixelIcon, type IconProps } from '@/shared/ui/icons'
import { CropIcon, FruitIcon } from './icons'

// Ícones do armazém (colheitas, produtos dos animais e das máquinas), das máquinas, dos animais e do celeiro.
// Os itens têm ícone próprio em pixel art (public/assets/icons/<id>.png); prédios e animais usam o próprio
// sprite do mapa (public/assets/world), reduzido.

const ITEM_ICONS = new Set([
  'egg', 'milk', 'wool', 'feed', 'fertilizer', 'apple_juice', 'orange_juice', 'lemonade', 'cornmeal', 'tomato_sauce',
  'pickled_carrot', 'potato_chips', 'butter', 'cheese', 'strawberry_jam', 'pumpkin_sweet', 'yarn', 'corn_cake',
  'apple_pie', 'strawberry_ice_cream', 'watermelon_sorbet', 'polenta',
])

// Ícone de qualquer item do armazém pelo id
export function ItemIcon({ itemId, size }: { itemId: string; size?: number }) {
  const crop = cropOfHarvest(itemId)
  if (crop) return <CropIcon crop={crop} size={size} />
  if (isFruitId(itemId)) return <FruitIcon fruit={itemId} size={size} />
  return <PixelIcon name={ITEM_ICONS.has(itemId) ? itemId : 'feed'} size={size} />
}

// Sprite do mapa como ícone
const WorldIcon = ({ name, size }: { name: string; size?: number }) => (
  <PixelIcon name={name} src={`/assets/world/${name}.png`} size={size} />
)

export const MachineIcon = ({ machineId, size = 24 }: { machineId: string; size?: number }) => <WorldIcon name={machineId} size={size} />
export const BarnIcon = ({ size }: IconProps) => <WorldIcon name="barn" size={size} />
export const WellIcon = ({ size }: IconProps) => <WorldIcon name="well" size={size} />
export const CanIcon = ({ size }: IconProps) => <PixelIcon name="can" size={size} />

// Ícone de qualquer prédio (máquina, celeiro ou poço)
export function BuildingIcon({ target, size }: { target: BuildingRef; size?: number }) {
  if (target.kind === 'barn') return <BarnIcon size={size} />
  if (target.kind === 'well') return <WellIcon size={size} />
  return <MachineIcon machineId={target.id} size={size} />
}

export const AnimalIcon = ({ animalId, size }: { animalId: string; size?: number }) => <WorldIcon name={animalId} size={size} />

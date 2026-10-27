import type { CropId } from '@/features/farm/model/crops'
import type { FruitId } from '@/features/farm/model/trees'
import { PixelIcon, type IconProps } from '@/shared/ui/icons'

// Ícones do relógio, do menu lateral, das plantas e das frutas: pixel art (public/assets/icons)

export const SunIcon = ({ size }: IconProps) => <PixelIcon name="sun" size={size} />
export const MoonIcon = ({ size }: IconProps) => <PixelIcon name="moon" size={size} />
export const LateNightIcon = ({ size }: IconProps) => <PixelIcon name="late_night" size={size} />
export const SunriseIcon = ({ size }: IconProps) => <PixelIcon name="sunrise" size={size} />
export const SunsetIcon = ({ size }: IconProps) => <PixelIcon name="sunset" size={size} />
export const ShopIcon = ({ size }: IconProps) => <PixelIcon name="shop" size={size} />
export const BulbIcon = ({ size }: IconProps) => <PixelIcon name="bulb" size={size} />
export const PlotIcon = ({ size }: IconProps) => <PixelIcon name="plot" size={size} />

// Ícone da planta pelo id (usado nos slots da barra e na loja): o da colheita dela
export const CropIcon = ({ crop, size }: { crop: CropId; size?: number }) => <PixelIcon name={`${crop}_harvest`} size={size} />

// Ícone da fruta pelo id (inventário e venda)
export const FruitIcon = ({ fruit, size }: { fruit: FruitId; size?: number }) => <PixelIcon name={fruit} size={size} />

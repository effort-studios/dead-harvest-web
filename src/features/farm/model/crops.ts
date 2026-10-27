// Tipos de planta. Os ids são os que o front sabe desenhar; nome, tempo e preços são regras do jogo e
// vêm da API (GET /game/catalog) ao abrir o jogo, em setCrops. Os tempos são em segundos.
export const CROP_IDS = ['corn', 'tomato', 'pumpkin', 'carrot', 'potato', 'strawberry', 'watermelon'] as const
export type CropId = (typeof CROP_IDS)[number]

export type CropInfo = {
  name: string
  growSeconds: number // até ficar madura
  seedPrice: number // custo da semente na loja
  sellPrice: number // preço da colheita no armazém
  harvestItemId: string // item que a colheita dá (vai para o armazém)
}

export const CROPS = {} as Record<CropId, CropInfo>

// Ordem na barra de itens e na loja (a do catálogo)
export const CROP_ORDER: CropId[] = []

export type CatalogCrop = { id: string; name: string; growSeconds: number; harvestItemId: string; harvestPrice: number; seedPrice: number }

// Preenche CROPS e CROP_ORDER com o catálogo do servidor (planta sem desenho no front fica de fora)
export function setCrops(list: CatalogCrop[]) {
  CROP_ORDER.length = 0
  for (const c of list) {
    if (!(CROP_IDS as readonly string[]).includes(c.id)) continue
    const id = c.id as CropId
    CROPS[id] = { name: c.name, growSeconds: c.growSeconds, seedPrice: c.seedPrice, sellPrice: c.harvestPrice, harvestItemId: c.harvestItemId }
    CROP_ORDER.push(id)
  }
}

export function isCropId(value: string | null): value is CropId {
  return value !== null && value in CROPS
}

// Planta de um item de colheita ("corn_harvest" -> "corn"), se for um
export function cropOfHarvest(itemId: string): CropId | null {
  return CROP_ORDER.find((id) => CROPS[id].harvestItemId === itemId) ?? null
}

// 90 -> "1min30s", 180 -> "3min", 45 -> "45s", 3600 -> "1h", 5400 -> "1h30min"
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  if (h > 0) {
    const rest = seconds % 3600
    return rest === 0 ? `${h}h` : `${h}h${formatDuration(rest)}`
  }
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return s === 0 ? `${m}min` : `${m}min${s}s`
}

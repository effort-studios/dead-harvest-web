// Tipos de planta. Os tempos são em ticks (1 tick = 1 segundo).
export type CropId = 'corn' | 'tomato' | 'pumpkin'

export type CropInfo = {
  name: string
  growTicks: number // ticks até ficar madura
  seedPrice: number // custo da semente na loja (item 5)
  sellPrice: number // dinheiro ao colher
}

export const CROPS: Record<CropId, CropInfo> = {
  tomato: { name: 'Tomate', growTicks: 10, seedPrice: 3, sellPrice: 6 },
  corn: { name: 'Milho', growTicks: 20, seedPrice: 5, sellPrice: 12 },
  pumpkin: { name: 'Abóbora', growTicks: 40, seedPrice: 10, sellPrice: 30 },
}

// Ordem em que aparecem na barra de itens (teclas 1, 2, 3)
export const CROP_ORDER: CropId[] = ['corn', 'tomato', 'pumpkin']

export function isCropId(value: string | null): value is CropId {
  return value !== null && value in CROPS
}

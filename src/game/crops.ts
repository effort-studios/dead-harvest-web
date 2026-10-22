// Tipos de planta. Os tempos são em ticks (1 tick = 1 segundo).
export type CropId = 'corn' | 'tomato' | 'pumpkin' | 'carrot' | 'potato' | 'strawberry' | 'watermelon'

export type CropInfo = {
  name: string
  growTicks: number // ticks até ficar madura
  seedPrice: number // custo da semente na loja (item 5)
  sellPrice: number // dinheiro ao colher
}

// Tempos longos de propósito: dá tempo de fazer outras coisas em vez de ficar só plantando e colhendo.
// Quanto mais demora, mais compensa (preço de venda sobe mais rápido que o de semente).
export const CROPS: Record<CropId, CropInfo> = {
  tomato: { name: 'Tomate', growTicks: 90, seedPrice: 4, sellPrice: 9 },
  carrot: { name: 'Cenoura', growTicks: 120, seedPrice: 5, sellPrice: 12 },
  corn: { name: 'Milho', growTicks: 180, seedPrice: 7, sellPrice: 18 },
  potato: { name: 'Batata', growTicks: 240, seedPrice: 9, sellPrice: 24 },
  strawberry: { name: 'Morango', growTicks: 300, seedPrice: 12, sellPrice: 34 },
  pumpkin: { name: 'Abóbora', growTicks: 480, seedPrice: 18, sellPrice: 58 },
  watermelon: { name: 'Melancia', growTicks: 720, seedPrice: 28, sellPrice: 100 },
}

// Ordem na barra de itens (teclas 1 a 7) e na loja
export const CROP_ORDER: CropId[] = ['corn', 'tomato', 'pumpkin', 'carrot', 'potato', 'strawberry', 'watermelon']

export function isCropId(value: string | null): value is CropId {
  return value !== null && value in CROPS
}

// 90 -> "1min30s", 180 -> "3min", 45 -> "45s"
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return s === 0 ? `${m}min` : `${m}min${s}s`
}

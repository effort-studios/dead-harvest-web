// Árvores frutíferas do cenário: dá para colher as frutas, que voltam depois de 1 hora.
export type FruitId = 'apple' | 'orange' | 'lemon'

export type FruitInfo = {
  name: string
  sellPrice: number // por fruta
  color: string // cor das frutas desenhadas na copa
}

export const FRUITS: Record<FruitId, FruitInfo> = {
  apple: { name: 'Maçã', sellPrice: 6, color: '#e5483b' },
  orange: { name: 'Laranja', sellPrice: 8, color: '#f59a23' },
  lemon: { name: 'Limão', sellPrice: 7, color: '#f2dc3a' },
}

export const FRUIT_ORDER: FruitId[] = ['apple', 'orange', 'lemon']

export function isFruitId(value: string): value is FruitId {
  return value in FRUITS
}

export const FRUITS_PER_HARVEST = 3
export const FRUIT_REGROW_MS = 60 * 60 * 1000 // 1 hora

export type TreeInfo = { id: string; r: number; c: number; fruit: FruitId }

// Posição (linha, coluna, fora da plantação) e fruta de cada árvore. O id vai para o save: não renomeie.
export const TREES: TreeInfo[] = [
  { id: 't1', r: -5, c: 2, fruit: 'apple' },
  { id: 't2', r: -4, c: 11, fruit: 'orange' },
  { id: 't3', r: 13, c: 3, fruit: 'lemon' },
  { id: 't4', r: 12, c: 13, fruit: 'apple' },
  { id: 't5', r: 8, c: -4, fruit: 'orange' },
  { id: 't6', r: 2, c: 15, fruit: 'lemon' },
]

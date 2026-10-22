// Árvores frutíferas do cenário: dá para colher as frutas, que voltam depois de um tempo.
// Posição, frutas por colheita, tempo de rebrota e preço vêm da API (GET /game/catalog), em setTrees;
// aqui só fica o que é desenho (a cor das frutas).
export const FRUIT_IDS = ['apple', 'orange', 'lemon'] as const
export type FruitId = (typeof FRUIT_IDS)[number]

const FRUIT_COLOR: Record<FruitId, string> = { apple: '#e5483b', orange: '#f59a23', lemon: '#f2dc3a' }

export type FruitInfo = {
  name: string
  sellPrice: number // por fruta
  color: string // cor das frutas desenhadas na copa
}

export const FRUITS = {} as Record<FruitId, FruitInfo>
export const FRUIT_ORDER: FruitId[] = []

export type TreeInfo = { id: string; r: number; c: number; fruit: FruitId; fruitsPerHarvest: number; regrowMs: number }
export const TREES: TreeInfo[] = []

export type CatalogFruit = { id: string; name: string; sellPrice: number }
export type CatalogTree = { id: string; fruitId: string; row: number; col: number; fruitsPerHarvest: number; regrowSeconds: number }

export function isFruitId(value: string): value is FruitId {
  return value in FRUITS
}

// Preenche FRUITS, FRUIT_ORDER e TREES com o catálogo do servidor (fruta sem desenho no front fica de fora)
export function setTrees(fruits: CatalogFruit[], trees: CatalogTree[]) {
  FRUIT_ORDER.length = 0
  for (const f of fruits) {
    if (!(FRUIT_IDS as readonly string[]).includes(f.id)) continue
    const id = f.id as FruitId
    FRUITS[id] = { name: f.name, sellPrice: f.sellPrice, color: FRUIT_COLOR[id] }
    FRUIT_ORDER.push(id)
  }
  TREES.length = 0
  for (const t of trees) {
    if (!isFruitId(t.fruitId)) continue
    TREES.push({ id: t.id, r: t.row, c: t.col, fruit: t.fruitId, fruitsPerHarvest: t.fruitsPerHarvest, regrowMs: t.regrowSeconds * 1000 })
  }
}

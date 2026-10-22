// Estes tipos precisam ser iguais ao formato do save da API (veja README da dead-harvest-api)
export type Tile = {
  state: 'soil' | 'tilled' | 'planted'
  crop: string | null
  growth: number
}

// Terreno 10x10; (x, y) é a posição na malha de terrenos (o inicial é 0,0)
export type Plot = {
  x: number
  y: number
  grid: Tile[][]
}

export type SaveData = {
  day: number
  money: number
  plots: Plot[]
  inventory: Record<string, number>
}

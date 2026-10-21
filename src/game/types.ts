// Estes tipos precisam ser iguais ao formato do save da API (veja README da dead-harvest-api)
export type Tile = {
  state: 'soil' | 'tilled' | 'planted'
  crop: string | null
  growth: number
}

export type SaveData = {
  day: number
  money: number
  grid: Tile[][]
  inventory: Record<string, number>
}

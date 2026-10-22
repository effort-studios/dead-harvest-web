// Estes tipos precisam ser iguais ao formato do save da API (veja README da dead-harvest-api)
export type Tile = {
  state: 'soil' | 'tilled' | 'planted'
  crop: string | null
  growth: number
}

export type SaveData = {
  day: number
  time: number // ticks (segundos) desde o amanhecer; veja game/daycycle.ts
  money: number
  grid: Tile[][]
  inventory: Record<string, number> // sementes e frutas colhidas
  trees?: Record<string, number> // id da árvore -> ms (Date.now) da última coleta de frutas
}

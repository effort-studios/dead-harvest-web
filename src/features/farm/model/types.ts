// Estes tipos precisam ser iguais ao estado que a API devolve (GET /game/state e as ações; veja o
// README da dead-harvest-api). Quem decide o estado é o servidor; o front só mostra e prevê.
export type Tile = {
  state: 'soil' | 'tilled' | 'planted'
  crop: string | null
  growth: number // segundos desde o plantio
}

// Terreno 10x10; (x, y) é a posição na malha de terrenos (o inicial é 0,0)
export type Plot = {
  x: number
  y: number
  grid: Tile[][]
}

export type SaveData = {
  serverTime: number // ms no relógio do servidor quando o estado foi montado
  day: number
  time: number // segundos desde o início do dia; veja game/daycycle.ts
  money: number
  plots: Plot[]
  inventory: Record<string, number> // sementes e frutas colhidas
  trees: Record<string, number> // id da árvore -> ms (relógio do servidor) da última coleta de frutas
}

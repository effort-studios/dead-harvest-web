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

// Tarefa do fazendeiro na fila do servidor. Só a primeira (em andamento) tem horários (ms, relógio do servidor).
export type FarmJob = {
  id: string
  action: 'till' | 'plant' | 'harvest' | 'harvest_tree'
  plotX: number | null
  plotY: number | null
  row: number | null
  col: number | null
  treeId: string | null
  targetRow: number // célula do mapa onde ele precisa estar
  targetCol: number
  startsAt?: number // começa a andar
  arriveAt?: number // chega e começa o gesto
  endsAt?: number // termina o gesto (a ação acontece no servidor nesse instante)
}

// Onde o fazendeiro está parado antes de começar jobs[0], e a fila
export type FarmerState = { row: number; col: number; jobs: FarmJob[] }

export type SaveData = {
  serverTime: number // ms no relógio do servidor quando o estado foi montado
  day: number
  time: number // segundos desde o início do dia; veja game/daycycle.ts
  money: number
  plots: Plot[]
  inventory: Record<string, number> // sementes e frutas colhidas
  trees: Record<string, number> // id da árvore -> ms (relógio do servidor) da última coleta de frutas
  farmer: FarmerState // onde o fazendeiro está e a fila de tarefas dele (o servidor é quem anda)
}

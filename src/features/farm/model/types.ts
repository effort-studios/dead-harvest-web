// Estes tipos precisam ser iguais ao estado que a API devolve (GET /game/state e as ações; veja o
// README da dead-harvest-api). Quem decide o estado é o servidor; o front só mostra e prevê.
export type Tile = {
  state: 'soil' | 'tilled' | 'planted'
  crop: string | null
  growth: number // segundos de crescimento (com adubo e água, conta mais de 1 por segundo: production.growthRate)
  fertilized: boolean // adubado (some na colheita)
  watered: boolean // regado (some na colheita)
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
  action: 'till' | 'untill' | 'move' | 'plant' | 'harvest' | 'harvest_tree' | 'fertilize' | 'water' | 'collect_machine' | 'collect_barn' | 'refill_can'
  plotX: number | null
  plotY: number | null
  row: number | null
  col: number | null
  treeId: string | null
  machineId: string | null
  targetRow: number // célula do mapa onde ele precisa estar
  targetCol: number
  startsAt?: number // começa a andar
  arriveAt?: number // chega e começa o gesto
  endsAt?: number // termina o gesto (a ação acontece no servidor nesse instante)
}

// Onde o fazendeiro está parado antes de começar jobs[0], e a fila
export type FarmerState = { row: number; col: number; jobs: FarmJob[] }

// Receita na fila de uma máquina: horários (ms, relógio do servidor) em que começa e fica pronta
export type MachineJob = { id: string; recipeId: string; startsAt: number; readyAt: number }
export type MachineState = { row: number; col: number; jobs: MachineJob[] } // onde o jogador deixou e a fila

// Animal no celeiro: fedAt = ms em que comeu (produz depois do tempo do animal); null = com fome, parado
export type OwnedAnimal = { id: string; animalId: string; fedAt: number | null }
// row/col = onde está (nulos = ainda sem celeiro); capacity 0 = ainda sem celeiro
export type BarnState = { row: number | null; col: number | null; capacity: number; animals: OwnedAnimal[] }

export type SaveData = {
  serverTime: number // ms no relógio do servidor quando o estado foi montado
  day: number
  time: number // segundos desde o início do dia; veja game/daycycle.ts
  money: number
  plots: Plot[]
  inventory: Record<string, number> // armazém: sementes, frutas, colheitas, produtos (id do item -> quantidade)
  trees: Record<string, number> // id da árvore -> ms (relógio do servidor) da última coleta de frutas
  machines: Record<string, MachineState> // só as máquinas compradas
  barn: BarnState
  canCharges: number | null // cargas do regador; null = não comprou
  well: { row: number; col: number } | null // onde está o poço; null = não construiu
  farmer: FarmerState // onde o fazendeiro está e a fila de tarefas dele (o servidor é quem anda)
}

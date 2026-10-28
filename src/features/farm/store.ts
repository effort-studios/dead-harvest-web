import { create } from 'zustand'
import * as api from '@/features/farm/api'
import { ApiError } from '@/shared/api/http'
import { isCropId, setCrops, type CropId } from '@/features/farm/model/crops'
import { setDayLength } from '@/features/farm/model/daycycle'
import * as production from '@/features/farm/model/production'
import {
  buyPlot,
  buySeed,
  harvestables,
  pickItem,
  placementProblem,
  readyTreeIds,
  sellItem,
  setPlotPrice,
  tick,
  tileCommand,
  type ClickMode,
  type TileAction,
  type TileCommand,
  type HotbarItem,
} from '@/features/farm/model/state'
import { setTrees } from '@/features/farm/model/trees'
import type { SaveData } from '@/features/farm/model/types'

// Prédio aberto no painel da direita (clicado no mapa ou aberto pela loja)
export type OpenBuilding = production.BuildingRef | null

// O servidor é a fonte da verdade. Toda ação do jogador vai para a API, que valida e devolve o estado
// novo; enquanto a resposta não chega, a tela mostra uma previsão (model/state.ts) para responder na hora.
// Quem está logado e a tela exibida são da sessão (app/session.ts); aqui só vive o jogo.

type FarmState = {
  active: boolean // true = o jogo está carregado e aceita ações
  error: string | null // motivo de uma ação recusada ou de falha de conexão (some sozinho)
  data: SaveData | null
  readyTrees: string // ids das árvores com frutas, em texto; muda quando alguma árvore repõe ou é colhida (redesenha o mapa)
  readyBuildings: string // máquinas e celeiro com algo pronto (production.readyKey); muda = redesenha os balões
  selected: HotbarItem // semente (ou adubo) escolhida na barra de itens (só da tela)
  buyingPlot: boolean // true = o mapa mostra as posições livres para o jogador escolher
  building: OpenBuilding
  placing: production.BuildingRef | null // prédio escolhido na loja: a prévia segue o mouse até o clique no mapa
  start: () => Promise<void>
  reset: () => void
  flush: () => Promise<void>
  sync: () => Promise<void>
  queueTiles: (plot: number, row: number, col: number, mode: ClickMode) => void // pede ao servidor: o fazendeiro vai até lá e age
  queueTileAction: (plot: number, row: number, col: number, action: TileAction, crop?: CropId) => void // item do menu do tile
  moveTo: (row: number, col: number) => void // o fazendeiro só anda até a célula
  queueTree: (treeId: string) => void
  harvestAll: () => void // pede a colheita de tudo que está pronto (plantas e árvores)
  cancelQueue: () => void
  select: (item: HotbarItem) => void
  tick: () => void
  buySeed: (crop: CropId, qty?: number) => void
  sellItem: (itemId: string, qty?: number) => void
  setBuyingPlot: (on: boolean) => void
  buyPlot: (x: number, y: number) => void
  openBuilding: (building: OpenBuilding) => void
  startPlacing: (building: production.BuildingRef | null) => void // null cancela
  placeBuilding: (r: number, c: number) => void // clicou no mapa: constrói ali (se pode)
  startRecipe: (recipeId: string) => void
  collectMachine: (machineId: string) => void // o fazendeiro vai até a máquina e pega o que ficou pronto
  expandBarn: () => void
  buyAnimal: (animalId: string) => void
  feedAnimals: () => void
  collectBarn: () => void
  buyCan: () => void
  refillCan: () => void // o fazendeiro vai até o poço e enche o regador
  moveBuilding: (building: production.BuildingRef, r: number, c: number) => void // soltou o prédio arrastado ali
}

export const useFarmStore = create<FarmState>((set, get) => ({
  active: false,
  error: null,
  data: null,
  readyTrees: '',
  readyBuildings: '',
  selected: 'corn',
  buyingPlot: false,
  building: null,
  placing: null,

  // Carrega as regras (catálogo) e o estado do jogador logado; lança o erro da API se falhar
  start: async () => {
    const [catalog, data] = await Promise.all([api.fetchCatalog(), api.loadState()])
    setCrops(catalog.crops)
    setTrees(catalog.fruits, catalog.trees)
    production.setProduction(catalog)
    setPlotPrice(catalog.plotPrice)
    setDayLength(catalog.dayLengthSeconds)
    set({ active: true, error: null, buyingPlot: false, building: null, placing: null, selected: 'corn' })
    applyServerState(data)
  },

  // Sai do jogo (logout ou sessão que caiu): some com o estado do jogador
  reset: () => {
    clearTimeout(farmerTimer)
    set({ active: false, data: null, error: null, buyingPlot: false, building: null, placing: null })
  },

  // Espera as ações que estão a caminho chegarem ao servidor (antes de sair)
  flush: () => queue,

  // Busca o estado no servidor (de tempos em tempos e ao voltar para a aba): acerta o relógio e mostra
  // o que mudou em outro aparelho. Com ação a caminho, espera ela, que já traz o estado.
  sync: async () => {
    if (pending > 0 || !get().active) return
    try {
      const data = await api.loadState()
      if (pending === 0) applyServerState(data)
    } catch (err) {
      handleFailure(err)
    }
  },

  // O front só pede; quem enfileira, anda e age é o servidor (e continua com o jogo fechado)
  queueTiles: (plot, row, col, mode) => {
    const { data, selected } = get()
    const cmd = data && tileCommand(data, plot, row, col, mode, selected)
    if (data && cmd) sendTiles(data, cmd, isCropId(selected) ? selected : undefined)
  },

  queueTileAction: (plot, row, col, action, crop) => {
    const { data } = get()
    if (data) sendTiles(data, { action, plot, tiles: [{ row, col }] }, crop)
  },

  moveTo: (row, col) => run(undefined, () => api.enqueueJob({ action: 'move', row, col })),

  queueTree: (treeId) => run(undefined, () => api.enqueueJob({ action: 'harvest_tree', treeId })),

  harvestAll: () => {
    const { data } = get()
    if (!data) return
    const { plots, trees } = harvestables(data, serverNow())
    // a API aceita até 10 tiles por tarefa
    for (const cmd of plots) {
      for (let i = 0; i < cmd.tiles.length; i += 10) sendTiles(data, { ...cmd, tiles: cmd.tiles.slice(i, i + 10) })
    }
    trees.forEach((id) => get().queueTree(id))
  },

  cancelQueue: () => run(undefined, api.cancelJobs),

  select: (item) => set({ selected: item }),

  // 1 segundo na tela: o relógio e as plantas andam até o próximo estado do servidor
  tick: () =>
    set((s) => {
      if (!s.data) return s
      // as frutas e as máquinas ficam prontas com o tempo real; readyTrees/readyBuildings só mudam (e
      // redesenham o mapa) quando algo mudou
      const now = serverNow()
      return { data: tick(s.data), readyTrees: readyTreeIds(s.data, now).join(), readyBuildings: production.readyKey(s.data, now) }
    }),

  buySeed: (crop, qty = 1) => run((d) => buySeed(d, crop, qty), () => api.buySeed(crop, qty)),

  sellItem: (itemId, qty) => run((d) => sellItem(d, itemId, qty), () => api.sellItem(itemId, qty)),

  setBuyingPlot: (on) => set({ buyingPlot: on, placing: null }),

  buyPlot: (x, y) => {
    set({ buyingPlot: false })
    run((d) => buyPlot(d, x, y), () => api.buyPlot(x, y))
  },

  openBuilding: (building) => set({ building }),

  startPlacing: (building) => set({ placing: building, buyingPlot: false, building: null }),

  placeBuilding: (r, c) => {
    const { data, placing } = get()
    if (!data || !placing) return
    const problem = placementProblem(data, placing, r, c)
    if (problem) return showError(problem) // continua escolhendo
    set({ placing: null })
    if (placing.kind === 'barn') run((d) => production.buyBarn(d, r, c), () => api.buyBarn(r, c))
    else if (placing.kind === 'well') run((d) => production.buyWell(d, r, c), () => api.buyWell(r, c))
    else run((d) => production.buyMachine(d, placing.id, r, c), () => api.buyMachine(placing.id, r, c))
  },

  startRecipe: (recipeId) => run((d) => production.startRecipe(d, recipeId, serverNow()), () => api.startRecipe(recipeId)),

  collectMachine: (machineId) => run(undefined, () => api.enqueueJob({ action: 'collect_machine', machineId })),

  expandBarn: () => run(production.expandBarn, api.expandBarn),

  buyAnimal: (animalId) => run((d) => production.buyAnimal(d, animalId, serverNow()), () => api.buyAnimal(animalId)),

  feedAnimals: () => run((d) => production.feedAnimals(d, serverNow()), api.feedAnimals),

  collectBarn: () => run(undefined, () => api.enqueueJob({ action: 'collect_barn' })),

  buyCan: () => run(production.buyCan, api.buyCan),

  refillCan: () => run(undefined, () => api.enqueueJob({ action: 'refill_can' })),

  moveBuilding: (building, r, c) => {
    const { data } = get()
    if (!data) return
    const at = production.buildingPos(data, building)
    if (!at || (at.r === r && at.c === c)) return
    const problem = placementProblem(data, building, r, c)
    if (problem) return showError(problem)
    run((d) => production.moveBuilding(d, building, r, c), () => api.moveBuilding(building, r, c))
  },
}))

// Quem cuida da sessão (app/session.ts) avisa aqui o que fazer quando o servidor responde 401
let onUnauthorized: (() => void) | undefined
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

// Pede ao servidor as tarefas de tile: o fazendeiro vai até lá e age. Confere antes o que a tela já sabe
// (semente, adubo e carga do regador) para não encher a fila de pedidos que o servidor recusaria.
function sendTiles(data: SaveData, cmd: TileCommand, crop?: CropId) {
  if (cmd.tiles.length === 0) return
  const input = { x: data.plots[cmd.plot].x, y: data.plots[cmd.plot].y, tiles: cmd.tiles }
  if (cmd.action === 'plant') {
    if (!crop) return
    const seeds = data.inventory[crop] ?? 0
    if (seeds < 1) return
    run(undefined, () => api.enqueueJob({ ...input, action: 'plant', cropId: crop, tiles: input.tiles.slice(0, seeds) }))
  } else if (cmd.action === 'fertilize') {
    const have = data.inventory[production.FERTILIZER.itemId] ?? 0
    if (have < 1) return
    run(undefined, () => api.enqueueJob({ ...input, action: 'fertilize', tiles: input.tiles.slice(0, have) }))
  } else if (cmd.action === 'water') {
    const charges = data.canCharges ?? 0
    if (charges < 1) return showError('O regador está vazio: encha no poço')
    run(undefined, () => api.enqueueJob({ ...input, action: 'water', tiles: input.tiles.slice(0, charges) }))
  } else {
    run(undefined, () => api.enqueueJob({ ...input, action: cmd.action as 'till' | 'untill' | 'harvest' }))
  }
}

// ---------- Conversa com o servidor ----------

let clockOffset = 0 // relógio do servidor - relógio deste aparelho (ms)
export const serverNow = () => Date.now() + clockOffset

// As ações vão para o servidor uma de cada vez, na ordem dos cliques
let queue: Promise<void> = Promise.resolve()
let pending = 0 // ações na fila (ainda sem resposta)
let latest: SaveData | null = null // último estado que o servidor mandou nesta leva de ações
let errorTimer: ReturnType<typeof setTimeout> | undefined

// O estado do servidor substitui o que está na tela (previsão incluída)
function applyServerState(data: SaveData) {
  clockOffset = data.serverTime - Date.now()
  scheduleFarmerSync(data)
  useFarmStore.setState((s) => ({
    data,
    selected: pickItem(data, s.selected), // a semente pode ter acabado
    readyTrees: readyTreeIds(data, serverNow()).join(),
    readyBuildings: production.readyKey(data, serverNow()),
  }))
}

// Quando o fazendeiro termina a tarefa da frente, a ação acontece no servidor: busca o estado nesse
// instante (um pouco depois) para o mapa mostrar o resultado e a próxima tarefa começar na tela.
let farmerTimer: ReturnType<typeof setTimeout> | undefined
function scheduleFarmerSync(data: SaveData) {
  clearTimeout(farmerTimer)
  const endsAt = data.farmer.jobs[0]?.endsAt
  if (endsAt === undefined) return
  farmerTimer = setTimeout(() => void useFarmStore.getState().sync(), Math.max(endsAt - serverNow() + 80, 250))
}

function showError(message: string) {
  clearTimeout(errorTimer)
  useFarmStore.setState({ error: message })
  errorTimer = setTimeout(() => useFarmStore.setState({ error: null }), 4000)
}

// 401 = a sessão expirou (ou caiu em outro lugar): a sessão volta para a tela de login
function handleFailure(err: unknown) {
  if (err instanceof ApiError && err.status === 401) {
    onUnauthorized?.()
  } else {
    showError(err instanceof ApiError ? err.message : 'Sem conexão com o servidor')
  }
}

// Ação do jogador: mostra a previsão na hora e põe o pedido na fila. Quando a fila esvazia, a tela
// fica com o último estado que o servidor devolveu. Se o servidor recusa a ação (ex.: a planta ainda
// não amadureceu lá), mostra o motivo e busca o estado de verdade.
function run(predict: ((data: SaveData) => SaveData) | undefined, send: () => Promise<SaveData>) {
  const { data, active } = useFarmStore.getState()
  if (!data || !active) return
  if (predict) {
    const predicted = predict(data)
    if (predicted === data) return // nem a previsão muda nada (sem dinheiro, sem semente...): não pede
    useFarmStore.setState((s) => ({
      data: predicted,
      selected: pickItem(predicted, s.selected),
      readyTrees: readyTreeIds(predicted, serverNow()).join(),
      readyBuildings: production.readyKey(predicted, serverNow()),
    }))
  }

  pending++
  queue = queue.then(async () => {
    try {
      latest = await send()
    } catch (err) {
      handleFailure(err)
      latest = await api.loadState().catch(() => latest) // sem conexão: o sync periódico acerta depois
    }
    pending--
    if (pending === 0 && latest && useFarmStore.getState().active) applyServerState(latest)
    if (pending === 0) latest = null
  })
}

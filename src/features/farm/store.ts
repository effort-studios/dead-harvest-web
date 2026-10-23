import { create } from 'zustand'
import * as api from '@/features/farm/api'
import { ApiError } from '@/shared/api/http'
import { setCrops, type CropId } from '@/features/farm/model/crops'
import { setDayLength } from '@/features/farm/model/daycycle'
import {
  buyPlot,
  buySeed,
  pickSeed,
  readyTreeIds,
  sellFruit,
  setPlotPrice,
  tick,
  tileCommand,
  type ClickMode,
} from '@/features/farm/model/state'
import { setTrees, type FruitId } from '@/features/farm/model/trees'
import type { SaveData } from '@/features/farm/model/types'

// O servidor é a fonte da verdade. Toda ação do jogador vai para a API, que valida e devolve o estado
// novo; enquanto a resposta não chega, a tela mostra uma previsão (model/state.ts) para responder na hora.
// Quem está logado e a tela exibida são da sessão (app/session.ts); aqui só vive o jogo.

type FarmState = {
  active: boolean // true = o jogo está carregado e aceita ações
  error: string | null // motivo de uma ação recusada ou de falha de conexão (some sozinho)
  data: SaveData | null
  readyTrees: string // ids das árvores com frutas, em texto; muda quando alguma árvore repõe ou é colhida (redesenha o mapa)
  selectedSeed: CropId // semente escolhida na barra de itens (só da tela)
  buyingPlot: boolean // true = o mapa mostra as posições livres para o jogador escolher
  start: () => Promise<void>
  reset: () => void
  flush: () => Promise<void>
  sync: () => Promise<void>
  queueTiles: (plot: number, row: number, col: number, mode: ClickMode) => void // pede ao servidor: o fazendeiro vai até lá e age
  queueTree: (treeId: string) => void
  cancelQueue: () => void
  selectSeed: (crop: CropId) => void
  tick: () => void
  buySeed: (crop: CropId, qty?: number) => void
  sellFruit: (fruit: FruitId, qty?: number) => void
  setBuyingPlot: (on: boolean) => void
  buyPlot: (x: number, y: number) => void
}

export const useFarmStore = create<FarmState>((set, get) => ({
  active: false,
  error: null,
  data: null,
  readyTrees: '',
  selectedSeed: 'corn',
  buyingPlot: false,

  // Carrega as regras (catálogo) e o estado do jogador logado; lança o erro da API se falhar
  start: async () => {
    const [catalog, data] = await Promise.all([api.fetchCatalog(), api.loadState()])
    setCrops(catalog.crops)
    setTrees(catalog.fruits, catalog.trees)
    setPlotPrice(catalog.plotPrice)
    setDayLength(catalog.dayLengthSeconds)
    set({ active: true, error: null, buyingPlot: false, selectedSeed: 'corn' })
    applyServerState(data)
  },

  // Sai do jogo (logout ou sessão que caiu): some com o estado do jogador
  reset: () => {
    clearTimeout(farmerTimer)
    set({ active: false, data: null, error: null, buyingPlot: false })
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
    const { data, selectedSeed } = get()
    const cmd = data && tileCommand(data, plot, row, col, mode)
    if (!data || !cmd || cmd.tiles.length === 0) return
    const input = { x: data.plots[plot].x, y: data.plots[plot].y, tiles: cmd.tiles }
    if (cmd.action === 'plant') {
      const seeds = data.inventory[selectedSeed] ?? 0
      if (seeds < 1) return
      run(undefined, () => api.enqueueJob({ ...input, action: 'plant', cropId: selectedSeed, tiles: input.tiles.slice(0, seeds) }))
    } else {
      run(undefined, () => api.enqueueJob({ ...input, action: cmd.action as 'till' | 'harvest' }))
    }
  },

  queueTree: (treeId) => run(undefined, () => api.enqueueJob({ action: 'harvest_tree', treeId })),

  cancelQueue: () => run(undefined, api.cancelJobs),

  selectSeed: (crop) => set({ selectedSeed: crop }),

  // 1 segundo na tela: o relógio e as plantas andam até o próximo estado do servidor
  tick: () =>
    set((s) => {
      if (!s.data) return s
      // as frutas voltam com o tempo real; readyTrees só muda (e redesenha) se alguma árvore mudou
      const readyTrees = readyTreeIds(s.data, serverNow()).join()
      return { data: tick(s.data), readyTrees }
    }),

  buySeed: (crop, qty = 1) => run((d) => buySeed(d, crop, qty), () => api.buySeed(crop, qty)),

  sellFruit: (fruit, qty) => run((d) => sellFruit(d, fruit, qty), () => api.sellFruit(fruit, qty)),

  setBuyingPlot: (on) => set({ buyingPlot: on }),

  buyPlot: (x, y) => {
    set({ buyingPlot: false })
    run((d) => buyPlot(d, x, y), () => api.buyPlot(x, y))
  },
}))

// Quem cuida da sessão (app/session.ts) avisa aqui o que fazer quando o servidor responde 401
let onUnauthorized: (() => void) | undefined
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
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
    selectedSeed: pickSeed(data.inventory, s.selectedSeed), // a semente pode ter acabado
    readyTrees: readyTreeIds(data, serverNow()).join(),
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
      selectedSeed: pickSeed(predicted.inventory, s.selectedSeed),
      readyTrees: readyTreeIds(predicted, serverNow()).join(),
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

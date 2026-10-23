import { create } from 'zustand'
import * as api from '../api/client'
import { ApiError } from '@/shared/api/http'
import { updateProfile } from '@/features/profile/api'
import type { User } from '@/features/profile/model/user'
import type { Avatar } from '@/features/profile/model/avatar'
import { setCrops, type CropId } from '../game/crops'
import { setDayLength } from '../game/daycycle'
import {
  applyTileCommand,
  buyPlot,
  buySeed,
  harvestTree,
  pickSeed,
  readyTreeIds,
  sellFruit,
  setPlotPrice,
  tick,
  tileCommand,
  type ClickMode,
} from '../game/state'
import { setTrees, type FruitId } from '../game/trees'
import type { SaveData } from '../game/types'

// O servidor é a fonte da verdade. Toda ação do jogador vai para a API, que valida e devolve o estado
// novo; enquanto a resposta não chega, a tela mostra uma previsão (game/state.ts) para responder na hora.

type GameState = {
  // anonymous = ninguém logado (mostra a tela de login)
  status: 'loading' | 'anonymous' | 'ready' | 'error'
  error: string | null // erro ao abrir o jogo, ou o motivo de uma ação recusada (some sozinho)
  user: User | null
  data: SaveData | null
  readyTrees: string // ids das árvores com frutas, em texto; muda quando alguma árvore repõe ou é colhida (redesenha o mapa)
  selectedSeed: CropId // semente escolhida na barra de itens (só da tela)
  buyingPlot: boolean // true = o mapa mostra as posições livres para o jogador escolher
  init: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (input: { displayName?: string; avatar?: Avatar }) => Promise<void>
  sync: () => Promise<void>
  clickTile: (plot: number, row: number, col: number, mode: ClickMode) => void
  selectSeed: (crop: CropId) => void
  tick: () => void
  buySeed: (crop: CropId, qty?: number) => void
  sellFruit: (fruit: FruitId, qty?: number) => void
  harvestTree: (treeId: string) => void
  setBuyingPlot: (on: boolean) => void
  buyPlot: (x: number, y: number) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'loading',
  error: null,
  user: null,
  data: null,
  readyTrees: '',
  selectedSeed: 'corn',
  buyingPlot: false,

  // Ao abrir o jogo: se já há sessão (cookie), carrega o jogo; senão, mostra a tela de login
  init: async () => {
    try {
      const user = await api.fetchMe()
      if (!user) return set({ status: 'anonymous', user: null, data: null })
      await startGame(user)
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : 'Erro desconhecido' })
    }
  },

  // login e register lançam o erro da API (mensagem pronta) para a tela de login mostrar
  login: async (email, password) => startGame(await api.login({ email, password })),

  register: async (email, password, displayName) => startGame(await api.register({ email, password, displayName })),

  // lança o erro da API (mensagem pronta) para o editor de perfil mostrar
  updateProfile: async (input) => set({ user: await updateProfile(input) }),

  logout: async () => {
    await queue // deixa as ações que estão a caminho chegarem ao servidor
    await api.logout().catch(() => undefined)
    set({ status: 'anonymous', user: null, data: null, error: null, buyingPlot: false })
  },

  // Busca o estado no servidor (de tempos em tempos e ao voltar para a aba): acerta o relógio e mostra
  // o que mudou em outro aparelho. Com ação a caminho, espera ela, que já traz o estado.
  sync: async () => {
    if (pending > 0 || get().status !== 'ready') return
    try {
      const data = await api.loadState()
      if (pending === 0) applyServerState(data)
    } catch (err) {
      handleFailure(err)
    }
  },

  clickTile: (plot, row, col, mode) => {
    const { data, selectedSeed } = get()
    const cmd = data && tileCommand(data, plot, row, col, mode)
    if (!data || !cmd || cmd.tiles.length === 0) return
    const input = { x: data.plots[plot].x, y: data.plots[plot].y, tiles: cmd.tiles }
    run(
      (d) => applyTileCommand(d, cmd, selectedSeed),
      () => (cmd.action === 'till' ? api.till(input) : cmd.action === 'plant' ? api.plant({ ...input, cropId: selectedSeed }) : api.harvest(input)),
    )
  },

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

  harvestTree: (treeId) => run((d) => harvestTree(d, treeId, serverNow()), () => api.harvestTree(treeId)),

  setBuyingPlot: (on) => set({ buyingPlot: on }),

  buyPlot: (x, y) => {
    set({ buyingPlot: false })
    run((d) => buyPlot(d, x, y), () => api.buyPlot(x, y))
  },
}))

// ---------- Conversa com o servidor ----------

let clockOffset = 0 // relógio do servidor - relógio deste aparelho (ms)
const serverNow = () => Date.now() + clockOffset

// As ações vão para o servidor uma de cada vez, na ordem dos cliques
let queue: Promise<void> = Promise.resolve()
let pending = 0 // ações na fila (ainda sem resposta)
let latest: SaveData | null = null // último estado que o servidor mandou nesta leva de ações
let errorTimer: ReturnType<typeof setTimeout> | undefined

// O estado do servidor substitui o que está na tela (previsão incluída)
function applyServerState(data: SaveData) {
  clockOffset = data.serverTime - Date.now()
  useGameStore.setState((s) => ({
    data,
    selectedSeed: pickSeed(data.inventory, s.selectedSeed), // a semente pode ter acabado
    readyTrees: readyTreeIds(data, serverNow()).join(),
  }))
}

function showError(message: string) {
  clearTimeout(errorTimer)
  useGameStore.setState({ error: message })
  errorTimer = setTimeout(() => useGameStore.setState({ error: null }), 4000)
}

// 401 = a sessão expirou (ou caiu em outro lugar): volta para a tela de login
function handleFailure(err: unknown) {
  if (err instanceof ApiError && err.status === 401) {
    useGameStore.setState({ status: 'anonymous', user: null, data: null, buyingPlot: false })
  } else {
    showError(err instanceof ApiError ? err.message : 'Sem conexão com o servidor')
  }
}

// Ação do jogador: mostra a previsão na hora e põe o pedido na fila. Quando a fila esvazia, a tela
// fica com o último estado que o servidor devolveu. Se o servidor recusa a ação (ex.: a planta ainda
// não amadureceu lá), mostra o motivo e busca o estado de verdade.
function run(predict: (data: SaveData) => SaveData, send: () => Promise<SaveData>) {
  const { data, status } = useGameStore.getState()
  if (!data || status !== 'ready') return
  const predicted = predict(data)
  if (predicted === data) return // nem a previsão muda nada (sem dinheiro, sem semente...): não pede
  useGameStore.setState((s) => ({
    data: predicted,
    selectedSeed: pickSeed(predicted.inventory, s.selectedSeed),
    readyTrees: readyTreeIds(predicted, serverNow()).join(),
  }))

  pending++
  queue = queue.then(async () => {
    try {
      latest = await send()
    } catch (err) {
      handleFailure(err)
      latest = await api.loadState().catch(() => latest) // sem conexão: o sync periódico acerta depois
    }
    pending--
    if (pending === 0 && latest && useGameStore.getState().status === 'ready') applyServerState(latest)
    if (pending === 0) latest = null
  })
}

// Carrega as regras (catálogo) e o estado do jogador logado e entra no jogo
async function startGame(user: User) {
  const [catalog, data] = await Promise.all([api.fetchCatalog(), api.loadState()])
  setCrops(catalog.crops)
  setTrees(catalog.fruits, catalog.trees)
  setPlotPrice(catalog.plotPrice)
  setDayLength(catalog.dayLengthSeconds)
  useGameStore.setState({ status: 'ready', user, error: null, buyingPlot: false, selectedSeed: 'corn' })
  applyServerState(data)
}

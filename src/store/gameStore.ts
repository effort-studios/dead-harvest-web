import { create } from 'zustand'
import * as api from '../api/client'
import { ApiError, type User } from '../api/client'
import type { Avatar } from '../game/avatar'
import type { CropId } from '../game/crops'
import { buyPlot, buySeed, clickLine, clickTile, harvestTree, migrateSave, pickSeed, readyTreeIds, sellFruit, tick, type ClickMode } from '../game/state'
import type { FruitId } from '../game/trees'
import type { SaveData } from '../game/types'

type GameState = {
  // anonymous = ninguém logado (mostra a tela de login)
  status: 'loading' | 'anonymous' | 'ready' | 'error'
  error: string | null
  saving: boolean
  user: User | null
  data: SaveData | null
  readyTrees: string // ids das árvores com frutas, em texto; muda quando alguma árvore repõe ou é colhida (redesenha o mapa)
  selectedSeed: CropId // semente escolhida na barra de itens (não vai para o save)
  buyingPlot: boolean // true = o mapa mostra as posições livres para o jogador escolher
  init: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (input: { displayName?: string; avatar?: Avatar }) => Promise<void>
  save: () => Promise<void>
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
  saving: false,
  user: null,
  data: null,
  readyTrees: '',
  selectedSeed: 'corn',
  buyingPlot: false,

  // Ao abrir o jogo: se já há sessão (cookie), carrega o save; senão, mostra a tela de login
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
  updateProfile: async (input) => set({ user: await api.updateProfile(input) }),

  logout: async () => {
    await get().save() // não perde o que foi feito desde o último salvamento automático
    await api.logout().catch(() => undefined)
    set({ status: 'anonymous', user: null, data: null, error: null, buyingPlot: false })
  },

  save: async () => {
    const { user, data } = get()
    if (!user || !data) return
    set({ saving: true })
    try {
      await api.putSave(data)
    } catch (err) {
      // 401 = a sessão expirou (ou o login caiu em outro lugar): volta para a tela de login
      if (err instanceof ApiError && err.status === 401) return set({ status: 'anonymous', user: null, data: null })
      set({ error: err instanceof Error ? err.message : 'Erro ao salvar' })
    } finally {
      set({ saving: false })
    }
  },

  clickTile: (plot, row, col, mode) =>
    set((s) => {
      if (!s.data) return s
      const data =
        mode === 'tile'
          ? clickTile(s.data, plot, row, col, s.selectedSeed)
          : clickLine(s.data, mode, plot, row, col, s.selectedSeed)
      return { data, selectedSeed: pickSeed(data.inventory, s.selectedSeed) } // a semente pode ter acabado
    }),

  selectSeed: (crop) => set({ selectedSeed: crop }),

  tick: () =>
    set((s) => {
      if (!s.data) return s
      // as frutas voltam com o tempo real; só mexe no state se alguma árvore mudou
      const readyTrees = readyTreeIds(s.data, Date.now()).join()
      return { data: tick(s.data), readyTrees }
    }),

  buySeed: (crop, qty) =>
    set((s) => {
      if (!s.data) return s
      const data = buySeed(s.data, crop, qty)
      // sem semente escolhida (inventário vazio), a recém-comprada já fica na mão
      const selectedSeed = (s.data.inventory[s.selectedSeed] ?? 0) > 0 ? s.selectedSeed : crop
      return { data, selectedSeed: data === s.data ? s.selectedSeed : selectedSeed }
    }),

  sellFruit: (fruit, qty) => set((s) => (s.data ? { data: sellFruit(s.data, fruit, qty) } : s)),

  harvestTree: (treeId) =>
    set((s) => {
      if (!s.data) return s
      const data = harvestTree(s.data, treeId, Date.now())
      return data === s.data ? s : { data, readyTrees: readyTreeIds(data, Date.now()).join() }
    }),

  setBuyingPlot: (on) => set({ buyingPlot: on }),

  buyPlot: (x, y) => set((s) => (s.data ? { data: buyPlot(s.data, x, y), buyingPlot: false } : s)),
}))

// Carrega o save do usuário logado e entra no jogo
async function startGame(user: User) {
  const data = migrateSave(await api.loadSave())
  useGameStore.setState({
    status: 'ready',
    user,
    data,
    error: null,
    buyingPlot: false,
    selectedSeed: pickSeed(data.inventory, 'corn'),
    readyTrees: readyTreeIds(data, Date.now()).join(),
  })
}

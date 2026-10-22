import { create } from 'zustand'
import { ApiError, createPlayer, loadSave, putSave } from '../api/client'
import type { CropId } from '../game/crops'
import { buyPlot, buySeed, clickLine, clickTile, harvestTree, migrateSave, readyTreeIds, sellFruit, tick, type ClickMode } from '../game/state'
import type { FruitId } from '../game/trees'
import type { SaveData } from '../game/types'

const PLAYER_KEY = 'deadHarvestPlayerId'

type GameState = {
  status: 'loading' | 'ready' | 'error'
  error: string | null
  saving: boolean
  playerId: string | null
  data: SaveData | null
  readyTrees: string // ids das árvores com frutas, em texto; muda quando alguma árvore repõe ou é colhida (redesenha o mapa)
  selectedSeed: CropId // semente escolhida na barra de itens (não vai para o save)
  buyingPlot: boolean // true = o mapa mostra as posições livres para o jogador escolher
  init: () => Promise<void>
  save: () => Promise<void>
  clickTile: (plot: number, row: number, col: number, mode: ClickMode) => void
  selectSeed: (crop: CropId) => void
  tick: () => void
  buySeed: (crop: CropId, qty?: number) => void
  sellFruit: (fruit: FruitId, qty?: number) => void
  harvestTree: (treeId: string) => void
  setBuyingPlot: (on: boolean) => void
  buyPlot: (x: number, y: number) => void
  newGame: () => Promise<void>
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'loading',
  error: null,
  saving: false,
  playerId: null,
  data: null,
  readyTrees: '',
  selectedSeed: 'corn',
  buyingPlot: false,

  init: async () => {
    try {
      let playerId = localStorage.getItem(PLAYER_KEY)
      let data: SaveData | null = null

      if (playerId) {
        try {
          data = await loadSave(playerId)
        } catch (err) {
          // 404 = id guardado não existe mais (ex.: banco recriado); cria outro jogador
          if (!(err instanceof ApiError && err.status === 404)) throw err
        }
      }
      if (!data) {
        playerId = await createPlayer()
        localStorage.setItem(PLAYER_KEY, playerId)
        data = await loadSave(playerId)
      }
      const migrated = migrateSave(data)
      set({ status: 'ready', playerId, data: migrated, readyTrees: readyTreeIds(migrated, Date.now()).join() })
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : 'Erro desconhecido' })
    }
  },

  save: async () => {
    const { playerId, data } = get()
    if (!playerId || !data) return
    set({ saving: true })
    try {
      await putSave(playerId, data)
    } catch (err) {
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
      return { data }
    }),

  selectSeed: (crop) => set({ selectedSeed: crop }),

  tick: () =>
    set((s) => {
      if (!s.data) return s
      // as frutas voltam com o tempo real; só mexe no state se alguma árvore mudou
      const readyTrees = readyTreeIds(s.data, Date.now()).join()
      return { data: tick(s.data), readyTrees }
    }),

  buySeed: (crop, qty) => set((s) => (s.data ? { data: buySeed(s.data, crop, qty) } : s)),

  sellFruit: (fruit, qty) => set((s) => (s.data ? { data: sellFruit(s.data, fruit, qty) } : s)),

  harvestTree: (treeId) =>
    set((s) => {
      if (!s.data) return s
      const data = harvestTree(s.data, treeId, Date.now())
      return data === s.data ? s : { data, readyTrees: readyTreeIds(data, Date.now()).join() }
    }),

  setBuyingPlot: (on) => set({ buyingPlot: on }),

  buyPlot: (x, y) => set((s) => (s.data ? { data: buyPlot(s.data, x, y), buyingPlot: false } : s)),

  // Cria um jogador convidado novo; o antigo continua guardado no banco
  newGame: async () => {
    try {
      const playerId = await createPlayer()
      const data = migrateSave(await loadSave(playerId))
      localStorage.setItem(PLAYER_KEY, playerId)
      set({ playerId, data, readyTrees: readyTreeIds(data, Date.now()).join(), selectedSeed: 'corn', buyingPlot: false, error: null })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Erro ao criar novo jogo' })
    }
  },
}))

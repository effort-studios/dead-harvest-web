import { create } from 'zustand'
import { ApiError, createPlayer, loadSave, putSave } from '../api/client'
import type { CropId } from '../game/crops'
import { buySeed, clickLine, clickTile, migrateSave, tick, type ClickMode } from '../game/state'
import type { SaveData } from '../game/types'

const PLAYER_KEY = 'deadHarvestPlayerId'

type GameState = {
  status: 'loading' | 'ready' | 'error'
  error: string | null
  saving: boolean
  playerId: string | null
  data: SaveData | null
  selectedSeed: CropId // semente escolhida na barra de itens (não vai para o save)
  init: () => Promise<void>
  save: () => Promise<void>
  clickTile: (row: number, col: number, mode: ClickMode) => void
  selectSeed: (crop: CropId) => void
  tick: () => void
  buySeed: (crop: CropId) => void
  newGame: () => Promise<void>
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'loading',
  error: null,
  saving: false,
  playerId: null,
  data: null,
  selectedSeed: 'corn',

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
      set({ status: 'ready', playerId, data: migrateSave(data) })
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

  clickTile: (row, col, mode) =>
    set((s) => {
      if (!s.data) return s
      const data =
        mode === 'tile'
          ? clickTile(s.data, row, col, s.selectedSeed)
          : clickLine(s.data, mode, row, col, s.selectedSeed)
      return { data }
    }),

  selectSeed: (crop) => set({ selectedSeed: crop }),

  tick: () => set((s) => (s.data ? { data: tick(s.data) } : s)),

  buySeed: (crop) => set((s) => (s.data ? { data: buySeed(s.data, crop) } : s)),

  // Cria um jogador convidado novo; o antigo continua guardado no banco
  newGame: async () => {
    try {
      const playerId = await createPlayer()
      const data = migrateSave(await loadSave(playerId))
      localStorage.setItem(PLAYER_KEY, playerId)
      set({ playerId, data, selectedSeed: 'corn', error: null })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Erro ao criar novo jogo' })
    }
  },
}))

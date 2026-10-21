import { create } from 'zustand'
import { ApiError, createPlayer, loadSave, putSave } from '../api/client'
import { clickTile } from '../game/state'
import type { SaveData } from '../game/types'

const PLAYER_KEY = 'deadHarvestPlayerId'

type GameState = {
  status: 'loading' | 'ready' | 'error'
  error: string | null
  saving: boolean
  playerId: string | null
  data: SaveData | null
  init: () => Promise<void>
  save: () => Promise<void>
  clickTile: (row: number, col: number) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'loading',
  error: null,
  saving: false,
  playerId: null,
  data: null,

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
      set({ status: 'ready', playerId, data })
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

  clickTile: (row, col) =>
    set((s) => (s.data ? { data: clickTile(s.data, row, col) } : s)),
}))

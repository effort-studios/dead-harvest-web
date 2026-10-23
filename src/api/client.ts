import { ApiError, post, request } from '@/shared/api/http'
import type { User } from '@/features/profile/model/user'
import type { CatalogCrop } from '../game/crops'
import type { CatalogFruit, CatalogTree } from '../game/trees'
import type { SaveData } from '../game/types'

// ---------- Conta ----------

// Quem está logado (ou null, se não há sessão)
export async function fetchMe(): Promise<User | null> {
  try {
    return (await request<{ user: User }>('/auth/me')).user
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

export async function register(input: { email: string; password: string; displayName: string }): Promise<User> {
  return (await post<{ user: User }>('/auth/register', input)).user
}

export async function login(input: { email: string; password: string }): Promise<User> {
  return (await post<{ user: User }>('/auth/login', input)).user
}

export const logout = () => post<void>('/auth/logout')
export const forgotPassword = (email: string) => post<void>('/auth/forgot-password', { email })
export const resetPassword = (input: { email: string; code: string; newPassword: string }) => post<void>('/auth/reset-password', input)

// ---------- Jogo ----------

// O front não grava estado: cada ação vai para o servidor, que valida, aplica e devolve o estado novo.

export type Catalog = {
  gridSize: number
  dayLengthSeconds: number // duração do dia inteiro
  dayStartSeconds: number
  plotPrice: { base: number; factor: number }
  crops: CatalogCrop[]
  fruits: CatalogFruit[]
  trees: CatalogTree[]
}

export const fetchCatalog = () => request<Catalog>('/game/catalog')
export const loadState = () => request<SaveData>('/game/state')

type Tiles = { x: number; y: number; tiles: { row: number; col: number }[] }

export const till = (input: Tiles) => post<SaveData>('/game/till', input)
export const plant = (input: Tiles & { cropId: string }) => post<SaveData>('/game/plant', input)
export const harvest = (input: Tiles) => post<SaveData>('/game/harvest', input)
export const buySeed = (cropId: string, quantity: number) => post<SaveData>('/game/seeds/buy', { cropId, quantity })
export const sellFruit = (itemId: string, quantity?: number) => post<SaveData>('/game/fruits/sell', { itemId, quantity })
export const buyPlot = (x: number, y: number) => post<SaveData>('/game/plots/buy', { x, y })
export const harvestTree = (treeId: string) => post<SaveData>(`/game/trees/${encodeURIComponent(treeId)}/harvest`, {})

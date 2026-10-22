import type { Avatar } from '../game/avatar'
import type { CatalogCrop } from '../game/crops'
import type { CatalogFruit, CatalogTree } from '../game/trees'
import type { SaveData } from '../game/types'

// A API tem que ser acessada pelo MESMO host que abriu o front (localhost ou o IP da rede): o cookie de
// sessão só vai junto quando os dois estão no mesmo "site". Por isso, sem VITE_API_URL, usa o host da página.
const API_URL = import.meta.env.VITE_API_URL || `${location.protocol}//${location.hostname}:3333`

export type User = { id: string; email: string; displayName: string; avatar: Avatar }

// Erro com o status HTTP e a mensagem que a API mandou (já em português)
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include', // manda e recebe o cookie de sessão
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body?.error ?? `Erro ${res.status} em ${path}`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

const post = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })

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

// Muda o nome e/ou o avatar; devolve o usuário atualizado
export async function updateProfile(input: { displayName?: string; avatar?: Avatar }): Promise<User> {
  return (await request<{ user: User }>('/auth/me', { method: 'PATCH', body: JSON.stringify(input) })).user
}

export const logout = () => post<void>('/auth/logout')
export const forgotPassword = (email: string) => post<void>('/auth/forgot-password', { email })
export const resetPassword = (input: { email: string; code: string; newPassword: string }) => post<void>('/auth/reset-password', input)

// ---------- Jogo ----------

// O front não grava estado: cada ação vai para o servidor, que valida, aplica e devolve o estado novo.

export type Catalog = {
  gridSize: number
  dayLengthSeconds: number
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

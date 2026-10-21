import type { SaveData } from '../game/types'

const API_URL = import.meta.env.VITE_API_URL

// Erro com o status HTTP, para o chamador saber se foi 404, por exemplo
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
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new ApiError(res.status, `Erro ${res.status} em ${path}`)
  return res.json()
}

export async function createPlayer(): Promise<string> {
  const { id } = await request<{ id: string }>('/players', { method: 'POST' })
  return id
}

export function loadSave(playerId: string): Promise<SaveData> {
  return request<SaveData>(`/saves/${playerId}`)
}

export function putSave(playerId: string, data: SaveData): Promise<unknown> {
  return request(`/saves/${playerId}`, { method: 'PUT', body: JSON.stringify(data) })
}

import type { SaveData } from '../game/types'

// A API tem que ser acessada pelo MESMO host que abriu o front (localhost ou o IP da rede): o cookie de
// sessão só vai junto quando os dois estão no mesmo "site". Por isso, sem VITE_API_URL, usa o host da página.
const API_URL = import.meta.env.VITE_API_URL || `${location.protocol}//${location.hostname}:3333`

export type User = { id: string; email: string; displayName: string }

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

export const logout = () => post<void>('/auth/logout')
export const forgotPassword = (email: string) => post<void>('/auth/forgot-password', { email })
export const resetPassword = (input: { email: string; code: string; newPassword: string }) => post<void>('/auth/reset-password', input)

// ---------- Jogo ----------

export const loadSave = () => request<SaveData>('/saves/me')
export const putSave = (data: SaveData) => request<unknown>('/saves/me', { method: 'PUT', body: JSON.stringify(data) })

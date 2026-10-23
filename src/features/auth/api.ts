import type { User } from '@/features/profile/model/user'
import { ApiError, post, request } from '@/shared/api/http'

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

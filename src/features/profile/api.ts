import { request } from '@/shared/api/http'
import type { Avatar } from './model/avatar'
import type { User } from './model/user'

// Muda o nome e/ou o avatar; devolve o usuário atualizado
export async function updateProfile(input: { displayName?: string; avatar?: Avatar }): Promise<User> {
  return (await request<{ user: User }>('/auth/me', { method: 'PATCH', body: JSON.stringify(input) })).user
}

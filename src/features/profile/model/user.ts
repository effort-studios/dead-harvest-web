import type { Avatar } from './avatar'

// Quem está logado, como a API devolve
export type User = { id: string; email: string; displayName: string; avatar: Avatar }

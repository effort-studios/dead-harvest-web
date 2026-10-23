import { create } from 'zustand'
import { updateProfile } from './api'
import type { Avatar } from './model/avatar'
import type { User } from './model/user'

type ProfileState = {
  user: User | null // quem está logado (null = ninguém)
  setUser: (user: User | null) => void
  // lança o erro da API (mensagem pronta) para o editor de perfil mostrar
  updateProfile: (input: { displayName?: string; avatar?: Avatar }) => Promise<void>
}

export const useProfileStore = create<ProfileState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateProfile: async (input) => set({ user: await updateProfile(input) }),
}))

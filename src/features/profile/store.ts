import { create } from 'zustand'
import { updateProfile } from './api'
import type { Avatar } from './model/avatar'
import type { User } from './model/user'
import { clearLastUser, writeLastUser } from './render/avatarCache'

type ProfileState = {
  user: User | null // quem está logado (null = ninguém)
  setUser: (user: User | null) => void
  // lança o erro da API (mensagem pronta) para o editor de perfil mostrar
  updateProfile: (input: { displayName?: string; avatar?: Avatar }) => Promise<void>
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  user: null,
  // Guarda nome e avatar para a tela de carregamento do próximo F5 (só visual; o login é pelo cookie)
  setUser: (user) => {
    if (user) writeLastUser(user)
    else clearLastUser()
    set({ user })
  },
  updateProfile: async (input) => get().setUser(await updateProfile(input)),
}))

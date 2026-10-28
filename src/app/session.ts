import { create } from 'zustand'
import * as authApi from '@/features/auth/api'
import { setUnauthorizedHandler, useFarmStore } from '@/features/farm/store'
import type { User } from '@/features/profile/model/user'
import { cachedAvatarImage, preloadAvatarAssets } from '@/features/profile/render/avatarLayers'
import { readLastUser } from '@/features/profile/render/avatarCache'
import { useProfileStore } from '@/features/profile/store'

// A sessão junta as features: quem está logado (profile), o jogo (farm) e a chamada de login (auth).
// Aqui mora a ordem das coisas: entrar = carregar o jogo e então mostrá-lo; sair = esperar as ações
// a caminho, deslogar e limpar tudo.

type SessionState = {
  // anonymous = ninguém logado (mostra a tela de login)
  status: 'loading' | 'anonymous' | 'ready' | 'error'
  error: string | null // por que não foi possível abrir o jogo (só vale com status 'error')
}

export const useSession = create<SessionState>(() => ({ status: 'loading', error: null }))

const farm = () => useFarmStore.getState()
const profile = () => useProfileStore.getState()

// Carrega o jogo do jogador e entra nele; lança o erro da API se falhar (a tela de login mostra)
async function enter(user: User) {
  await farm().start()
  profile().setUser(user)
  useSession.setState({ status: 'ready', error: null })
}

// Volta para a tela de login, sem jogo e sem usuário
function leave() {
  farm().reset()
  profile().setUser(null)
  useSession.setState({ status: 'anonymous' })
}

// O servidor respondeu 401 a uma ação do jogo: a sessão caiu (expirou ou foi encerrada em outro lugar)
setUnauthorizedHandler(leave)

// Ao abrir o jogo: se já há sessão (cookie), carrega o jogo; senão, mostra a tela de login
export async function init() {
  // se o retrato do último jogador não está no cache (primeiro acesso nesta versão da arte), já baixa as camadas
  const last = readLastUser()
  if (last && !cachedAvatarImage(last.avatar)) preloadAvatarAssets()
  try {
    const user = await authApi.fetchMe()
    if (!user) return leave()
    await enter(user)
  } catch (err) {
    useSession.setState({ status: 'error', error: err instanceof Error ? err.message : 'Erro desconhecido' })
  }
}

// login e register lançam o erro da API (mensagem pronta) para a tela de login mostrar
export async function login(email: string, password: string) {
  await enter(await authApi.login({ email, password }))
}

// Só cria a conta: o jogador entra depois, ao confirmar o e-mail (verifyEmail)
export async function register(email: string, password: string, displayName: string) {
  await authApi.register({ email, password, displayName })
}

export async function verifyEmail(email: string, code: string) {
  await enter(await authApi.verifyEmail({ email, code }))
}

export async function logout() {
  await farm().flush() // deixa as ações que estão a caminho chegarem ao servidor
  await authApi.logout().catch(() => undefined)
  leave()
}

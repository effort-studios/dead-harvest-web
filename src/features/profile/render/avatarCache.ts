import type { Avatar } from '@/features/profile/model/avatar'
import type { User } from '@/features/profile/model/user'

// Cache no navegador (localStorage) para o retrato aparecer na hora depois de um F5:
//  - a imagem pronta de cada combinação de avatar (só pixels, nenhum dado pessoal);
//  - o último usuário (nome e avatar), só para a tela de "carregando" mostrar o retrato antes de a API responder.
// A chave da imagem é a própria combinação dos 8 ids: sem hash. Tudo é opcional: com o storage bloqueado ou cheio
// (modo privado, cota) as funções não fazem nada e o retrato é montado como antes.
// Nada daqui decide login: quem prova a sessão é o cookie, confirmado por GET /auth/me.

// Aumente quando os desenhos ou as paletas mudarem (scripts/build_avatar_layers.py, layers.json, rampas de cor
// em avatarLayers.ts); sem isso o cache serviria a arte antiga.
export const ART_VERSION = 1

const IMAGE_PREFIX = `dh:avatar-img:${ART_VERSION}:`
const IMAGE_ANY_VERSION = 'dh:avatar-img:'
const INDEX_KEY = `dh:avatar-img-index:${ART_VERSION}`
const LAST_USER_KEY = 'dh:last-user'
const MAX_IMAGES = 10 // só as combinações mais recentes ficam guardadas

export const avatarKey = (a: Avatar) => [a.skin, a.eyes, a.face, a.hair, a.hairColor, a.beard, a.hat, a.outfit].join('|')

// Põe `key` como a mais recente da lista; devolve a lista nova e as chaves que saíram por passar do limite
export function touchRecent(list: string[], key: string, max = MAX_IMAGES) {
  const next = [key, ...list.filter((k) => k !== key)]
  return { list: next.slice(0, max), evicted: next.slice(max) }
}

function safe<T>(fn: () => T): T | null {
  try {
    return fn()
  } catch {
    return null
  }
}

export const readCachedImage = (avatar: Avatar): string | null => safe(() => localStorage.getItem(IMAGE_PREFIX + avatarKey(avatar)))

export function writeCachedImage(avatar: Avatar, url: string) {
  safe(() => {
    const key = avatarKey(avatar)
    const index: string[] = JSON.parse(localStorage.getItem(INDEX_KEY) ?? '[]')
    const { list, evicted } = touchRecent(index, key)
    // arte de versões antigas não serve mais: apaga na primeira gravação
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k?.startsWith(IMAGE_ANY_VERSION) && !k.startsWith(IMAGE_PREFIX)) localStorage.removeItem(k)
    }
    for (const old of evicted) localStorage.removeItem(IMAGE_PREFIX + old)
    localStorage.setItem(IMAGE_PREFIX + key, url)
    localStorage.setItem(INDEX_KEY, JSON.stringify(list))
  })
}

export const writeLastUser = (user: User) =>
  safe(() => localStorage.setItem(LAST_USER_KEY, JSON.stringify({ displayName: user.displayName, avatar: user.avatar })))

export const clearLastUser = () => safe(() => localStorage.removeItem(LAST_USER_KEY))

export function readLastUser(): { displayName: string; avatar: Avatar } | null {
  return safe(() => {
    const raw = localStorage.getItem(LAST_USER_KEY)
    const parsed = raw && JSON.parse(raw)
    return parsed?.avatar && typeof parsed.displayName === 'string' ? parsed : null
  })
}

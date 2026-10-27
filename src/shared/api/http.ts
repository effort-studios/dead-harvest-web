// A API tem que ser acessada pelo MESMO host que abriu o front (localhost ou o IP da rede): o cookie de
// sessão só vai junto quando os dois estão no mesmo "site". Por isso, sem VITE_API_URL, usa o host da página.
// No Electron empacotado (protocolo app:) não há host da API na página; usa o localhost.
const API_URL = import.meta.env.VITE_API_URL || (location.protocol === 'app:' ? 'http://localhost:3333' : `${location.protocol}//${location.hostname}:3333`)

// Erro com o status HTTP e a mensagem que a API mandou (já em português)
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
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

export const post = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })

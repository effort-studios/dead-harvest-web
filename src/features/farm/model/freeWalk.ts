// Andar livre (WASD): o cliente move o fazendeiro sozinho, quadro a quadro, e só avisa o servidor de onde
// está (que confere a velocidade). Aqui ficam as contas, sem tela nem rede.

// O mapa é isométrico: as teclas valem na TELA (W = para cima), não na grade de células.
// Tela (x, y) -> células: linha = (y - x) / 2, coluna = (x + y) / 2 (inverso de cellToWorld em render/draw.ts)
const SCREEN: Record<string, { x: number; y: number }> = {
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
}

export const isWalkKey = (key: string) => key in SCREEN

// Direção (vetor unitário em células) das teclas apertadas; null se nenhuma ou se se anulam (W + S)
export function heldDirection(keys: string[]): { dr: number; dc: number } | null {
  let x = 0
  let y = 0
  for (const key of keys) {
    x += SCREEN[key]?.x ?? 0
    y += SCREEN[key]?.y ?? 0
  }
  const dr = (y - x) / 2
  const dc = (x + y) / 2
  const len = Math.hypot(dr, dc)
  return len < 1e-6 ? null : { dr: dr / len, dc: dc / len }
}

export const MAP_LIMIT = 100 // mesmo limite das células que o servidor aceita

const clamp = (v: number) => Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, v))

// Um passo de `seconds` na direção `dir` a `speed` células por segundo, sem sair do mapa
export function stepWalk(from: { r: number; c: number }, dir: { dr: number; dc: number }, seconds: number, speed: number) {
  const r = clamp(from.r + dir.dr * speed * seconds)
  const c = clamp(from.c + dir.dc * speed * seconds)
  return { r, c, moved: Math.hypot(r - from.r, c - from.c) }
}

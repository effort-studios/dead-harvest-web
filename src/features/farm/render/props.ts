import type { FruitId } from '@/features/farm/model/trees'
import { drawSprite, spriteHit } from './sprites'

// Objetos do cenário (cerca, fardos, plataforma, saco, arbusto, pedra, árvore): sprites em pixel art (sprites.ts).

export type PropKind = 'hay' | 'hayStack' | 'platform' | 'sack' | 'bush' | 'rock' | 'tree'

// Proporção do tile no mundo: losango com o dobro de largura que de altura
const HW = 48
const HH = 24

// Área clicável da copa (em coordenadas do mundo), relativa à base da árvore
export const TREE_HIT = spriteHit('tree')

// Desenha um objeto com a base no centro do tile (x, y). A árvore com frutas maduras usa o sprite com elas.
export function drawProp(ctx: CanvasRenderingContext2D, kind: PropKind, x: number, y: number, fruit?: FruitId) {
  drawSprite(ctx, kind === 'tree' && fruit ? `tree_${fruit}` : kind, x, y)
}

// ---------- Cerca ----------
// Uma seção vai do ponto (ax, ay) ao ponto (bx, by) do chão, ao longo de um lado do losango.
// O sprite é o lado que desce para a direita ("\"); o que sobe para a direita ("/") é ele espelhado.
export function drawFence(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number) {
  const [lx, ly, rx, ry] = ax < bx ? [ax, ay, bx, by] : [bx, by, ax, ay] // ponta da esquerda e da direita
  if (ry > ly) drawSprite(ctx, 'fence', lx, ly)
  else drawSprite(ctx, 'fence', rx, ry, true)
}

export const TILE_HALF = { w: HW, h: HH }

import type { FarmJob, FarmerState } from './types'

// Fazendeiro: quem anda e age é o SERVIDOR (fila de tarefas, uma de cada vez, mesmo com o jogo fechado).
// Aqui só se calcula, a partir dos horários que o servidor mandou, onde ele está e o que está fazendo
// em cada instante, para a tela animar. Posição em células do mapa (linha r, coluna c, com fração).

export type FarmerAction = 'till' | 'plant' | 'harvest' | 'pick'

export type Pose = {
  r: number
  c: number
  facing: { dr: number; dc: number } // para onde olha (vetor unitário em células)
  walking: boolean
  phase: number // fase do passo: cresce com a distância andada
  acting: { action: FarmerAction; progress: number } | null // gesto em andamento, progresso de 0 a 1
}

const STRIDE_PER_CELL = 2.6 // passos (fase) por célula andada

const ACTION: Record<FarmJob['action'], FarmerAction> = { till: 'till', plant: 'plant', harvest: 'harvest', harvest_tree: 'pick' }

// Pose do fazendeiro no instante `now` (ms, relógio do servidor). `idleFacing` é para onde olhava na última
// vez que se mexeu: parado, continua olhando para lá.
export function farmerPose(farmer: FarmerState, now: number, idleFacing: Pose['facing']): Pose {
  const idle: Pose = { r: farmer.row, c: farmer.col, facing: idleFacing, walking: false, phase: 0, acting: null }
  const job = farmer.jobs[0]
  if (!job || job.startsAt === undefined || job.arriveAt === undefined || job.endsAt === undefined || now < job.startsAt) return idle

  const dr = job.targetRow - farmer.row
  const dc = job.targetCol - farmer.col
  const dist = Math.hypot(dr, dc)
  const facing = dist > 0.001 ? { dr: dr / dist, dc: dc / dist } : idleFacing

  if (now < job.arriveAt) {
    const f = (now - job.startsAt) / Math.max(job.arriveAt - job.startsAt, 1)
    return { r: farmer.row + dr * f, c: farmer.col + dc * f, facing, walking: true, phase: dist * f * STRIDE_PER_CELL, acting: null }
  }
  // chegou: faz o gesto; passado o fim, espera o servidor confirmar (a tela busca o estado nesse instante)
  const progress = now < job.endsAt ? (now - job.arriveAt) / Math.max(job.endsAt - job.arriveAt, 1) : null
  return { r: job.targetRow, c: job.targetCol, facing, walking: false, phase: 0, acting: progress === null ? null : { action: ACTION[job.action], progress } }
}

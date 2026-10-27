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

const ACTION: Record<FarmJob['action'], FarmerAction | null> = {
  till: 'till',
  untill: 'till', // mesmo gesto: mexe na terra
  move: null, // só anda
  plant: 'plant',
  harvest: 'harvest',
  harvest_tree: 'pick',
  fertilize: 'plant', // espalhar o adubo é o mesmo gesto de semear
  water: 'plant', // regar também: abaixado, sobre o tile
  collect_machine: 'pick',
  collect_barn: 'pick',
  refill_can: 'pick',
}

// Pose do fazendeiro no instante `now` (ms, relógio do servidor). `idleFacing` é para onde olhava na última
// vez que se mexeu: parado, continua olhando para lá.
// Todos os pedidos da fila têm horários, então a pose sai da fila inteira: o trajeto de um tile ao outro anima
// sem esperar o servidor confirmar o anterior (a resposta dele demora mais que a caminhada entre tiles vizinhos).
export function farmerPose(farmer: FarmerState, now: number, idleFacing: Pose['facing']): Pose {
  let from = { r: farmer.row, c: farmer.col }
  let facing = idleFacing
  for (const job of farmer.jobs) {
    const to = { r: job.targetRow, c: job.targetCol }
    const dr = to.r - from.r
    const dc = to.c - from.c
    const dist = Math.hypot(dr, dc)
    if (dist > 0.001) facing = { dr: dr / dist, dc: dc / dist }

    if (now >= job.endsAt) {
      from = to // já terminou (o servidor ainda vai confirmar): segue para o próximo
      continue
    }
    if (now < job.startsAt) break
    if (now < job.arriveAt) {
      const f = (now - job.startsAt) / Math.max(job.arriveAt - job.startsAt, 1)
      return { r: from.r + dr * f, c: from.c + dc * f, facing, walking: true, phase: dist * f * STRIDE_PER_CELL, acting: null }
    }
    // chegou: faz o gesto
    const progress = (now - job.arriveAt) / Math.max(job.endsAt - job.arriveAt, 1)
    const action = ACTION[job.action]
    return { r: to.r, c: to.c, facing, walking: false, phase: 0, acting: action ? { action, progress } : null }
  }
  return { r: from.r, c: from.c, facing, walking: false, phase: 0, acting: null }
}

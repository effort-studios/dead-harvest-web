import { post, request } from '@/shared/api/http'
import type { CatalogCrop } from '@/features/farm/model/crops'
import type { CatalogFruit, CatalogTree } from '@/features/farm/model/trees'
import type { SaveData } from '@/features/farm/model/types'

// ---------- Jogo ----------

// O front não grava estado: cada ação vai para o servidor, que valida, aplica e devolve o estado novo.

export type Catalog = {
  gridSize: number
  dayLengthSeconds: number // duração do dia inteiro
  dayStartSeconds: number
  plotPrice: { base: number; factor: number }
  crops: CatalogCrop[]
  fruits: CatalogFruit[]
  trees: CatalogTree[]
}

export const fetchCatalog = () => request<Catalog>('/game/catalog')
export const loadState = () => request<SaveData>('/game/state')

type Tiles = { x: number; y: number; tiles: { row: number; col: number }[] }

// Arar, plantar e colher são tarefas do fazendeiro: o servidor enfileira, anda e executa uma de cada vez
export type JobRequest =
  | (Tiles & { action: 'till' | 'harvest' })
  | (Tiles & { action: 'plant'; cropId: string })
  | { action: 'harvest_tree'; treeId: string }
export const enqueueJob = (job: JobRequest) => post<SaveData>('/game/jobs', job)
export const cancelJobs = () => request<SaveData>('/game/jobs', { method: 'DELETE' })
export const buySeed = (cropId: string, quantity: number) => post<SaveData>('/game/seeds/buy', { cropId, quantity })
export const sellFruit = (itemId: string, quantity?: number) => post<SaveData>('/game/fruits/sell', { itemId, quantity })
export const buyPlot = (x: number, y: number) => post<SaveData>('/game/plots/buy', { x, y })

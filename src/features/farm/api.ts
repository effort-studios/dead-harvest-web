import { post, request } from '@/shared/api/http'
import type { CatalogCrop } from '@/features/farm/model/crops'
import type { BuildingRef, ProductionCatalog } from '@/features/farm/model/production'
import type { CatalogFruit, CatalogTree } from '@/features/farm/model/trees'
import type { SaveData } from '@/features/farm/model/types'

// ---------- Jogo ----------

// O front não grava estado: cada ação vai para o servidor, que valida, aplica e devolve o estado novo.

export type Catalog = ProductionCatalog & {
  gridSize: number
  farmerWalkSpeed: number // células por segundo
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

// Arar, plantar, colher, adubar e coletar são tarefas do fazendeiro: o servidor enfileira, anda e executa uma de cada vez
export type JobRequest =
  | (Tiles & { action: 'till' | 'untill' | 'harvest' | 'fertilize' | 'water' })
  | (Tiles & { action: 'plant'; cropId: string })
  | { action: 'harvest_tree'; treeId: string }
  | { action: 'collect_machine'; machineId: string }
  | { action: 'collect_barn' }
  | { action: 'refill_can' }
  | { action: 'move'; row: number; col: number } // só andar até a célula do mapa
export const enqueueJob = (job: JobRequest) => post<SaveData>('/game/jobs', job)
// Andar livre (WASD): avisa onde o fazendeiro está; o servidor limita pela velocidade desde o 'start'.
// start = apertou a 1ª tecla, move = aviso no meio do caminho, end = soltou todas
export type WalkPhase = 'start' | 'move' | 'end'
export const walkTo = (row: number, col: number, phase: WalkPhase) => post<SaveData>('/game/farmer/position', { row, col, phase })
export const cancelJobs = () => request<SaveData>('/game/jobs', { method: 'DELETE' })
export const buySeed = (cropId: string, quantity: number) => post<SaveData>('/game/seeds/buy', { cropId, quantity })
export const sellItem = (itemId: string, quantity?: number) => post<SaveData>('/game/items/sell', { itemId, quantity })
export const buyPlot = (x: number, y: number) => post<SaveData>('/game/plots/buy', { x, y })
// Constrói na célula (row, col) do mapa
export const buyMachine = (machineId: string, row: number, col: number) => post<SaveData>('/game/machines/buy', { machineId, row, col })
export const startRecipe = (recipeId: string) => post<SaveData>('/game/machines/start', { recipeId })
export const buyBarn = (row: number, col: number) => post<SaveData>('/game/barn/buy', { row, col })
export const buyWell = (row: number, col: number) => post<SaveData>('/game/well/buy', { row, col })
export const buyCan = () => post<SaveData>('/game/tools/can/buy')
export const expandBarn = () => post<SaveData>('/game/barn/expand')
export const buyAnimal = (animalId: string) => post<SaveData>('/game/animals/buy', { animalId })
export const feedAnimals = () => post<SaveData>('/game/animals/feed')
// Prédio arrastado no mapa para a célula (row, col)
export const moveBuilding = (building: BuildingRef, row: number, col: number) =>
  post<SaveData>('/game/buildings/move', building.kind === 'machine' ? { kind: 'machine', machineId: building.id, row, col } : { kind: building.kind, row, col })

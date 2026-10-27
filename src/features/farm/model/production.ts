import type { BarnState, MachineJob, SaveData } from './types'

// Armazém, máquinas e celeiro. Tudo que é regra (itens, preços, receitas, tempos, posições, animais) vem da API
// (GET /game/catalog) ao abrir o jogo, em setProduction; aqui ficam o catálogo em memória e as contas que a
// tela precisa (o que está pronto, quanto falta, se dá para fazer). Quem decide de verdade é o servidor.

// ---------- Itens do armazém ----------

export type ItemKind = 'fruit' | 'crop' | 'animal_product' | 'product'
export type ItemInfo = { id: string; kind: ItemKind; name: string; sellPrice: number | null } // null = não se vende

export const ITEMS: Record<string, ItemInfo> = {}
// Ordem do armazém: colheitas, frutas, produtos dos animais, produtos das máquinas
export const ITEM_ORDER: string[] = []
const KIND_ORDER: ItemKind[] = ['crop', 'fruit', 'animal_product', 'product']

export const itemName = (id: string) => ITEMS[id]?.name ?? id

// ---------- Máquinas ----------

export type RecipeInfo = {
  id: string
  machineId: string
  outputItemId: string
  outputQuantity: number
  seconds: number
  inputs: { itemId: string; quantity: number }[]
}
// size: ocupa size x size células do mapa
export type MachineInfo = { id: string; name: string; buyPrice: number; size: number; queueSize: number; recipes: RecipeInfo[] }

export const MACHINES: MachineInfo[] = []
export const RECIPES: Record<string, RecipeInfo> = {}
export const machineById = (id: string) => MACHINES.find((m) => m.id === id)

// ---------- Celeiro ----------

export type AnimalInfo = {
  id: string
  name: string
  buyPrice: number
  feedItemId: string
  feedQuantity: number
  productItemId: string
  produceSeconds: number
  byproductItemId: string | null // o que ele solta junto a cada coleta (esterco)
  byproductQuantity: number
}
export const ANIMALS: AnimalInfo[] = []
export const animalById = (id: string) => ANIMALS.find((a) => a.id === id)

export const BARN = {
  price: 0,
  startCapacity: 0,
  expandBy: 0,
  maxCapacity: 0,
  expandPrice: { base: 0, factor: 1 },
}

// Adubo (item) e quanto adubo e água aceleram a planta (somam: 0,3 + 0,3 = 60% mais rápido)
export const FERTILIZER = { itemId: 'fertilizer' }
export const GROWTH_BONUS = { fertilizer: 0, water: 0 }
export const growthRate = (t: { fertilized: boolean; watered: boolean }) =>
  1 + (t.fertilized ? GROWTH_BONUS.fertilizer : 0) + (t.watered ? GROWTH_BONUS.water : 0)

// Regador (comprado na loja, cargas) e poço (prédio onde o regador enche)
export const WATERING_CAN = { price: 0, charges: 0 }
export const WELL = { price: 0 }

// Lugar dos prédios: o chão do celeiro (células a partir da dele; a máquina ocupa size x size a partir da dela).
// Mesmas regras do servidor (utils/layout.ts), para a prévia mostrar se pode (as que dependem dos terrenos ficam
// em state.ts: placementProblem e builtCells).
export type Area = { r0: number; r1: number; c0: number; c1: number }
export const LAYOUT = {
  barnFootprint: { r0: 0, r1: 0, c0: 0, c1: 0 } as Area,
  wellFootprint: { r0: 0, r1: 0, c0: 0, c1: 0 } as Area,
}

// ---------- Catálogo da API ----------

type CatalogRecipe = Omit<RecipeInfo, 'machineId'>
export type ProductionCatalog = {
  items: { id: string; kind: string; name: string; sellPrice: number | null }[]
  machines: { id: string; name: string; buyPrice: number; size: number; queueSize: number; recipes: CatalogRecipe[] }[]
  animals: AnimalInfo[]
  barn: { price: number; startCapacity: number; expandBy: number; maxCapacity: number; expandPrice: { base: number; factor: number } }
  fertilizer: { itemId: string }
  growthBonus: typeof GROWTH_BONUS
  wateringCan: typeof WATERING_CAN
  well: typeof WELL
  layout: typeof LAYOUT
}

export function setProduction(catalog: ProductionCatalog) {
  for (const key of Object.keys(ITEMS)) delete ITEMS[key]
  const items = catalog.items.filter((i): i is ItemInfo => (KIND_ORDER as string[]).includes(i.kind))
  for (const i of items) ITEMS[i.id] = i
  ITEM_ORDER.length = 0
  for (const kind of KIND_ORDER) ITEM_ORDER.push(...items.filter((i) => i.kind === kind).map((i) => i.id))

  MACHINES.length = 0
  for (const key of Object.keys(RECIPES)) delete RECIPES[key]
  for (const m of catalog.machines) {
    const recipes = m.recipes.map((r) => ({ ...r, machineId: m.id }))
    for (const r of recipes) RECIPES[r.id] = r
    MACHINES.push({ id: m.id, name: m.name, buyPrice: m.buyPrice, size: m.size, queueSize: m.queueSize, recipes })
  }

  ANIMALS.length = 0
  ANIMALS.push(...catalog.animals)
  const b = catalog.barn
  Object.assign(BARN, { price: b.price, startCapacity: b.startCapacity, expandBy: b.expandBy, maxCapacity: b.maxCapacity, expandPrice: b.expandPrice })
  Object.assign(FERTILIZER, catalog.fertilizer)
  Object.assign(GROWTH_BONUS, catalog.growthBonus)
  Object.assign(WATERING_CAN, catalog.wateringCan)
  Object.assign(WELL, catalog.well)
  Object.assign(LAYOUT, catalog.layout)
}

// ---------- Contas da tela (now = relógio do servidor, em ms) ----------

export const jobReady = (job: MachineJob, now: number) => job.readyAt <= now

// Quantas receitas da máquina já ficaram prontas (esperando o fazendeiro)
export function machineReadyCount(data: SaveData, machineId: string, now: number) {
  return data.machines[machineId]?.jobs.filter((j) => jobReady(j, now)).length ?? 0
}

// Ids das máquinas com algo pronto
export function readyMachineIds(data: SaveData, now: number): string[] {
  return Object.keys(data.machines).filter((id) => machineReadyCount(data, id, now) > 0)
}

// Quantos ingredientes de cada faltam para a receita (vazio = dá para fazer)
export function missingInputs(inventory: Record<string, number>, recipe: RecipeInfo) {
  return recipe.inputs
    .map((i) => ({ itemId: i.itemId, missing: i.quantity - (inventory[i.itemId] ?? 0) }))
    .filter((i) => i.missing > 0)
}

// Estado de um animal: com fome, produzindo (com o progresso de 0 a 1) ou pronto para coletar
export type AnimalStatus = { kind: 'hungry' } | { kind: 'producing'; progress: number; readyAt: number } | { kind: 'ready' }

export function animalStatus(animal: { animalId: string; fedAt: number | null }, now: number): AnimalStatus {
  const info = animalById(animal.animalId)
  if (animal.fedAt === null || !info) return { kind: 'hungry' }
  const readyAt = animal.fedAt + info.produceSeconds * 1000
  if (now >= readyAt) return { kind: 'ready' }
  return { kind: 'producing', progress: (now - animal.fedAt) / (info.produceSeconds * 1000), readyAt }
}

export function barnReadyCount(barn: BarnState, now: number) {
  return barn.animals.filter((a) => animalStatus(a, now).kind === 'ready').length
}

export function barnHungryCount(barn: BarnState) {
  return barn.animals.filter((a) => a.fedAt === null).length
}

export const barnExpandPrice = (capacity: number) =>
  Math.round(BARN.expandPrice.base * BARN.expandPrice.factor ** ((capacity - BARN.startCapacity) / BARN.expandBy))

// ---------- Lugar dos prédios ----------

export type BuildingRef = { kind: 'machine'; id: string } | { kind: 'barn' } | { kind: 'well' }
export const sameBuilding = (a: BuildingRef, b: BuildingRef) => a.kind === b.kind && (a.kind !== 'machine' || (b.kind === 'machine' && a.id === b.id))

// Onde o prédio está (célula dele); null = ainda não construído
export function buildingPos(data: SaveData, b: BuildingRef): { r: number; c: number } | null {
  if (b.kind === 'barn') return data.barn.row === null || data.barn.col === null ? null : { r: data.barn.row, c: data.barn.col }
  if (b.kind === 'well') return data.well && { r: data.well.row, c: data.well.col }
  const owned = data.machines[b.id]
  return owned ? { r: owned.row, c: owned.col } : null
}

export const isBuilt = (data: SaveData, b: BuildingRef) => buildingPos(data, b) !== null

// Chão do prédio na célula (r, c)
export function footprint(b: BuildingRef, r: number, c: number): Area {
  const f =
    b.kind === 'barn' ? LAYOUT.barnFootprint
    : b.kind === 'well' ? LAYOUT.wellFootprint
    : { r0: 0, r1: (machineById(b.id)?.size ?? 1) - 1, c0: 0, c1: (machineById(b.id)?.size ?? 1) - 1 }
  return { r0: r + f.r0, r1: r + f.r1, c0: c + f.c0, c1: c + f.c1 }
}

// Onde fica o meio do prédio em relação à célula dele (é onde ele é desenhado): a máquina 2x2 fica no canto
// entre as 4 células; o celeiro, na célula dele
export function centerOffset(b: BuildingRef): number {
  return b.kind === 'machine' ? ((machineById(b.id)?.size ?? 1) - 1) / 2 : 0
}

export const overlaps = (a: Area, b: Area) => a.r0 <= b.r1 && b.r0 <= a.r1 && a.c0 <= b.c1 && b.c0 <= a.c1

// Chão dos prédios construídos, menos `except`
export function buildingAreas(data: SaveData, except?: BuildingRef): Area[] {
  const refs: BuildingRef[] = [...MACHINES.map((m) => ({ kind: 'machine' as const, id: m.id })), { kind: 'barn' }, { kind: 'well' }]
  const areas: Area[] = []
  for (const b of refs) {
    const at = buildingPos(data, b)
    if (at && !(except && sameBuilding(b, except))) areas.push(footprint(b, at.r, at.c))
  }
  return areas
}

// Texto que muda quando alguma máquina ou o celeiro fica pronto (ou é coletado): o mapa só redesenha os
// balões de "pronto" quando isto muda, como as frutas das árvores
export function readyKey(data: SaveData, now: number): string {
  return `${readyMachineIds(data, now).join()}|${barnReadyCount(data.barn, now)}|${barnHungryCount(data.barn)}`
}

// ---------- Previsões (a tela responde na hora; o estado do servidor substitui logo depois) ----------

const take = (inventory: Record<string, number>, itemId: string, n: number) => ({ ...inventory, [itemId]: (inventory[itemId] ?? 0) - n })

// Constrói a máquina na célula (r, c) (quem chama já conferiu o lugar)
export function buyMachine(data: SaveData, machineId: string, r: number, c: number): SaveData {
  const m = machineById(machineId)
  if (!m || data.machines[machineId] || data.money < m.buyPrice) return data
  return { ...data, money: data.money - m.buyPrice, machines: { ...data.machines, [machineId]: { row: r, col: c, jobs: [] } } }
}

// Põe a receita na fila: gasta os ingredientes e começa quando a anterior fica pronta
export function startRecipe(data: SaveData, recipeId: string, now: number): SaveData {
  const recipe = RECIPES[recipeId]
  const machine = recipe && machineById(recipe.machineId)
  const state = recipe && data.machines[recipe.machineId]
  if (!recipe || !machine || !state || state.jobs.length >= machine.queueSize || missingInputs(data.inventory, recipe).length > 0) return data
  let inventory = data.inventory
  for (const i of recipe.inputs) inventory = take(inventory, i.itemId, i.quantity)
  const startsAt = Math.max(now, state.jobs[state.jobs.length - 1]?.readyAt ?? now)
  const job = { id: `prev-${now}`, recipeId, startsAt, readyAt: startsAt + recipe.seconds * 1000 }
  return { ...data, inventory, machines: { ...data.machines, [machine.id]: { ...state, jobs: [...state.jobs, job] } } }
}

// Muda o prédio de lugar (quem chama já conferiu que pode)
export function moveBuilding(data: SaveData, b: BuildingRef, r: number, c: number): SaveData {
  if (b.kind === 'barn') return { ...data, barn: { ...data.barn, row: r, col: c } }
  if (b.kind === 'well') return data.well ? { ...data, well: { row: r, col: c } } : data
  const state = data.machines[b.id]
  return state ? { ...data, machines: { ...data.machines, [b.id]: { ...state, row: r, col: c } } } : data
}

export function buyWell(data: SaveData, r: number, c: number): SaveData {
  if (data.well || data.money < WELL.price) return data
  return { ...data, money: data.money - WELL.price, well: { row: r, col: c } }
}

export function buyCan(data: SaveData): SaveData {
  if (data.canCharges !== null || data.money < WATERING_CAN.price) return data
  return { ...data, money: data.money - WATERING_CAN.price, canCharges: WATERING_CAN.charges }
}

export function buyBarn(data: SaveData, r: number, c: number): SaveData {
  if (data.barn.capacity > 0 || data.money < BARN.price) return data
  return { ...data, money: data.money - BARN.price, barn: { ...data.barn, row: r, col: c, capacity: BARN.startCapacity } }
}

export function expandBarn(data: SaveData): SaveData {
  const { capacity } = data.barn
  const price = barnExpandPrice(capacity)
  if (capacity === 0 || capacity >= BARN.maxCapacity || data.money < price) return data
  return { ...data, money: data.money - price, barn: { ...data.barn, capacity: Math.min(capacity + BARN.expandBy, BARN.maxCapacity) } }
}

export function buyAnimal(data: SaveData, animalId: string, now: number): SaveData {
  const a = animalById(animalId)
  const { barn } = data
  if (!a || barn.capacity === 0 || barn.animals.length >= barn.capacity || data.money < a.buyPrice) return data
  return { ...data, money: data.money - a.buyPrice, barn: { ...barn, animals: [...barn.animals, { id: `prev-${now}`, animalId, fedAt: null }] } }
}

// Dá ração aos com fome, do mais antigo ao mais novo, enquanto houver
export function feedAnimals(data: SaveData, now: number): SaveData {
  let inventory = data.inventory
  let fedAny = false
  const animals = data.barn.animals.map((owned) => {
    const a = animalById(owned.animalId)
    if (owned.fedAt !== null || !a || (inventory[a.feedItemId] ?? 0) < a.feedQuantity) return owned
    inventory = take(inventory, a.feedItemId, a.feedQuantity)
    fedAny = true
    return { ...owned, fedAt: now }
  })
  return fedAny ? { ...data, inventory, barn: { ...data.barn, animals } } : data
}

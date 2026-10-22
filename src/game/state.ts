import { DAY_LENGTH, DAY_START } from './daycycle'
import { CROPS, isCropId, type CropId } from './crops'
import { FRUIT_REGROW_MS, FRUITS, FRUITS_PER_HARVEST, TREES, type FruitId } from './trees'
import type { SaveData, Tile } from './types'

// Funções puras: recebem o estado e devolvem um estado novo, sem mexer em canvas, React ou API.

export const GRID_SIZE = 10

const TILLED: Tile = { state: 'tilled', crop: null, growth: 0 }

// Clique num tile: terra -> arada -> plantada -> (madura) colhe e volta a ficar arada
export function clickTile(data: SaveData, row: number, col: number, seed: CropId): SaveData {
  const tile = data.grid[row]?.[col]
  if (!tile) return data

  let newTile: Tile
  let money = data.money
  let inventory = data.inventory

  if (tile.state === 'soil') {
    newTile = { ...tile, state: 'tilled' }
  } else if (tile.state === 'tilled') {
    if ((inventory[seed] ?? 0) < 1) return data // sem semente, não planta
    inventory = { ...inventory, [seed]: inventory[seed] - 1 }
    newTile = { state: 'planted', crop: seed, growth: 0 }
  } else {
    if (!isCropId(tile.crop) || tile.growth < CROPS[tile.crop].growTicks) return data // ainda crescendo
    money += CROPS[tile.crop].sellPrice
    newTile = TILLED
  }

  return { ...data, grid: replaceTile(data.grid, row, col, newTile), money, inventory }
}

// Loja: compra `qty` sementes; se o dinheiro não dá para tudo, compra só as que dá
export function buySeed(data: SaveData, crop: CropId, qty = 1): SaveData {
  const price = CROPS[crop].seedPrice
  const n = Math.min(qty, Math.floor(data.money / price))
  if (n < 1) return data
  return {
    ...data,
    money: data.money - price * n,
    inventory: { ...data.inventory, [crop]: (data.inventory[crop] ?? 0) + n },
  }
}

// Árvore com frutas: nunca colhida, ou colhida há mais de 1 hora
export function treeHasFruit(data: SaveData, treeId: string, now: number): boolean {
  const last = data.trees?.[treeId]
  return last === undefined || now - last >= FRUIT_REGROW_MS
}

// Ids das árvores com frutas agora
export function readyTreeIds(data: SaveData, now: number): string[] {
  return TREES.filter((t) => treeHasFruit(data, t.id, now)).map((t) => t.id)
}

// Colhe as frutas de uma árvore: vão para o inventário e a árvore só repõe daqui a 1 hora
export function harvestTree(data: SaveData, treeId: string, now: number): SaveData {
  const tree = TREES.find((t) => t.id === treeId)
  if (!tree || !treeHasFruit(data, treeId, now)) return data
  return {
    ...data,
    inventory: { ...data.inventory, [tree.fruit]: (data.inventory[tree.fruit] ?? 0) + FRUITS_PER_HARVEST },
    trees: { ...data.trees, [treeId]: now },
  }
}

// Vende `qty` frutas do inventário (ou todas, se qty não for informado)
export function sellFruit(data: SaveData, fruit: FruitId, qty?: number): SaveData {
  const have = data.inventory[fruit] ?? 0
  const n = Math.min(qty ?? have, have)
  if (n < 1) return data
  return {
    ...data,
    money: data.money + FRUITS[fruit].sellPrice * n,
    inventory: { ...data.inventory, [fruit]: have - n },
  }
}


// Como o clique age: só no tile, ou em toda a linha / coluna dele
export type ClickMode = 'tile' | 'row' | 'col'

// Ação em massa: repete o clique em todos os tiles da linha (ou coluna) que estão no
// mesmo estado do tile clicado. Se as sementes acabam, o resto da linha fica como está.
export function clickLine(data: SaveData, mode: 'row' | 'col', row: number, col: number, seed: CropId): SaveData {
  const clicked = data.grid[row]?.[col]
  if (!clicked) return data
  let result = data
  for (let i = 0; i < GRID_SIZE; i++) {
    const r = mode === 'row' ? row : i
    const c = mode === 'row' ? i : col
    if (result.grid[r][c].state === clicked.state) result = clickTile(result, r, c, seed)
  }
  return result
}

// Tiles afetados por um clique (usado para destacar a linha no desenho)
export function tilesInMode(mode: ClickMode, row: number, col: number) {
  if (mode === 'tile') return [{ row, col }]
  return Array.from({ length: GRID_SIZE }, (_, i) => (mode === 'row' ? { row, col: i } : { row: i, col }))
}

// Passa 1 tick: toda planta cresce 1 (até ficar madura) e o relógio do dia avança.
// Ao fim do dia (depois da noite) amanhece e o contador de dias sobe.
export function tick(data: SaveData): SaveData {
  let changed = false
  const grid = data.grid.map((row) =>
    row.map((tile) => {
      if (tile.state !== 'planted' || !isCropId(tile.crop)) return tile
      if (tile.growth >= CROPS[tile.crop].growTicks) return tile
      changed = true
      return { ...tile, growth: tile.growth + 1 }
    }),
  )
  const time = data.time + 1
  const newDay = time >= DAY_LENGTH
  return {
    ...data,
    grid: changed ? grid : data.grid, // mesma grade = o mapa não precisa ser redesenhado
    time: newDay ? 0 : time,
    day: newDay ? data.day + 1 : data.day,
  }
}

// Saves antigos usavam "wheat" (trigo); hoje a planta inicial é o milho
export function migrateSave(data: SaveData): SaveData {
  const rename = (crop: string | null) => (crop === 'wheat' ? 'corn' : crop)
  const inventory = { ...data.inventory }
  if ('wheat' in inventory) {
    inventory.corn = (inventory.corn ?? 0) + inventory.wheat
    delete inventory.wheat
  }
  const grid = data.grid.map((row) => row.map((t) => ({ ...t, crop: rename(t.crop) })))
  return { ...data, inventory, grid, trees: data.trees ?? {}, time: data.time ?? DAY_START }
}

function replaceTile(grid: Tile[][], row: number, col: number, tile: Tile): Tile[][] {
  return grid.map((r, i) => (i === row ? r.map((t, j) => (j === col ? tile : t)) : r))
}

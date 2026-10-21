import { CROPS, isCropId, type CropId } from './crops'
import type { SaveData, Tile } from './types'

// Funções puras: recebem o estado e devolvem um estado novo, sem mexer em canvas, React ou API.

export const GRID_SIZE = 10

const SOIL: Tile = { state: 'soil', crop: null, growth: 0 }

// Clique num tile: terra -> arada -> plantada -> (madura) colhe e volta a ser terra
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
    newTile = SOIL
  }

  return { ...data, grid: replaceTile(data.grid, row, col, newTile), money, inventory }
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

// Passa 1 tick: toda planta cresce 1, até ficar madura
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
  return changed ? { ...data, grid } : data
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
  return { ...data, inventory, grid }
}

function replaceTile(grid: Tile[][], row: number, col: number, tile: Tile): Tile[][] {
  return grid.map((r, i) => (i === row ? r.map((t, j) => (j === col ? tile : t)) : r))
}

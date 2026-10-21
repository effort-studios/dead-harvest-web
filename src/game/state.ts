import type { SaveData, Tile } from './types'

// Funções puras: recebem o estado e devolvem um estado novo, sem mexer em canvas, React ou API.

export const GRID_SIZE = 10

// Provisório: o item 4 define o preço de cada planta
const HARVEST_REWARD = 10
const SEED = 'wheat'

const SOIL: Tile = { state: 'soil', crop: null, growth: 0 }

// Clique num tile: terra -> arada -> plantada -> (colhe) terra
export function clickTile(data: SaveData, row: number, col: number): SaveData {
  const tile = data.grid[row]?.[col]
  if (!tile) return data

  let newTile: Tile = tile
  let money = data.money
  let inventory = data.inventory

  if (tile.state === 'soil') {
    newTile = { ...tile, state: 'tilled' }
  } else if (tile.state === 'tilled') {
    if ((inventory[SEED] ?? 0) < 1) return data // sem semente, não planta
    inventory = { ...inventory, [SEED]: inventory[SEED] - 1 }
    newTile = { state: 'planted', crop: SEED, growth: 0 }
  } else {
    money += HARVEST_REWARD
    newTile = SOIL
  }

  const grid = data.grid.map((r, i) =>
    i === row ? r.map((t, j) => (j === col ? newTile : t)) : r,
  )
  return { ...data, grid, money, inventory }
}

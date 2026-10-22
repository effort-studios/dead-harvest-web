import { dayLengthSeconds } from './daycycle'
import { CROP_ORDER, CROPS, isCropId, type CropId } from './crops'
import { FRUITS, TREES, type FruitId } from './trees'
import type { Plot, SaveData, Tile } from './types'

// Funções puras: recebem o estado e devolvem um estado novo, sem mexer em canvas, React ou API.
// Quem manda é o servidor: estas funções só PREVEEM o resultado de uma ação para a tela responder na
// hora; logo depois chega o estado de verdade da API e substitui a previsão (veja store/gameStore.ts).

export const GRID_SIZE = 10
// Distância entre terrenos vizinhos em tiles: ficam colados
export const PLOT_STEP = GRID_SIZE

// Preço dos terrenos (regra do servidor, vem do catálogo)
const plotRule = { base: 0, factor: 1 }
export function setPlotPrice(rule: { base: number; factor: number }) {
  Object.assign(plotRule, rule)
}

const TILLED: Tile = { state: 'tilled', crop: null, growth: 0 }

// Clique num tile: terra -> arada -> plantada -> (madura) colhe e volta a ficar arada
function clickTile(data: SaveData, plot: number, row: number, col: number, seed: CropId): SaveData {
  const tile = data.plots[plot]?.grid[row]?.[col]
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
    if (!isCropId(tile.crop) || tile.growth < CROPS[tile.crop].growSeconds) return data // ainda crescendo
    money += CROPS[tile.crop].sellPrice
    newTile = TILLED
  }

  return { ...data, plots: replacePlotGrid(data.plots, plot, replaceTile(data.plots[plot].grid, row, col, newTile)), money, inventory }
}

// Sementes que o jogador tem (quantidade > 0), na ordem da loja: são as que aparecem na barra de itens
export function ownedSeeds(inventory: Record<string, number>): CropId[] {
  return CROP_ORDER.filter((id) => (inventory[id] ?? 0) > 0)
}

// Mantém a semente escolhida se ainda houver dela; senão passa para a primeira que o jogador tem
export function pickSeed(inventory: Record<string, number>, current: CropId): CropId {
  return (inventory[current] ?? 0) > 0 ? current : (ownedSeeds(inventory)[0] ?? current)
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

// Preço do próximo terreno (sobe a cada terreno comprado)
export function plotPrice(data: SaveData): number {
  return Math.round(plotRule.base * plotRule.factor ** (data.plots.length - 1))
}

// Posições livres ao lado (4 direções) de algum terreno que o jogador já tem
export function freeSlots(data: SaveData): { x: number; y: number }[] {
  const taken = new Set(data.plots.map((p) => `${p.x},${p.y}`))
  const free = new Map<string, { x: number; y: number }>()
  for (const { x, y } of data.plots) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = `${x + dx},${y + dy}`
      if (!taken.has(key)) free.set(key, { x: x + dx, y: y + dy })
    }
  }
  return [...free.values()]
}

// Compra um terreno vazio numa posição livre, se o jogador tiver dinheiro
export function buyPlot(data: SaveData, x: number, y: number): SaveData {
  const price = plotPrice(data)
  if (data.money < price || !freeSlots(data).some((s) => s.x === x && s.y === y)) return data
  const grid = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ state: 'soil' as const, crop: null, growth: 0 })),
  )
  return { ...data, money: data.money - price, plots: [...data.plots, { x, y, grid }] }
}

// Tile global (contando todos os terrenos) -> posição do terreno e tile local
export function plotCell(row: number, col: number) {
  const x = Math.floor(col / PLOT_STEP)
  const y = Math.floor(row / PLOT_STEP)
  return { x, y, row: row - y * PLOT_STEP, col: col - x * PLOT_STEP }
}

// Árvore com frutas: nunca colhida, ou colhida há mais tempo que a rebrota. `now` é o relógio do servidor.
export function treeHasFruit(data: SaveData, treeId: string, now: number): boolean {
  const tree = TREES.find((t) => t.id === treeId)
  const last = data.trees[treeId]
  return !!tree && (last === undefined || now - last >= tree.regrowMs)
}

// Ids das árvores com frutas agora
export function readyTreeIds(data: SaveData, now: number): string[] {
  return TREES.filter((t) => treeHasFruit(data, t.id, now)).map((t) => t.id)
}

// Colhe as frutas de uma árvore: vão para o inventário e a árvore só repõe depois da rebrota
export function harvestTree(data: SaveData, treeId: string, now: number): SaveData {
  const tree = TREES.find((t) => t.id === treeId)
  if (!tree || !treeHasFruit(data, treeId, now)) return data
  return {
    ...data,
    inventory: { ...data.inventory, [tree.fruit]: (data.inventory[tree.fruit] ?? 0) + tree.fruitsPerHarvest },
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

export type TileAction = 'till' | 'plant' | 'harvest'
export type TileCommand = { action: TileAction; plot: number; tiles: { row: number; col: number }[] }

// O que um clique pede ao servidor: a ação vem do estado do tile clicado (terra = arar, arado = plantar,
// plantado = colher) e vale para os tiles do modo (tile, linha ou coluna) que estão no mesmo estado.
// null = nada a fazer (ex.: planta ainda verde).
export function tileCommand(data: SaveData, plot: number, row: number, col: number, mode: ClickMode): TileCommand | null {
  const grid = data.plots[plot]?.grid
  const clicked = grid?.[row]?.[col]
  if (!clicked) return null
  const ripe = (t: Tile) => isCropId(t.crop) && t.growth >= CROPS[t.crop].growSeconds
  if (clicked.state === 'planted' && !ripe(clicked)) return null
  const tiles = tilesInMode(mode, row, col).filter(({ row: r, col: c }) => {
    const t = grid[r][c]
    return t.state === clicked.state && (t.state !== 'planted' || ripe(t))
  })
  const action: TileAction = clicked.state === 'soil' ? 'till' : clicked.state === 'tilled' ? 'plant' : 'harvest'
  return { action, plot, tiles }
}

// Previsão de uma ação em tiles: aplica o clique em cada um, na ordem (se as sementes acabam, o resto fica)
export function applyTileCommand(data: SaveData, cmd: TileCommand, seed: CropId): SaveData {
  return cmd.tiles.reduce((d, t) => clickTile(d, cmd.plot, t.row, t.col, seed), data)
}

// Tiles afetados por um clique (usado para destacar a linha no desenho)
export function tilesInMode(mode: ClickMode, row: number, col: number) {
  if (mode === 'tile') return [{ row, col }]
  return Array.from({ length: GRID_SIZE }, (_, i) => (mode === 'row' ? { row, col: i } : { row: i, col }))
}

// Passa 1 segundo na tela, entre um estado do servidor e outro: toda planta cresce 1 (até ficar
// madura) e o relógio do dia avança. Ao fim do dia (depois da noite) amanhece e o contador de dias sobe.
export function tick(data: SaveData): SaveData {
  let changed = false
  const plots = data.plots.map((plot) => ({
    ...plot,
    grid: plot.grid.map((row) =>
      row.map((tile) => {
        if (tile.state !== 'planted' || !isCropId(tile.crop)) return tile
        if (tile.growth >= CROPS[tile.crop].growSeconds) return tile
        changed = true
        return { ...tile, growth: tile.growth + 1 }
      }),
    ),
  }))
  const time = data.time + 1
  const newDay = time >= dayLengthSeconds()
  return {
    ...data,
    plots: changed ? plots : data.plots, // mesmos terrenos = o mapa não precisa ser redesenhado
    time: newDay ? 0 : time,
    day: newDay ? data.day + 1 : data.day,
  }
}

function replacePlotGrid(plots: Plot[], index: number, grid: Tile[][]): Plot[] {
  return plots.map((p, i) => (i === index ? { ...p, grid } : p))
}

function replaceTile(grid: Tile[][], row: number, col: number, tile: Tile): Tile[][] {
  return grid.map((r, i) => (i === row ? r.map((t, j) => (j === col ? tile : t)) : r))
}

import { dayLengthSeconds } from './daycycle'
import { CROP_ORDER, CROPS, formatDuration, isCropId, type CropId } from './crops'
import { buildingAreas, FERTILIZER, footprint, growthRate, ITEMS, overlaps, type BuildingRef } from './production'
import { TREES } from './trees'
import type { SaveData, Tile } from './types'

// Funções puras: recebem o estado e devolvem um estado novo, sem mexer em canvas, React ou API.
// Quem manda é o servidor: estas funções só PREVEEM o resultado de uma ação para a tela responder na
// hora; logo depois chega o estado de verdade da API e substitui a previsão (veja features/farm/store.ts).

export const GRID_SIZE = 10
// Distância entre terrenos vizinhos em tiles: ficam colados
export const PLOT_STEP = GRID_SIZE

// Preço dos terrenos (regra do servidor, vem do catálogo)
const plotRule = { base: 0, factor: 1 }
export function setPlotPrice(rule: { base: number; factor: number }) {
  Object.assign(plotRule, rule)
}

// O que vai na barra de itens: uma semente ou o adubo
// Item da barra: semente, adubo ou regador
export type HotbarItem = CropId | 'fertilizer' | 'can'
type HotbarData = Pick<SaveData, 'inventory' | 'canCharges'>

// Sementes que o jogador tem (quantidade > 0), na ordem da loja, o adubo e o regador (comprado, mesmo vazio)
// no fim: é o que aparece na barra
export function hotbarItems(data: HotbarData): HotbarItem[] {
  const items: HotbarItem[] = CROP_ORDER.filter((id) => (data.inventory[id] ?? 0) > 0)
  if ((data.inventory[FERTILIZER.itemId] ?? 0) > 0) items.push('fertilizer')
  if (data.canCharges !== null) items.push('can')
  return items
}

// Quantidade de um item da barra (do regador, as cargas)
export const hotbarCount = (data: HotbarData, item: HotbarItem) =>
  item === 'can' ? (data.canCharges ?? 0) : (data.inventory[item === 'fertilizer' ? FERTILIZER.itemId : item] ?? 0)

// Mantém o item escolhido se ainda estiver na barra; senão passa para o primeiro
export function pickItem(data: HotbarData, current: HotbarItem): HotbarItem {
  return hotbarItems(data).includes(current) ? current : (hotbarItems(data)[0] ?? current)
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
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const key = `${x + dx},${y + dy}`
      if (!taken.has(key)) free.set(key, { x: x + dx, y: y + dy })
    }
  }
  return [...free.values()]
}

// Tile do mapa na célula global (r, c), se ela cai num terreno do jogador
function tileAtCell(data: SaveData, r: number, c: number): Tile | undefined {
  const { x, y, row, col } = plotCell(r, c)
  return data.plots.find((p) => p.x === x && p.y === y)?.grid[row][col]
}

// Pode pôr o prédio em (r, c)? Só dentro dos terrenos do jogador (pode passar de um para o vizinho), em chão
// sem terra arada e sem outro prédio. Devolve o motivo de não poder (o mesmo texto do servidor) ou null.
export function placementProblem(data: SaveData, b: BuildingRef, r: number, c: number): string | null {
  const area = footprint(b, r, c)
  const tiles: (Tile | undefined)[] = []
  for (let row = area.r0; row <= area.r1; row++) for (let col = area.c0; col <= area.c1; col++) tiles.push(tileAtCell(data, row, col))
  if (tiles.some((t) => !t)) return 'Construa dentro dos seus terrenos'
  if (tiles.some((t) => t!.state !== 'soil')) return 'Tem terra arada aí: o prédio precisa de chão livre'
  if (buildingAreas(data, b).some((o) => overlaps(area, o))) return 'Tem outro prédio aí'
  return null
}

// Células (r, c) do mapa embaixo de algum prédio, como "r,c" (lá não se ara)
export function builtCells(data: SaveData): Set<string> {
  const cells = new Set<string>()
  for (const a of buildingAreas(data)) for (let r = a.r0; r <= a.r1; r++) for (let c = a.c0; c <= a.c1; c++) cells.add(`${r},${c}`)
  return cells
}

// Compra um terreno vazio numa posição livre, se o jogador tiver dinheiro
export function buyPlot(data: SaveData, x: number, y: number): SaveData {
  const price = plotPrice(data)
  if (data.money < price || !freeSlots(data).some((s) => s.x === x && s.y === y)) return data
  const grid = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ state: 'soil' as const, crop: null, growth: 0, fertilized: false, watered: false })),
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

// Vende `qty` de um item do armazém (ou todos, se qty não for informado)
export function sellItem(data: SaveData, itemId: string, qty?: number): SaveData {
  const price = ITEMS[itemId]?.sellPrice
  const have = data.inventory[itemId] ?? 0
  const n = Math.min(qty ?? have, have)
  if (price == null || n < 1) return data
  return {
    ...data,
    money: data.money + price * n,
    inventory: { ...data.inventory, [itemId]: have - n },
  }
}

// Como o clique age: só no tile, ou em toda a linha / coluna dele
export type ClickMode = 'tile' | 'row' | 'col'

export type TileAction = 'till' | 'untill' | 'plant' | 'harvest' | 'fertilize' | 'water'
export type TileCommand = { action: TileAction; plot: number; tiles: { row: number; col: number }[] }

// O que um clique pede ao servidor: a ação vem do estado do tile clicado (terra = arar, arado = plantar,
// plantado = colher) e vale para os tiles do modo (tile, linha ou coluna) que estão no mesmo estado.
// Com o adubo ou o regador escolhido na barra, clicar na terra arada ou numa planta crescendo aduba ou rega
// (só os tiles ainda sem); planta madura continua sendo colhida.
// null = nada a fazer (ex.: planta ainda verde).
export function tileCommand(data: SaveData, plot: number, row: number, col: number, mode: ClickMode, selected?: HotbarItem): TileCommand | null {
  const grid = data.plots[plot]?.grid
  const clicked = grid?.[row]?.[col]
  if (!clicked) return null
  const ripe = (t: Tile) => isCropId(t.crop) && t.growth >= CROPS[t.crop].growSeconds
  const tool = selected === 'fertilizer' || selected === 'can' ? selected : null
  if (tool && clicked.state !== 'soil' && !ripe(clicked)) {
    const lacking = (t: Tile) => t.state !== 'soil' && !ripe(t) && !(tool === 'can' ? t.watered : t.fertilized)
    const tiles = tilesInMode(mode, row, col).filter(({ row: r, col: c }) => lacking(grid[r][c]))
    return tiles.length > 0 ? { action: tool === 'can' ? 'water' : 'fertilize', plot, tiles } : null
  }
  if (clicked.state === 'planted' && !ripe(clicked)) return null
  // embaixo de prédio não se ara
  const built = builtCells(data)
  const { x, y } = data.plots[plot]
  const tiles = tilesInMode(mode, row, col).filter(({ row: r, col: c }) => {
    const t = grid[r][c]
    if (t.state === 'soil' && built.has(`${y * PLOT_STEP + r},${x * PLOT_STEP + c}`)) return false
    return t.state === clicked.state && (t.state !== 'planted' || ripe(t))
  })
  if (tiles.length === 0) return null
  const action: TileAction = clicked.state === 'soil' ? 'till' : clicked.state === 'tilled' ? 'plant' : 'harvest'
  return { action, plot, tiles }
}

// Tudo que está pronto para colher: plantas maduras (por terreno) e árvores com frutas. Ignora o que o
// fazendeiro já tem na fila para não pedir duas vezes.
export function harvestables(data: SaveData, now: number): { plots: TileCommand[]; trees: string[] } {
  const queued = data.farmer.jobs
  const plots: TileCommand[] = []
  data.plots.forEach((plot, i) => {
    const tiles: { row: number; col: number }[] = []
    plot.grid.forEach((line, row) =>
      line.forEach((t, col) => {
        const ripe = t.state === 'planted' && isCropId(t.crop) && t.growth >= CROPS[t.crop].growSeconds
        const taken = queued.some((j) => j.action === 'harvest' && j.plotX === plot.x && j.plotY === plot.y && j.row === row && j.col === col)
        if (ripe && !taken) tiles.push({ row, col })
      }),
    )
    if (tiles.length > 0) plots.push({ action: 'harvest', plot: i, tiles })
  })
  const trees = readyTreeIds(data, now).filter((id) => !queued.some((j) => j.action === 'harvest_tree' && j.treeId === id))
  return { plots, trees }
}

// Tiles afetados por um clique (usado para destacar a linha no desenho)
export function tilesInMode(mode: ClickMode, row: number, col: number) {
  if (mode === 'tile') return [{ row, col }]
  return Array.from({ length: GRID_SIZE }, (_, i) => (mode === 'row' ? { row, col: i } : { row: i, col }))
}

// Passa 1 segundo na tela, entre um estado do servidor e outro: toda planta cresce (mais rápido com adubo e
// água, até ficar madura) e o relógio do dia avança. Ao fim do dia (depois da noite) amanhece e o contador de dias sobe.
export function tick(data: SaveData): SaveData {
  let changed = false
  const plots = data.plots.map((plot) => ({
    ...plot,
    grid: plot.grid.map((row) =>
      row.map((tile) => {
        if (tile.state !== 'planted' || !isCropId(tile.crop)) return tile
        if (tile.growth >= CROPS[tile.crop].growSeconds) return tile
        changed = true
        return { ...tile, growth: tile.growth + growthRate(tile) }
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

// Item do menu que abre ao clicar num tile: o que dá para fazer ali. `disabled` é o motivo de não poder agora
// (o item aparece apagado, com o motivo na dica).
export type MenuItem = { action: TileAction; label: string; crop?: CropId; disabled?: string }

export function tileMenu(
  data: SaveData,
  plot: number,
  row: number,
  col: number,
  selected: HotbarItem,
): { title: string; subtitle?: string; items: MenuItem[] } | null {
  const tile = data.plots[plot]?.grid[row]?.[col]
  if (!tile) return null
  const planted = tile.state === 'planted' && isCropId(tile.crop)
  const ripe = planted && tile.growth >= CROPS[tile.crop as CropId].growSeconds
  const items: MenuItem[] = []

  const { x, y } = data.plots[plot]
  if (tile.state === 'soil') {
    const built = builtCells(data).has(`${y * PLOT_STEP + row},${x * PLOT_STEP + col}`)
    items.push({ action: 'till', label: 'Arar', disabled: built ? 'Tem um prédio aí' : undefined })
  } else if (tile.state === 'tilled') {
    // a semente escolhida na barra; sem uma escolhida, a primeira que o jogador tem
    const crop = isCropId(selected) ? selected : CROP_ORDER.find((id) => (data.inventory[id] ?? 0) > 0)
    items.push(
      crop
        ? { action: 'plant', label: `Plantar ${CROPS[crop].name.toLowerCase()}`, crop, disabled: (data.inventory[crop] ?? 0) < 1 ? 'Sem sementes' : undefined }
        : { action: 'plant', label: 'Plantar', disabled: 'Sem sementes: compre na loja' },
    )
  } else if (ripe) {
    items.push({ action: 'harvest', label: 'Colher' })
  }

  // adubo e regador valem na terra arada e na planta ainda crescendo
  if (tile.state !== 'soil' && !ripe) {
    if ((data.inventory[FERTILIZER.itemId] ?? 0) > 0 || tile.fertilized)
      items.push({ action: 'fertilize', label: 'Adubar', disabled: tile.fertilized ? 'Já está adubado' : undefined })
    if (data.canCharges !== null)
      items.push({
        action: 'water',
        label: 'Regar',
        disabled: tile.watered ? 'Já está regado' : data.canCharges < 1 ? 'O regador está vazio: encha no poço' : undefined,
      })
  }
  // terra arada e vazia volta a ser terra
  if (tile.state === 'tilled') items.push({ action: 'untill', label: 'Desfazer aragem' })

  const title = planted ? CROPS[tile.crop as CropId].name : tile.state === 'tilled' ? 'Terra arada' : 'Terra'
  // planta: quanto falta (a mesma informação do balão do mouse, que no celular não existe)
  let subtitle: string | undefined
  if (planted) {
    const left = Math.ceil(Math.max(0, CROPS[tile.crop as CropId].growSeconds - tile.growth) / growthRate(tile))
    subtitle = ripe ? 'pronta para colher!' : `falta ${formatDuration(left)}`
  }
  return { title, subtitle, items }
}

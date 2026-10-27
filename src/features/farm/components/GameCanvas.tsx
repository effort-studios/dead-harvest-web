import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildingAt,
  buildingCellAt,
  clampCamera,
  drawWorld,
  fitZoom,
  INITIAL_CAMERA,
  screenToWorld,
  tileFromWorld,
  treeAt,
  yardView,
  type BuildingGhost,
  type Hover,
  type Size,
  type YardBuilding,
} from '@/features/farm/render/draw'
import { freeSlots, placementProblem, plotCell, type ClickMode } from '@/features/farm/model/state'
import { buildingPos, growthRate, machineById } from '@/features/farm/model/production'
import { CROPS, formatDuration, isCropId } from '@/features/farm/model/crops'
import { farmerPose, type Pose } from '@/features/farm/model/farmer'
import { useProfileStore } from '@/features/profile/store'
import { skyTint } from '@/features/farm/model/daycycle'
import { loadSprites, type Sprites } from '@/features/farm/render/sprites'
import { serverNow, useFarmStore } from '../store'

// Shift = ação na linha inteira, Ctrl = na coluna inteira, nenhum = só no tile
function modeOf(e: { shiftKey: boolean; ctrlKey: boolean }): ClickMode {
  return e.shiftKey ? 'row' : e.ctrlKey ? 'col' : 'tile'
}

// Zoom do jogador (multiplica o zoom que ajusta o mapa à janela) e seus limites
const MIN_USER_ZOOM = 0.5
const MAX_USER_ZOOM = 3
const WHEEL_SENSITIVITY = 0.0015

// Movimento menor que isso (em px) conta como clique; maior, como arrasto (do mapa ou do prédio comprado
// que estava sob o mouse)
const DRAG_THRESHOLD = 5

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const plots = useFarmStore((s) => s.data?.plots)
  const buyingPlot = useFarmStore((s) => s.buyingPlot)
  const readyTrees = useFarmStore((s) => s.readyTrees)
  const readyBuildings = useFarmStore((s) => s.readyBuildings)
  const machines = useFarmStore((s) => s.data?.machines)
  const barn = useFarmStore((s) => s.data?.barn)
  const placing = useFarmStore((s) => s.placing)
  const animating = useFarmStore((s) => (s.data?.farmer.jobs.length ?? 0) > 0) // há fila: o personagem se mexe
  const time = useFarmStore((s) => s.data?.time ?? 0)
  const [sprites, setSprites] = useState<Sprites | null>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })
  const [tipTile, setTipTile] = useState<TileRef | null>(null) // tile sob o mouse (o balão mostra a planta dele)
  const tipRef = useRef<HTMLDivElement>(null)

  // A câmera fica num ref (e não em state) para arrastar não re-renderizar o React a cada pixel
  const camera = useRef({ ...INITIAL_CAMERA })
  // building: começou em cima de um prédio comprado; offset = célula do prédio - célula sob o mouse no começo
  // (o prédio não pula para o ponteiro)
  const drag = useRef<{
    startX: number
    startY: number
    camX: number
    camY: number
    moved: boolean
    building: { target: YardBuilding; dr: number; dc: number } | null
  } | null>(null)
  // Prévia do prédio: o que está sendo arrastado ou o escolhido na loja para construir; onde ele ficaria e se pode
  const ghost = useRef<BuildingGhost | null>(null)
  const dragging = useRef(false) // a prévia é de um arrasto (soltar move o prédio)
  const userZoom = useRef(1) // controlado pela roda do mouse
  const frame = useRef(0)
  const hover = useRef<Hover | null>(null) // o que está sob o mouse
  const treeHover = useRef<string | null>(null) // árvore com frutas sob o mouse (vira cursor de mãozinha)
  const buildingHover = useRef<YardBuilding | null>(null) // prédio (ou lote à venda) sob o mouse
  const mode = useRef<ClickMode>('tile') // alterado por Shift/Ctrl
  const drawRef = useRef<() => void>(() => {})
  const facing = useRef<Pose['facing']>({ dr: 1, dc: 0 }) // para onde o fazendeiro olhava na última vez que se mexeu

  useEffect(() => {
    loadSprites().then(setSprites)
  }, [])

  // O canvas sempre tem o tamanho da área do jogo (acompanha a janela)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setSize({ width: el.clientWidth, height: el.clientHeight }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const { data, buyingPlot } = useFarmStore.getState()
    if (!canvas || !ctx || !sprites || !data || size.width === 0) return
    const dpr = window.devicePixelRatio || 1
    // só mexe no tamanho se mudou (mexer apaga o desenho)
    if (canvas.width !== Math.round(size.width * dpr) || canvas.height !== Math.round(size.height * dpr)) {
      canvas.width = Math.round(size.width * dpr)
      canvas.height = Math.round(size.height * dpr)
    }
    const { x, y } = camera.current
    const ready = new Set(readyTrees ? readyTrees.split(',') : [])
    const avatar = useProfileStore.getState().user?.avatar
    // O fazendeiro é do servidor: a pose sai dos horários da fila que ele mandou
    const pose = farmerPose(data.farmer, serverNow(), facing.current)
    if (pose.walking || pose.acting) facing.current = pose.facing
    const queued = data.farmer.jobs.filter((j) => j.row !== null).map((j) => ({ r: j.targetRow, c: j.targetCol }))
    drawWorld(
      ctx, sprites, data.plots, ready, { x, y, zoom: fitZoom(size) * userZoom.current }, size, dpr, hover.current,
      buyingPlot ? freeSlots(data) : [], avatar ? { pose, avatar, queued } : null,
      yardView(data, serverNow(), ghost.current), ghost.current?.target ?? buildingHover.current,
    )
  }, [sprites, size, readyTrees])

  // Redesenha quando os terrenos, os prédios, as imagens ou o tamanho da janela mudam
  useEffect(() => {
    hover.current = null
    draw()
  }, [draw, plots, buyingPlot, machines, barn, readyBuildings])

  // Escolheu (ou cancelou) um prédio na loja: a prévia aparece no próximo movimento do mouse
  useEffect(() => {
    if (dragging.current) return
    ghost.current = null
    drawRef.current()
  }, [placing])

  drawRef.current = draw

  // Com fila no servidor, redesenha a cada frame para o personagem andar suave; sem fila, não gasta nada
  useEffect(() => {
    if (!animating) return
    let id = 0
    const frameStep = () => {
      drawRef.current()
      id = requestAnimationFrame(frameStep)
    }
    id = requestAnimationFrame(frameStep)
    return () => cancelAnimationFrame(id)
  }, [animating])

  // Durante o arrasto, no máximo um desenho por frame da tela
  function scheduleDraw() {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => drawRef.current())
  }

  // Apertar ou soltar Shift/Ctrl com o mouse parado também muda o destaque
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        useFarmStore.getState().setBuyingPlot(false)
        useFarmStore.getState().startPlacing(null)
      }
      const next = modeOf(e)
      if (next === mode.current) return
      mode.current = next
      if (hover.current?.kind === 'tile') hover.current = { ...hover.current, mode: next }
      scheduleDraw()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ponto do mundo sob o mouse
  function worldAt(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const cam = { ...camera.current, zoom: fitZoom(size) * userZoom.current }
    return screenToWorld(e.clientX - rect.left, e.clientY - rect.top, cam, size)
  }

  // Prédio sob o ponto (fora da compra de terreno e da escolha de lugar para construir)
  function buildingUnder(wx: number, wy: number): YardBuilding | null {
    const { data, buyingPlot, placing } = useFarmStore.getState()
    if (!data || buyingPlot || placing) return null
    return buildingAt(wx, wy, yardView(data, serverNow()))
  }

  // Árvore com frutas sob o ponto (fora do modo de compra de terreno)
  function readyTreeAt(wx: number, wy: number): string | null {
    const { data, readyTrees, buyingPlot } = useFarmStore.getState()
    if (!data || buyingPlot) return null
    const tree = treeAt(wx, wy, data.plots)
    return tree && readyTrees.split(',').includes(tree) ? tree : null
  }

  // O que está sob o ponto: um terreno livre (na compra) ou um tile de um terreno
  function targetAt(wx: number, wy: number, newMode: ClickMode): Hover | null {
    const { data, buyingPlot } = useFarmStore.getState()
    if (!data) return null
    const t = tileFromWorld(wx, wy)
    const cell = plotCell(t.row, t.col)
    if (buyingPlot) {
      return freeSlots(data).some((s) => s.x === cell.x && s.y === cell.y) ? { kind: 'slot', x: cell.x, y: cell.y } : null
    }
    const plot = data.plots.findIndex((p) => p.x === cell.x && p.y === cell.y)
    return plot < 0 ? null : { kind: 'tile', plot, row: cell.row, col: cell.col, mode: newMode }
  }

  // Roda do mouse: zoom em direção ao cursor (o ponto do mapa sob o mouse fica parado na tela)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const rect = canvas!.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const fit = fitZoom(size)
      const oldZoom = fit * userZoom.current
      const next = Math.min(Math.max(userZoom.current * Math.exp(-e.deltaY * WHEEL_SENSITIVITY), MIN_USER_ZOOM), MAX_USER_ZOOM)
      if (next === userZoom.current) return
      const world = screenToWorld(sx, sy, { ...camera.current, zoom: oldZoom }, size)
      userZoom.current = next
      const zoom = fit * next
      camera.current = clampCamera(
        world.x - (sx - size.width / 2) / zoom,
        world.y - (sy - size.height / 2) / zoom,
        useFarmStore.getState().data?.plots ?? [],
      )
      scheduleDraw()
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  // Escolhendo onde construir: a prévia do prédio fica sob o mouse, verde onde pode e vermelha onde não
  function updatePlacing(e: React.PointerEvent<HTMLCanvasElement>) {
    const { data, placing } = useFarmStore.getState()
    if (!data || !placing) return
    const world = worldAt(e)
    const { r, c } = buildingCellAt(world.x, world.y, placing)
    const old = ghost.current
    if (old && old.r === r && old.c === c) return
    ghost.current = { target: placing, r, c, ok: placementProblem(data, placing, r, c) === null }
    e.currentTarget.style.cursor = 'crosshair'
    scheduleDraw()
  }

  function updateHover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (useFarmStore.getState().placing) return updatePlacing(e)
    const world = worldAt(e)
    const ready = readyTreeAt(world.x, world.y)
    const building = ready ? null : buildingUnder(world.x, world.y)
    const buildingChanged = JSON.stringify(building) !== JSON.stringify(buildingHover.current)
    if (ready !== treeHover.current || buildingChanged) {
      treeHover.current = ready
      buildingHover.current = building
      // prédio dá para arrastar (mãozinha de pegar); árvore só se clica
      e.currentTarget.style.cursor = ready ? 'pointer' : building ? 'grab' : ''
    }
    const newMode = modeOf(e)
    const next = ready || building ? null : targetAt(world.x, world.y, newMode) // sobre a árvore ou o prédio não destaca tile
    const old = hover.current
    const same =
      next?.kind === 'slot'
        ? old?.kind === 'slot' && old.x === next.x && old.y === next.y
        : next?.kind === 'tile'
          ? old?.kind === 'tile' && old.plot === next.plot && old.row === next.row && old.col === next.col && newMode === mode.current
          : old === null
    moveTip(e)
    if (same && !buildingChanged) return // nada mudou
    setTipTile(next?.kind === 'tile' ? { plot: next.plot, row: next.row, col: next.col } : null)
    hover.current = next
    mode.current = newMode
    scheduleDraw()
  }

  // Prédio sob o ponto, para arrastar: com a distância entre a célula dele e a que o mouse "segura" (assim ele
  // não pula para o ponteiro)
  function grabBuildingAt(wx: number, wy: number) {
    const { data } = useFarmStore.getState()
    const target = buildingUnder(wx, wy)
    const at = data && target && buildingPos(data, target)
    if (!target || !at) return null
    const cell = buildingCellAt(wx, wy, target)
    return { target, dr: at.r - cell.r, dc: at.c - cell.c }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId) // continua recebendo o mouse mesmo fora do canvas
    const world = worldAt(e)
    const building = readyTreeAt(world.x, world.y) ? null : grabBuildingAt(world.x, world.y)
    drag.current = { startX: e.clientX, startY: e.clientY, camX: camera.current.x, camY: camera.current.y, moved: false, building }
  }

  // Arrastando um prédio: ele segue o mouse de célula em célula
  function dragBuilding(e: React.PointerEvent<HTMLCanvasElement>, grab: { target: YardBuilding; dr: number; dc: number }) {
    const { data } = useFarmStore.getState()
    if (!data) return
    const world = worldAt(e)
    const cell = buildingCellAt(world.x, world.y, grab.target)
    const r = cell.r + grab.dr
    const c = cell.c + grab.dc
    const old = ghost.current
    if (old && old.r === r && old.c === c) return
    dragging.current = true
    ghost.current = { target: grab.target, r, c, ok: placementProblem(data, grab.target, r, c) === null }
    e.currentTarget.style.cursor = 'grabbing'
    scheduleDraw()
  }

  // O balão da planta acompanha o mouse (direto no estilo, sem re-renderizar o React a cada pixel)
  function moveTip(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    if (tipRef.current) tipRef.current.style.transform = `translate(${e.clientX - rect.left + 18}px, ${e.clientY - rect.top + 14}px)`
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = drag.current
    if (!d) {
      updateHover(e) // mouse solto: só atualiza o contorno do tile
      return
    }
    setTipTile(null) // arrastando: sem balão
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    d.moved = true
    if (d.building) {
      dragBuilding(e, d.building)
      return
    }
    // arrastar o mapa para a direita = câmera vai para a esquerda
    const zoom = fitZoom(size) * userZoom.current
    camera.current = { ...clampCamera(d.camX - dx / zoom, d.camY - dy / zoom, useFarmStore.getState().data?.plots ?? []) }
    if (useFarmStore.getState().placing) updatePlacing(e) // a prévia acompanha o mouse enquanto o mapa anda
    scheduleDraw()
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = drag.current
    drag.current = null
    if (dragging.current && ghost.current) {
      // soltou o prédio: o store confere o lugar (e avisa se não pode); a tela volta ao normal
      const dropped = ghost.current
      ghost.current = null
      dragging.current = false
      e.currentTarget.style.cursor = ''
      useFarmStore.getState().moveBuilding(dropped.target, dropped.r, dropped.c)
      scheduleDraw()
      return
    }
    if (!d || d.moved) return // foi um arrasto, não um clique
    if (useFarmStore.getState().placing) {
      // clicou onde construir: o store confere o lugar (e avisa se não pode, continuando a escolha)
      updatePlacing(e)
      if (ghost.current) useFarmStore.getState().placeBuilding(ghost.current.r, ghost.current.c)
      return
    }
    const world = worldAt(e)
    const tree = readyTreeAt(world.x, world.y)
    if (tree) {
      useFarmStore.getState().queueTree(tree)
      return
    }
    const building = buildingUnder(world.x, world.y)
    if (building) {
      useFarmStore.getState().openBuilding(building)
      return
    }
    const target = targetAt(world.x, world.y, modeOf(e))
    if (target?.kind === 'slot') useFarmStore.getState().buyPlot(target.x, target.y)
    else if (target) useFarmStore.getState().queueTiles(target.plot, target.row, target.col, target.mode)
  }

  return (
    <div ref={containerRef} className="map-area">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null
          if (dragging.current) ghost.current = null
          dragging.current = false
          scheduleDraw()
        }}
        onPointerLeave={() => {
          setTipTile(null)
          hover.current = null
          buildingHover.current = null
          if (!dragging.current) ghost.current = null // a prévia de construir some fora do mapa
          scheduleDraw()
        }}
      />
      {/* sempre na tela (vazio sem planta) para o canvas poder mover antes do balão aparecer */}
      <div ref={tipRef} className="plant-tip-anchor">
        {tipTile && <PlantTip at={tipTile} />}
      </div>
      {placing && (
        <div className="place-hint">
          Clique no mapa onde construir {placing.kind === 'barn' ? 'o celeiro' : placing.kind === 'well' ? 'o poço' : machineById(placing.id)?.name.toLowerCase()} · verde
          pode, vermelho não · <button onClick={() => useFarmStore.getState().startPlacing(null)}>Cancelar (Esc)</button>
        </div>
      )}
      {/* Luz do dia: cobre só o mapa (a HUD fica de fora) e muda aos poucos com a hora */}
      <div className="sky-tint" style={{ backgroundColor: skyTint(time) }} />
    </div>
  )
}

type TileRef = { plot: number; row: number; col: number }

// Balão perto do mouse com a planta do tile e quanto falta para ela amadurecer (anda junto com o relógio da
// tela; com adubo, o tempo já conta a planta crescendo mais rápido). Tile sem planta não mostra nada.
function PlantTip({ at }: { at: TileRef }) {
  const tile = useFarmStore((s) => s.data?.plots[at.plot]?.grid[at.row]?.[at.col])
  if (tile?.state !== 'planted' || !isCropId(tile.crop)) return null
  const crop = CROPS[tile.crop]
  const left = Math.ceil(Math.max(0, crop.growSeconds - tile.growth) / growthRate(tile))
  const boosts = [tile.fertilized && 'adubada', tile.watered && 'regada'].filter(Boolean)
  const faster = Math.round((growthRate(tile) - 1) * 100)
  return (
    <div className="plant-tip">
      <b>{crop.name}</b>
      {left === 0 ? <span className="ready-text">pronta para colher!</span> : <span>falta {formatDuration(left)}</span>}
      {boosts.length > 0 && (
        <small>
          {boosts.join(' e ')} ({faster}% mais rápido)
        </small>
      )}
    </div>
  )
}

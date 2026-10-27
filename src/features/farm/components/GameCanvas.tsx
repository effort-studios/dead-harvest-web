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
import { freeSlots, placementProblem, plotCell, tileMenu, type ClickMode } from '@/features/farm/model/state'
import { buildingPos, growthRate, machineById } from '@/features/farm/model/production'
import { CROPS, formatDuration, isCropId } from '@/features/farm/model/crops'
import { FRUITS, TREES } from '@/features/farm/model/trees'
import { farmerPose, type Pose } from '@/features/farm/model/farmer'
import { useProfileStore } from '@/features/profile/store'
import { skyTint } from '@/features/farm/model/daycycle'
import { loadSprites, SCENE_FPS } from '@/features/farm/render/sprites'
import { loadFarmerSheet } from '@/features/farm/render/farmerSprite'
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

const moveTo = (row: number, col: number) => useFarmStore.getState().moveTo(Math.max(-100, Math.min(100, row)), Math.max(-100, Math.min(100, col)))

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
  const [sprites, setSprites] = useState(false) // imagens do mundo carregadas
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })
  const [tipTile, setTipTile] = useState<TileRef | null>(null) // tile sob o mouse (o balão mostra a planta dele)
  const tipRef = useRef<HTMLDivElement>(null)
  // Gestos de toque: dedos na tela, a pinça (zoom + arrastar com 2 dedos) e o balão de um toque, que some sozinho
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; zoom: number; world: { x: number; y: number } } | null>(null)
  const afterPinch = useRef(false) // depois da pinça, o dedo que sobra não vira clique nem arrasto
  const tipTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [tipTree, setTipTree] = useState<string | null>(null) // árvore sob o mouse (o balão mostra as frutas ou o tempo)
  const [menu, setMenu] = useState<MenuAt | null>(null) // menu do clique no chão

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
  const treeHover = useRef<string | null>(null) // árvore sob o mouse (ganha a marca no chão; com frutas, vira cursor de mãozinha)
  const buildingHover = useRef<YardBuilding | null>(null) // prédio (ou lote à venda) sob o mouse
  const mode = useRef<ClickMode>('tile') // alterado por Shift/Ctrl
  const drawRef = useRef<() => void>(() => {})
  const facing = useRef<Pose['facing']>({ dr: 1, dc: 0 }) // para onde o fazendeiro olhava na última vez que se mexeu

  useEffect(() => {
    Promise.all([loadSprites(), loadFarmerSheet()]).then(() => setSprites(true))
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
      ctx, data.plots, ready, { x, y, zoom: fitZoom(size) * userZoom.current }, size, dpr, hover.current,
      buyingPlot ? freeSlots(data) : [], avatar ? { pose, avatar, queued } : null,
      yardView(data, serverNow(), ghost.current), ghost.current?.target ?? buildingHover.current,
      { hover: treeHover.current, queued: data.farmer.jobs.filter((j) => j.treeId !== null).map((j) => j.treeId!) },
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

  // Com fila no servidor, redesenha a cada frame para o personagem andar suave. Sem fila, só no ritmo das
  // animações do cenário (moinho, animais...), que têm poucos quadros por segundo.
  useEffect(() => {
    if (!animating) {
      const id = setInterval(() => drawRef.current(), 1000 / SCENE_FPS)
      return () => clearInterval(id)
    }
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
        setMenu(null)
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

  // Árvore sob o ponto, com ou sem frutas (fora do modo de compra de terreno)
  function treeUnder(wx: number, wy: number): string | null {
    const { data, buyingPlot } = useFarmStore.getState()
    return !data || buyingPlot ? null : treeAt(wx, wy, data.plots)
  }

  // Árvore com frutas sob o ponto
  function readyTreeAt(wx: number, wy: number): string | null {
    const tree = treeUnder(wx, wy)
    return tree && useFarmStore.getState().readyTrees.split(',').includes(tree) ? tree : null
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
      setMenu(null)
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
    const tree = treeUnder(world.x, world.y)
    const ready = tree && readyTreeAt(world.x, world.y)
    const building = tree ? null : buildingUnder(world.x, world.y)
    const buildingChanged = JSON.stringify(building) !== JSON.stringify(buildingHover.current)
    const treeChanged = tree !== treeHover.current
    if (treeChanged || buildingChanged) {
      treeHover.current = tree
      buildingHover.current = building
      setTipTree(tree)
      // prédio dá para arrastar (mãozinha de pegar); árvore com frutas só se clica
      e.currentTarget.style.cursor = ready ? 'pointer' : building ? 'grab' : ''
    }
    const newMode = modeOf(e)
    const next = tree || building ? null : targetAt(world.x, world.y, newMode) // sobre a árvore ou o prédio não destaca tile
    const old = hover.current
    const same =
      next?.kind === 'slot'
        ? old?.kind === 'slot' && old.x === next.x && old.y === next.y
        : next?.kind === 'tile'
          ? old?.kind === 'tile' && old.plot === next.plot && old.row === next.row && old.col === next.col && newMode === mode.current
          : old === null
    moveTip(e)
    if (same && !buildingChanged && !treeChanged) return // nada mudou
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

  function pointInCanvas(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  // Dois dedos: guarda o ponto do mapa sob o meio deles e a distância, para a pinça manter esse ponto no lugar
  function startPinch(e: React.PointerEvent<HTMLCanvasElement>) {
    if (dragging.current) {
      ghost.current = null
      dragging.current = false
      e.currentTarget.style.cursor = ''
    }
    drag.current = null
    afterPinch.current = true
    const [a, b] = [...pointers.current.values()]
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const world = screenToWorld(mid.x, mid.y, { ...camera.current, zoom: fitZoom(size) * userZoom.current }, size)
    pinch.current = { dist: Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1), zoom: userZoom.current, world }
    scheduleDraw()
  }

  // Pinça: o zoom segue a distância entre os dedos e o mapa anda junto com o meio deles
  function movePinch() {
    const p = pinch.current
    const [a, b] = [...pointers.current.values()]
    if (!p || !a || !b) return
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    userZoom.current = Math.min(Math.max((p.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / p.dist, MIN_USER_ZOOM), MAX_USER_ZOOM)
    const zoom = fitZoom(size) * userZoom.current
    camera.current = clampCamera(
      p.world.x - (mid.x - size.width / 2) / zoom,
      p.world.y - (mid.y - size.height / 2) / zoom,
      useFarmStore.getState().data?.plots ?? [],
    )
    scheduleDraw()
  }

  // Dedo levantado (ou gesto cancelado): sai da pinça; devolve true se o que sobrou não deve virar clique
  function releasePointer(e: React.PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (!afterPinch.current) return false
    if (pointers.current.size === 0) afterPinch.current = false
    drag.current = null
    return true
  }

  // Toque numa árvore sem frutas: não há mouse para passar por cima, então o balão aparece um pouco e some
  function showTreeTip(id: string, e: React.PointerEvent<HTMLCanvasElement>) {
    treeHover.current = id
    setTipTree(id)
    moveTip(e)
    scheduleDraw()
    clearTimeout(tipTimer.current)
    tipTimer.current = setTimeout(() => {
      treeHover.current = null
      setTipTree(null)
      scheduleDraw()
    }, 4000)
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId) // continua recebendo o mouse mesmo fora do canvas
    setMenu(null)
    clearTimeout(tipTimer.current)
    if (e.pointerType !== 'mouse' && treeHover.current) {
      treeHover.current = null // some o balão do toque anterior
      setTipTree(null)
    }
    pointers.current.set(e.pointerId, pointInCanvas(e))
    if (pointers.current.size >= 2) {
      startPinch(e)
      return
    }
    afterPinch.current = false
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
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, pointInCanvas(e))
    if (pinch.current) return movePinch()
    if (afterPinch.current) return
    const d = drag.current
    if (!d) {
      updateHover(e) // mouse solto: só atualiza o contorno do tile
      return
    }
    setTipTile(null) // arrastando: sem balão
    setTipTree(null)
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
    if (releasePointer(e)) return
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
    // sem frutas: o balão mostra quando voltam (no celular, aparece ao tocar)
    const bare = treeUnder(world.x, world.y)
    if (bare) {
      if (e.pointerType !== 'mouse') showTreeTip(bare, e)
      return
    }
    const building = buildingUnder(world.x, world.y)
    if (building) {
      useFarmStore.getState().openBuilding(building)
      return
    }
    const cell = tileFromWorld(world.x, world.y)
    // Alt + clique: o fazendeiro só anda até lá, sem agir
    if (e.altKey && !useFarmStore.getState().buyingPlot) {
      moveTo(cell.row, cell.col)
      return
    }
    const target = targetAt(world.x, world.y, modeOf(e))
    if (target?.kind === 'slot') useFarmStore.getState().buyPlot(target.x, target.y)
    // Shift/Ctrl + clique: age direto na linha/coluna, sem menu
    else if (target && target.mode !== 'tile') useFarmStore.getState().queueTiles(target.plot, target.row, target.col, target.mode)
    else if (!useFarmStore.getState().buyingPlot) {
      // clique simples: abre o menu do que dá para fazer ali (em cima de um tile ou só no chão)
      const rect = e.currentTarget.getBoundingClientRect()
      setTipTile(null)
      setTipTree(null)
      setMenu({ sx: e.clientX - rect.left, sy: e.clientY - rect.top, tile: target?.kind === 'tile' ? { plot: target.plot, row: target.row, col: target.col } : null, cell })
    }
  }

  return (
    <div ref={containerRef} className="map-area">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={(e) => {
          releasePointer(e)
          drag.current = null
          if (dragging.current) ghost.current = null
          dragging.current = false
          scheduleDraw()
        }}
        onPointerLeave={() => {
          setTipTile(null)
          setTipTree(null)
          treeHover.current = null
          hover.current = null
          buildingHover.current = null
          if (!dragging.current) ghost.current = null // a prévia de construir some fora do mapa
          scheduleDraw()
        }}
      />
      {/* sempre na tela (vazio sem planta) para o canvas poder mover antes do balão aparecer */}
      <div ref={tipRef} className="plant-tip-anchor">
        {tipTile && <PlantTip at={tipTile} />}
        {tipTree && !menu && <TreeTip id={tipTree} />}
      </div>
      {menu && <TileMenu at={menu} size={size} onClose={() => setMenu(null)} />}
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
type MenuAt = { sx: number; sy: number; tile: TileRef | null; cell: { row: number; col: number } }

const MENU_WIDTH = 210
const MENU_ROW = 38

// Menu do clique: o que dá para fazer no tile (arar, plantar, colher, regar, adubar, desfazer a aragem) e
// "Mover para cá". Fora dos terrenos só tem o mover. Item sem condição de uso fica apagado, com o motivo na dica.
function TileMenu({ at, size, onClose }: { at: MenuAt; size: Size; onClose: () => void }) {
  const data = useFarmStore((s) => s.data)
  const selected = useFarmStore((s) => s.selected)
  const menu = data && at.tile ? tileMenu(data, at.tile.plot, at.tile.row, at.tile.col, selected) : null
  const rows = (menu?.items.length ?? 0) + (menu?.subtitle ? 4 : 3)
  const left = Math.max(4, Math.min(at.sx + 8, size.width - MENU_WIDTH - 8))
  const top = Math.max(4, Math.min(at.sy + 8, size.height - rows * MENU_ROW - 40))
  const store = useFarmStore.getState()

  return (
    <div className="panel-light ctx-menu" style={{ left, top, width: MENU_WIDTH }} onContextMenu={(e) => e.preventDefault()}>
      <div className="ctx-title">{menu?.title ?? 'Chão'}</div>
      {menu?.subtitle && <div className="ctx-sub">{menu.subtitle}</div>}
      {menu?.items.map((item) => (
        <button
          key={item.action}
          className="ctx-item"
          disabled={!!item.disabled}
          title={item.disabled}
          onClick={() => {
            if (at.tile) store.queueTileAction(at.tile.plot, at.tile.row, at.tile.col, item.action, item.crop)
            onClose()
          }}
        >
          {item.label}
        </button>
      ))}
      {at.tile && menu?.items.some((i) => !i.disabled && i.action !== 'untill') && (
        <div className="ctx-line">
          {(['row', 'col'] as const).map((mode) => (
            <button
              key={mode}
              className="ctx-item small"
              title={`Mesma ação na ${mode === 'row' ? 'linha' : 'coluna'} inteira (Shift ou Ctrl + clique)`}
              onClick={() => {
                store.queueTiles(at.tile!.plot, at.tile!.row, at.tile!.col, mode)
                onClose()
              }}
            >
              {mode === 'row' ? 'Linha' : 'Coluna'}
            </button>
          ))}
        </div>
      )}
      <button
        className="ctx-item"
        title="Atalho: Alt + clique"
        onClick={() => {
          moveTo(at.cell.row, at.cell.col)
          onClose()
        }}
      >
        Mover para cá
      </button>
    </div>
  )
}

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

// Balão da árvore sob o mouse: com frutas, quantas; sem, quanto falta para voltarem (atualiza a cada segundo,
// junto com o relógio da tela)
function TreeTip({ id }: { id: string }) {
  const last = useFarmStore((s) => s.data?.trees[id])
  useFarmStore((s) => s.data?.time) // só para renovar a contagem a cada segundo
  const tree = TREES.find((t) => t.id === id)
  if (!tree) return null
  const fruit = FRUITS[tree.fruit]
  const left = last === undefined ? 0 : Math.ceil(Math.max(0, tree.regrowMs - (serverNow() - last)) / 1000)
  return (
    <div className="plant-tip">
      <b>Árvore de {fruit.name.toLowerCase()}</b>
      {left === 0 ? (
        <span className="ready-text">{tree.fruitsPerHarvest} frutas para colher!</span>
      ) : (
        <span>frutas voltam em {formatDuration(left)}</span>
      )}
    </div>
  )
}

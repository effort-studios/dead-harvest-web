import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clampCamera,
  drawWorld,
  fitZoom,
  INITIAL_CAMERA,
  screenToWorld,
  tileFromWorld,
  treeAt,
  type Hover,
  type Size,
} from '@/features/farm/render/draw'
import { freeSlots, plotCell, type ClickMode } from '@/features/farm/model/state'
import { skyTint } from '@/features/farm/model/daycycle'
import { loadSprites, type Sprites } from '@/features/farm/render/sprites'
import { useGameStore } from '@/store/gameStore'

// Shift = ação na linha inteira, Ctrl = na coluna inteira, nenhum = só no tile
function modeOf(e: { shiftKey: boolean; ctrlKey: boolean }): ClickMode {
  return e.shiftKey ? 'row' : e.ctrlKey ? 'col' : 'tile'
}

// Zoom do jogador (multiplica o zoom que ajusta o mapa à janela) e seus limites
const MIN_USER_ZOOM = 0.5
const MAX_USER_ZOOM = 3
const WHEEL_SENSITIVITY = 0.0015

// Movimento menor que isso (em px) conta como clique; maior, como arrasto do mapa
const DRAG_THRESHOLD = 5

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const plots = useGameStore((s) => s.data?.plots)
  const buyingPlot = useGameStore((s) => s.buyingPlot)
  const readyTrees = useGameStore((s) => s.readyTrees)
  const harvestTree = useGameStore((s) => s.harvestTree)
  const time = useGameStore((s) => s.data?.time ?? 0)
  const [sprites, setSprites] = useState<Sprites | null>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  // A câmera fica num ref (e não em state) para arrastar não re-renderizar o React a cada pixel
  const camera = useRef({ ...INITIAL_CAMERA })
  const drag = useRef<{ startX: number; startY: number; camX: number; camY: number; moved: boolean } | null>(null)
  const userZoom = useRef(1) // controlado pela roda do mouse
  const frame = useRef(0)
  const hover = useRef<Hover | null>(null) // o que está sob o mouse
  const treeHover = useRef<string | null>(null) // árvore com frutas sob o mouse (vira cursor de mãozinha)
  const mode = useRef<ClickMode>('tile') // alterado por Shift/Ctrl
  const drawRef = useRef<() => void>(() => {})

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
    const { data, buyingPlot } = useGameStore.getState()
    if (!canvas || !ctx || !sprites || !data || size.width === 0) return
    const dpr = window.devicePixelRatio || 1
    // só mexe no tamanho se mudou (mexer apaga o desenho)
    if (canvas.width !== Math.round(size.width * dpr) || canvas.height !== Math.round(size.height * dpr)) {
      canvas.width = Math.round(size.width * dpr)
      canvas.height = Math.round(size.height * dpr)
    }
    const { x, y } = camera.current
    const ready = new Set(readyTrees ? readyTrees.split(',') : [])
    drawWorld(ctx, sprites, data.plots, ready, { x, y, zoom: fitZoom(size) * userZoom.current }, size, dpr, hover.current, buyingPlot ? freeSlots(data) : [])
  }, [sprites, size, readyTrees])

  // Redesenha quando os terrenos, as imagens ou o tamanho da janela mudam
  useEffect(() => {
    hover.current = null
    draw()
  }, [draw, plots, buyingPlot])

  drawRef.current = draw

  // Durante o arrasto, no máximo um desenho por frame da tela
  function scheduleDraw() {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => drawRef.current())
  }

  // Apertar ou soltar Shift/Ctrl com o mouse parado também muda o destaque
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') useGameStore.getState().setBuyingPlot(false)
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

  // Árvore com frutas sob o ponto (fora do modo de compra de terreno)
  function readyTreeAt(wx: number, wy: number): string | null {
    const { data, readyTrees, buyingPlot } = useGameStore.getState()
    if (!data || buyingPlot) return null
    const tree = treeAt(wx, wy, data.plots)
    return tree && readyTrees.split(',').includes(tree) ? tree : null
  }

  // O que está sob o ponto: um terreno livre (na compra) ou um tile de um terreno
  function targetAt(wx: number, wy: number, newMode: ClickMode): Hover | null {
    const { data, buyingPlot } = useGameStore.getState()
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
        useGameStore.getState().data?.plots ?? [],
      )
      scheduleDraw()
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  function updateHover(e: React.PointerEvent<HTMLCanvasElement>) {
    const world = worldAt(e)
    const ready = readyTreeAt(world.x, world.y)
    if (ready !== treeHover.current) {
      treeHover.current = ready
      e.currentTarget.style.cursor = ready ? 'pointer' : ''
    }
    const newMode = modeOf(e)
    const next = ready ? null : targetAt(world.x, world.y, newMode) // sobre a árvore não destaca tile
    const old = hover.current
    const same =
      next?.kind === 'slot'
        ? old?.kind === 'slot' && old.x === next.x && old.y === next.y
        : next?.kind === 'tile'
          ? old?.kind === 'tile' && old.plot === next.plot && old.row === next.row && old.col === next.col && newMode === mode.current
          : old === null
    if (same) return // nada mudou
    hover.current = next
    mode.current = newMode
    scheduleDraw()
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId) // continua recebendo o mouse mesmo fora do canvas
    drag.current = { startX: e.clientX, startY: e.clientY, camX: camera.current.x, camY: camera.current.y, moved: false }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = drag.current
    if (!d) {
      updateHover(e) // mouse solto: só atualiza o contorno do tile
      return
    }
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    d.moved = true
    // arrastar o mapa para a direita = câmera vai para a esquerda
    const zoom = fitZoom(size) * userZoom.current
    camera.current = { ...clampCamera(d.camX - dx / zoom, d.camY - dy / zoom, useGameStore.getState().data?.plots ?? []) }
    scheduleDraw()
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = drag.current
    drag.current = null
    if (!d || d.moved) return // foi um arrasto, não um clique
    const world = worldAt(e)
    const tree = readyTreeAt(world.x, world.y)
    if (tree) {
      harvestTree(tree)
      return
    }
    const target = targetAt(world.x, world.y, modeOf(e))
    if (target?.kind === 'slot') useGameStore.getState().buyPlot(target.x, target.y)
    else if (target) useGameStore.getState().clickTile(target.plot, target.row, target.col, target.mode)
  }

  return (
    <div ref={containerRef} className="map-area">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        onPointerLeave={() => {
          hover.current = null
          scheduleDraw()
        }}
      />
      {/* Luz do dia: cobre só o mapa (a HUD fica de fora) e muda aos poucos com a hora */}
      <div className="sky-tint" style={{ backgroundColor: skyTint(time) }} />
    </div>
  )
}

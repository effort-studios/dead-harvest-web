import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clampCamera,
  drawWorld,
  fitZoom,
  INITIAL_CAMERA,
  screenToWorld,
  tileFromWorld,
  treeAt,
  type Size,
} from '../render/draw'
import type { ClickMode } from '../game/state'
import { skyTint } from '../game/daycycle'
import { loadSprites, type Sprites } from '../render/sprites'
import { useGameStore } from '../store/gameStore'

// Shift = ação na linha inteira, Ctrl = na coluna inteira, nenhum = só no tile
function modeOf(e: { shiftKey: boolean; ctrlKey: boolean }): ClickMode {
  return e.shiftKey ? 'row' : e.ctrlKey ? 'col' : 'tile'
}

// Movimento menor que isso (em px) conta como clique; maior, como arrasto do mapa
const DRAG_THRESHOLD = 5

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grid = useGameStore((s) => s.data?.grid)
  const readyTrees = useGameStore((s) => s.readyTrees)
  const clickTile = useGameStore((s) => s.clickTile)
  const harvestTree = useGameStore((s) => s.harvestTree)
  const time = useGameStore((s) => s.data?.time ?? 0)
  const [sprites, setSprites] = useState<Sprites | null>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  // A câmera fica num ref (e não em state) para arrastar não re-renderizar o React a cada pixel
  const camera = useRef({ ...INITIAL_CAMERA })
  const drag = useRef<{ startX: number; startY: number; camX: number; camY: number; moved: boolean } | null>(null)
  const frame = useRef(0)
  const hover = useRef<{ row: number; col: number } | null>(null) // tile sob o mouse
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
    const currentGrid = useGameStore.getState().data?.grid
    if (!canvas || !ctx || !sprites || !currentGrid || size.width === 0) return
    const dpr = window.devicePixelRatio || 1
    // só mexe no tamanho se mudou (mexer apaga o desenho)
    if (canvas.width !== Math.round(size.width * dpr) || canvas.height !== Math.round(size.height * dpr)) {
      canvas.width = Math.round(size.width * dpr)
      canvas.height = Math.round(size.height * dpr)
    }
    const { x, y } = camera.current
    drawWorld(ctx, sprites, currentGrid, new Set(readyTrees ? readyTrees.split(',') : []), { x, y, zoom: fitZoom(size) }, size, dpr, hover.current && { ...hover.current, mode: mode.current })
  }, [sprites, size, readyTrees])

  // Redesenha quando a grade, as imagens ou o tamanho da janela mudam
  useEffect(() => {
    draw()
  }, [draw, grid])

  drawRef.current = draw

  // Durante o arrasto, no máximo um desenho por frame da tela
  function scheduleDraw() {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => drawRef.current())
  }

  // Apertar ou soltar Shift/Ctrl com o mouse parado também muda o destaque
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const next = modeOf(e)
      if (next === mode.current) return
      mode.current = next
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

  function updateHover(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const cam = { ...camera.current, zoom: fitZoom(size) }
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, cam, size)
    const tree = treeAt(world.x, world.y)
    const ready = tree && useGameStore.getState().readyTrees.split(',').includes(tree) ? tree : null
    if (ready !== treeHover.current) {
      treeHover.current = ready
      e.currentTarget.style.cursor = ready ? 'pointer' : ''
    }
    const pos = ready ? null : tileFromWorld(world.x, world.y) // sobre a árvore não destaca tile
    const old = hover.current
    const newMode = modeOf(e)
    if (pos?.row === old?.row && pos?.col === old?.col && newMode === mode.current) return // nada mudou
    hover.current = pos
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
    const zoom = fitZoom(size)
    camera.current = { ...clampCamera(d.camX - dx / zoom, d.camY - dy / zoom) }
    scheduleDraw()
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = drag.current
    drag.current = null
    if (!d || d.moved) return // foi um arrasto, não um clique
    const rect = e.currentTarget.getBoundingClientRect()
    const cam = { ...camera.current, zoom: fitZoom(size) }
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, cam, size)
    const tree = treeAt(world.x, world.y)
    if (tree && useGameStore.getState().readyTrees.split(',').includes(tree)) {
      harvestTree(tree)
      return
    }
    const pos = tileFromWorld(world.x, world.y)
    if (pos) clickTile(pos.row, pos.col, modeOf(e))
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

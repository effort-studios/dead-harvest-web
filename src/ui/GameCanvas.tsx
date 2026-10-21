import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clampCamera,
  drawWorld,
  fitZoom,
  INITIAL_CAMERA,
  screenToWorld,
  tileFromWorld,
  type Size,
} from '../render/draw'
import { loadSprites, type Sprites } from '../render/sprites'
import { useGameStore } from '../store/gameStore'

// Movimento menor que isso (em px) conta como clique; maior, como arrasto do mapa
const DRAG_THRESHOLD = 5

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grid = useGameStore((s) => s.data?.grid)
  const clickTile = useGameStore((s) => s.clickTile)
  const [sprites, setSprites] = useState<Sprites | null>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  // A câmera fica num ref (e não em state) para arrastar não re-renderizar o React a cada pixel
  const camera = useRef({ ...INITIAL_CAMERA })
  const drag = useRef<{ startX: number; startY: number; camX: number; camY: number; moved: boolean } | null>(null)
  const frame = useRef(0)
  const hover = useRef<{ row: number; col: number } | null>(null) // tile sob o mouse

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
    drawWorld(ctx, sprites, currentGrid, { x, y, zoom: fitZoom(size) }, size, dpr, hover.current)
  }, [sprites, size])

  // Redesenha quando a grade, as imagens ou o tamanho da janela mudam
  useEffect(() => {
    draw()
  }, [draw, grid])

  // Durante o arrasto, no máximo um desenho por frame da tela
  function scheduleDraw() {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(draw)
  }

  function updateHover(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const cam = { ...camera.current, zoom: fitZoom(size) }
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, cam, size)
    const pos = tileFromWorld(world.x, world.y)
    const old = hover.current
    if (pos?.row === old?.row && pos?.col === old?.col) return // não mudou de tile
    hover.current = pos
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
    const pos = tileFromWorld(world.x, world.y)
    if (pos) clickTile(pos.row, pos.col)
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
    </div>
  )
}

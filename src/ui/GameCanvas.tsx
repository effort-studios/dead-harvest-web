import { useEffect, useRef, useState } from 'react'
import { CANVAS_HEIGHT, CANVAS_WIDTH, drawWorld, tileFromPoint } from '../render/draw'
import { loadSheet } from '../render/sprites'
import { useGameStore } from '../store/gameStore'

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grid = useGameStore((s) => s.data?.grid)
  const clickTile = useGameStore((s) => s.clickTile)
  const [sheet, setSheet] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    loadSheet().then(setSheet)
  }, [])

  // Redesenha quando a imagem carrega ou a grade muda
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && grid && sheet) drawWorld(ctx, sheet, grid)
  }, [grid, sheet])

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    // o canvas pode estar escalado pelo CSS, então convertemos para pixels internos
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height
    const pos = tileFromPoint(x, y)
    if (pos) clickTile(pos.row, pos.col)
  }

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onClick={handleClick} />
}

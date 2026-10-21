import { useEffect, useRef } from 'react'
import { CANVAS_SIZE, drawWorld, tileFromPoint } from '../render/draw'
import { useGameStore } from '../store/gameStore'

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grid = useGameStore((s) => s.data?.grid)
  const clickTile = useGameStore((s) => s.clickTile)

  // Redesenha sempre que a grade muda
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && grid) drawWorld(ctx, grid)
  }, [grid])

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    // o canvas pode estar escalado pelo CSS, então convertemos para pixels internos
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height
    const pos = tileFromPoint(x, y)
    if (pos) clickTile(pos.row, pos.col)
  }

  return <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} onClick={handleClick} />
}

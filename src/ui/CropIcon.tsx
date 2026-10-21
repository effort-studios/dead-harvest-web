import { useEffect, useRef } from 'react'
import type { CropId } from '../game/crops'
import { drawCropShape } from '../render/draw'
import { loadSprites } from '../render/sprites'

// Ícone da planta madura, desenhado com o mesmo código do mapa
// (assim o ícone sempre combina com o que aparece na plantação).
export function CropIcon({ crop, size = 40 }: { crop: CropId; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let cancelled = false
    loadSprites().then((sprites) => {
      if (cancelled) return
      const px = size * 2 // desenha em dobro para ficar nítido em telas retina
      canvas.width = px
      canvas.height = px
      ctx.clearRect(0, 0, px, px)
      if (crop === 'corn') {
        // recorte do sprite do milho maduro (parte que tem desenho dentro da imagem 256x512)
        const sx = 7, sy = 300, sw = 220, sh = 183
        const scale = Math.min(px / sw, px / sh) * 0.95
        ctx.drawImage(sprites.corn_S, sx, sy, sw, sh, (px - sw * scale) / 2, (px - sh * scale) / 2, sw * scale, sh * scale)
      } else {
        ctx.setTransform((px / 44) * 1, 0, 0, px / 44, px / 2, px * 0.82) // base da planta no centro de baixo
        drawCropShape(ctx, 0, 0, crop, 1)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
      }
    })
    return () => {
      cancelled = true
    }
  }, [crop, size])

  return <canvas ref={ref} className="crop-icon" style={{ width: size, height: size }} />
}

import { useMemo } from 'react'
import type { Avatar as AvatarData } from '../game/avatar'
import { AVATAR_PIXELS, avatarImageUrl } from '../render/pixelAvatar'

// Retrato do jogador em pixel art (gerado em render/pixelAvatar.ts).
// Use tamanhos múltiplos da grade (40, 80, 120, 160...) para os pixels ficarem todos do mesmo tamanho.
export function Avatar({ avatar, size = AVATAR_PIXELS * 2 }: { avatar: AvatarData; size?: number }) {
  const { skin, face, hat, beard, outfit } = avatar
  const src = useMemo(() => avatarImageUrl({ skin, face, hat, beard, outfit }), [skin, face, hat, beard, outfit])
  return <img className="pixel-avatar" src={src} width={size} height={size} alt="" draggable={false} />
}

import { useEffect, useState } from 'react'
import type { Avatar as AvatarData } from '@/features/profile/model/avatar'
import { avatarImageUrl } from '@/features/profile/render/avatarLayers'

// Retrato do jogador: camadas desenhadas (public/assets/avatar) montadas e recoloridas em render/avatarLayers.ts.
// Enquanto a imagem é montada (só na primeira vez de cada combinação), mostra o fundo vazio.
export function Avatar({ avatar, size = 80 }: { avatar: AvatarData; size?: number }) {
  const [src, setSrc] = useState<string | null>(null)
  const { skin, eyes, face, hair, hairColor, beard, hat, outfit } = avatar

  useEffect(() => {
    let alive = true
    avatarImageUrl({ skin, eyes, face, hair, hairColor, beard, hat, outfit })
      .then((url) => alive && setSrc(url))
      .catch((err) => console.error(err))
    return () => {
      alive = false
    }
  }, [skin, eyes, face, hair, hairColor, beard, hat, outfit])

  return src ? (
    <img className="avatar-img" src={src} width={size} height={size} alt="" draggable={false} />
  ) : (
    <span className="avatar-img avatar-loading" style={{ width: size, height: size }} />
  )
}

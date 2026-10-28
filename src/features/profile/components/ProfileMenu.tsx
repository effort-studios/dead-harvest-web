import { useEffect, useRef, useState } from 'react'
import { useProfileStore } from '../store'
import { Avatar } from './Avatar'
import { Button, Panel, Plate } from '@/shared/ui'
import { CoinIcon } from '@/shared/ui/icons'
import { ProfileEditor } from './ProfileEditor'

// Painel do jogador (canto superior esquerdo). Clicar abre o menu da conta: editar perfil e sair.
export function ProfileMenu({ money, onLogout }: { money: number; onLogout: () => void }) {
  const user = useProfileStore((s) => s.user)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return
    function onDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  return (
    <div className="profile" ref={ref}>
      <Panel className="hud-player">
        <button className="hud-player-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} title="Perfil e conta">
          <div className="portrait">
            <Avatar avatar={user.avatar} size={80} />
          </div>
          <div className="player-info">
            <Plate>{user.displayName}</Plate>
            <Plate className="money">
              <CoinIcon size={22} /> {money}
            </Plate>
          </div>
          <span className={`select-caret ${open ? 'up' : ''}`} aria-hidden="true" />
        </button>
      </Panel>

      {open && (
        <Panel className="profile-menu" role="menu">
          <p className="profile-email">{user.email}</p>
          <Button
            role="menuitem"
            size="sm"
            onClick={() => {
              setOpen(false)
              setEditing(true)
            }}
          >
            Editar perfil
          </Button>
          <Button role="menuitem" size="sm" variant="danger" onClick={() => onLogout()}>
            Sair
          </Button>
        </Panel>
      )}

      {editing && <ProfileEditor onClose={() => setEditing(false)} />}
    </div>
  )
}

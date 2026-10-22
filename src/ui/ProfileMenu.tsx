import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { Avatar } from './Avatar'
import { CoinIcon } from './Icons'
import { ProfileEditor } from './ProfileEditor'

// Painel do jogador (canto superior esquerdo). Clicar abre o menu da conta: editar perfil e sair.
export function ProfileMenu() {
  const user = useGameStore((s) => s.user)
  const money = useGameStore((s) => s.data?.money ?? 0)
  const logout = useGameStore((s) => s.logout)

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
      <button className="panel hud-player" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} title="Perfil e conta">
        <div className="portrait">
          <Avatar avatar={user.avatar} size={40} />
        </div>
        <div className="player-info">
          <div className="player-name">{user.displayName}</div>
          <div className="money">
            <CoinIcon size={22} /> {money}
          </div>
        </div>
        <span className={`select-caret ${open ? 'up' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="panel-light profile-menu" role="menu">
          <p className="profile-email">{user.email}</p>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false)
              setEditing(true)
            }}
          >
            Editar perfil
          </button>
          <button role="menuitem" className="danger" onClick={() => logout()}>
            Sair
          </button>
        </div>
      )}

      {editing && <ProfileEditor onClose={() => setEditing(false)} />}
    </div>
  )
}

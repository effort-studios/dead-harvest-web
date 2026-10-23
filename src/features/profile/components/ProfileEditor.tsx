import { useEffect, useState, type FormEvent } from 'react'
import { AVATAR_OPTIONS, AVATAR_PARTS, OPTION_LABEL, PART_LABEL, type Avatar as AvatarData, type AvatarPart } from '@/features/profile/model/avatar'
import { useProfileStore } from '../store'
import { Avatar } from './Avatar'
import { CloseIcon } from '@/shared/ui/icons'

// Janela para editar o nome e o avatar. As mudanças só valem ao salvar; cancelar descarta tudo.
export function ProfileEditor({ onClose }: { onClose: () => void }) {
  const user = useProfileStore((s) => s.user)
  const updateProfile = useProfileStore((s) => s.updateProfile)

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [avatar, setAvatar] = useState<AvatarData>(user!.avatar)
  const [part, setPart] = useState<AvatarPart>('hat')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await updateProfile({ displayName, avatar })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar')
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="panel-light editor" onSubmit={save} role="dialog" aria-label="Editar perfil">
        <h2>
          <span className="panel-title">Editar perfil</span>
          <button type="button" className="panel-close" aria-label="Fechar" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </h2>

        <div className="editor-top">
          <div className="editor-preview">
            <Avatar avatar={avatar} size={160} />
          </div>
          <label className="editor-name">
            Nome no jogo
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} maxLength={30} required />
          </label>
        </div>

        <div className="tabs" role="tablist">
          {AVATAR_PARTS.map((p) => (
            <button type="button" key={p} role="tab" aria-selected={part === p} className={part === p ? 'active' : ''} onClick={() => setPart(p)}>
              {PART_LABEL[p]}
            </button>
          ))}
        </div>

        <div className="option-grid" role="listbox" aria-label={PART_LABEL[part]}>
          {AVATAR_OPTIONS[part].map((option) => (
            <button
              type="button"
              key={option}
              role="option"
              aria-selected={avatar[part] === option}
              className={`option ${avatar[part] === option ? 'chosen' : ''}`}
              onClick={() => setAvatar({ ...avatar, [part]: option })}
            >
              {/* cada opção mostra como o avatar ficaria com ela */}
              <Avatar avatar={{ ...avatar, [part]: option }} size={80} />
              <span>{(OPTION_LABEL[part] as Record<string, string>)[option]}</span>
            </button>
          ))}
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <div className="editor-actions">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn" disabled={busy}>{busy ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  )
}

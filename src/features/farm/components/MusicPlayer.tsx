import { useEffect, useRef, useState } from 'react'
import musicUrl from '@/assets/music.mp3'
import { MusicIcon, MusicOffIcon } from '@/shared/ui/icons'

const STORAGE_KEY = 'deadHarvestMusic'

type Settings = { volume: number; playing: boolean }

function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return {
      volume: typeof saved.volume === 'number' ? Math.min(1, Math.max(0, saved.volume)) : 0.4,
      playing: saved.playing !== false,
    }
  } catch {
    return { volume: 0.4, playing: true }
  }
}

// Música de fundo em loop, com pausar/tocar e volume. Os navegadores bloqueiam som antes de o jogador
// interagir com a página, então se o play automático falhar ele começa no primeiro clique ou tecla.
export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [{ volume, playing }, setSettings] = useState(loadSettings)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume, playing }))
    } catch {
      // sem localStorage: só não lembra da escolha
    }
  }, [volume, playing])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!playing) {
      audio.pause()
      return
    }
    let cancelled = false
    const unlock = () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      if (!cancelled) audio.play().catch(() => {})
    }
    audio.play().catch(() => {
      window.addEventListener('pointerdown', unlock)
      window.addEventListener('keydown', unlock)
    })
    return () => {
      cancelled = true
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [playing])

  const muted = !playing || volume === 0

  return (
    <div className="music-player">
      <audio ref={audioRef} src={musicUrl} loop preload="auto" />
      {open && (
        <div className="panel music-panel">
          <button
            className="btn"
            onClick={() => setSettings((s) => ({ ...s, playing: !s.playing }))}
            title={playing ? 'Pausar a música' : 'Tocar a música'}
          >
            {playing ? 'Pausar' : 'Tocar'}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => setSettings((s) => ({ ...s, volume: Number(e.target.value) / 100 }))}
            aria-label="Volume da música"
          />
        </div>
      )}
      <button className="panel music-toggle" onClick={() => setOpen((o) => !o)} aria-label="Música" title="Música">
        {muted ? <MusicOffIcon size={26} /> : <MusicIcon size={26} />}
      </button>
    </div>
  )
}

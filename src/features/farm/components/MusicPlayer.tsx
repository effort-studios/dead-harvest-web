import { useEffect, useRef, useState } from 'react'
import { CloseIcon, MusicIcon, MusicOffIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon, VolumeIcon } from '@/shared/ui/icons'

const PLAYLIST_ID = 'PLQwRmTwWx0ubcpv0SkHroupj1LqW5_Va5'
const STORAGE_KEY = 'deadHarvestMusic'

// O mínimo da YouTube IFrame API que usamos (https://developers.google.com/youtube/iframe_api_reference)
type YTPlayer = {
  playVideo(): void
  pauseVideo(): void
  nextVideo(): void
  previousVideo(): void
  setVolume(volume: number): void
  setLoop(loop: boolean): void
  getPlayerState(): number
  destroy(): void
}
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    options: {
      width: number
      height: number
      playerVars: Record<string, string | number>
      events: { onReady: () => void; onStateChange: (e: { data: number }) => void }
    },
  ) => YTPlayer
}
declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

const YT_PLAYING = 1
const YT_PAUSED = 2

let apiPromise: Promise<YTNamespace> | null = null
function loadYouTubeApi(): Promise<YTNamespace> {
  apiPromise ??= new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT)
    window.onYouTubeIframeAPIReady = () => resolve(window.YT!)
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return apiPromise
}

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

// Playlist de lofi do YouTube em loop, com pausar, próxima/anterior e volume. O player do YouTube precisa
// ficar visível (regra do embed), por isso o painel começa aberto. Os navegadores bloqueiam som antes de o
// jogador interagir com a página: se o play automático falhar, começa no primeiro clique ou tecla.
export function MusicPlayer() {
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const settingsRef = useRef<Settings>(loadSettings())
  const [{ volume, playing }, setSettings] = useState(settingsRef.current)
  const [open, setOpen] = useState(true)
  const [ready, setReady] = useState(false)

  settingsRef.current = { volume, playing }

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume, playing }))
    } catch {
      // sem localStorage: só não lembra da escolha
    }
  }, [volume, playing])

  // Cria o player do YouTube (o elemento interno é do YouTube, o React não mexe nele)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let cancelled = false
    const target = document.createElement('div')
    host.appendChild(target)

    function unlock() {
      removeUnlock()
      if (settingsRef.current.playing) playerRef.current?.playVideo()
    }
    function removeUnlock() {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }

    loadYouTubeApi().then((YT) => {
      if (cancelled) return
      const player = new YT.Player(target, {
        width: 200,
        height: 200,
        playerVars: { listType: 'playlist', list: PLAYLIST_ID, controls: 0, playsinline: 1, rel: 0, disablekb: 1 },
        events: {
          onReady: () => {
            if (cancelled) return
            playerRef.current = player
            player.setLoop(true)
            player.setVolume(Math.round(settingsRef.current.volume * 100))
            setReady(true)
            if (settingsRef.current.playing) {
              player.playVideo()
              // se o navegador bloquear o play automático, tenta de novo no primeiro gesto
              window.addEventListener('pointerdown', unlock)
              window.addEventListener('keydown', unlock)
            }
          },
          onStateChange: (e) => {
            if (e.data === YT_PLAYING) {
              removeUnlock()
              setSettings((s) => (s.playing ? s : { ...s, playing: true }))
            } else if (e.data === YT_PAUSED) {
              setSettings((s) => (s.playing ? { ...s, playing: false } : s))
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      removeUnlock()
      playerRef.current?.destroy()
      playerRef.current = null
      setReady(false)
      host.replaceChildren()
    }
  }, [])

  useEffect(() => {
    playerRef.current?.setVolume(Math.round(volume * 100))
  }, [volume, ready])

  function togglePlay() {
    const player = playerRef.current
    if (!player) return
    if (player.getPlayerState() === YT_PLAYING) player.pauseVideo()
    else player.playVideo()
  }

  const muted = !playing || volume === 0
  const lastVolume = useRef(0.4)

  function toggleMute() {
    if (volume > 0) {
      lastVolume.current = volume
      setSettings((s) => ({ ...s, volume: 0 }))
    } else {
      setSettings((s) => ({ ...s, volume: lastVolume.current }))
    }
  }

  return (
    <div className="music-player">
      <section className={`panel-light music-panel ${open ? '' : 'closed'}`} aria-label="Música">
        <h2 className="music-head">
          <span className="panel-title">
            <MusicIcon size={22} /> Música
          </span>
          <button className="panel-close" aria-label="Fechar" onClick={() => setOpen(false)}>
            <CloseIcon size={18} />
          </button>
        </h2>
        <div className="music-video" ref={hostRef} />
        <div className="music-controls">
          <button className="music-btn" onClick={() => playerRef.current?.previousVideo()} disabled={!ready} title="Música anterior">
            <PrevIcon size={22} />
          </button>
          <button className="music-btn big" onClick={togglePlay} disabled={!ready} title={playing ? 'Pausar a música' : 'Tocar a música'}>
            {playing ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
          </button>
          <button className="music-btn" onClick={() => playerRef.current?.nextVideo()} disabled={!ready} title="Próxima música">
            <NextIcon size={22} />
          </button>
        </div>
        <div className="music-volume">
          <button className="music-mute" onClick={toggleMute} aria-label={volume === 0 ? 'Ativar o som' : 'Silenciar'} title={volume === 0 ? 'Ativar o som' : 'Silenciar'}>
            <VolumeIcon size={22} level={volume === 0 ? 0 : volume < 0.5 ? 1 : 2} />
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            style={{ '--fill': `${Math.round(volume * 100)}%` } as React.CSSProperties}
            onChange={(e) => setSettings((s) => ({ ...s, volume: Number(e.target.value) / 100 }))}
            aria-label="Volume da música"
          />
          <b>{Math.round(volume * 100)}%</b>
        </div>
      </section>
      <button className="panel music-toggle" onClick={() => setOpen((o) => !o)} aria-label="Música" title="Música">
        {muted ? <MusicOffIcon size={26} /> : <MusicIcon size={26} />}
      </button>
    </div>
  )
}

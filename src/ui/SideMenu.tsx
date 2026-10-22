import { useEffect, useState } from 'react'
import { CROP_ORDER, CROPS } from '../game/crops'
import { plotPrice } from '../game/state'
import { useGameStore } from '../store/gameStore'
import { BulbIcon, CloseIcon, CoinIcon, CropIcon, FarmerIcon, InfoIcon, ShopIcon } from './Icons'

type Section = 'shop' | 'tips' | 'account' | 'about'

const SECTIONS: { id: Section; Icon: (props: { size?: number }) => React.JSX.Element; title: string }[] = [
  { id: 'shop', Icon: ShopIcon, title: 'Loja' },
  { id: 'tips', Icon: BulbIcon, title: 'Dicas' },
  { id: 'account', Icon: FarmerIcon, title: 'Conta' },
  { id: 'about', Icon: InfoIcon, title: 'Sobre' },
]

// Menu lateral: uma faixa de ícones que abre um painel por cima do mapa.
// O painel não bloqueia o mapa, então dá para comprar e plantar com ele aberto.
export function SideMenu() {
  const [open, setOpen] = useState<Section | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const current = SECTIONS.find((s) => s.id === open)

  return (
    <div className="side-menu">
      <nav className={`side-rail ${open ? 'has-open' : ''}`}>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`rail-btn ${open === s.id ? 'active' : ''}`}
            title={s.title}
            aria-label={s.title}
            onClick={() => setOpen(open === s.id ? null : s.id)}
          >
            <s.Icon size={34} />
          </button>
        ))}
      </nav>

      {current && (
        <section className="panel-light side-panel">
          <h2>
            <span className="panel-title">
              <current.Icon size={26} /> {current.title}
            </span>
            <button className="panel-close" aria-label="Fechar" onClick={() => setOpen(null)}>
              <CloseIcon size={20} />
            </button>
          </h2>
          {open === 'shop' && <ShopPanel />}
          {open === 'tips' && <TipsPanel />}
          {open === 'account' && <AccountPanel />}
          {open === 'about' && <AboutPanel />}
        </section>
      )}
    </div>
  )
}

function ShopPanel() {
  const money = useGameStore((s) => s.data?.money ?? 0)
  const inventory = useGameStore((s) => s.data?.inventory ?? {})
  const buySeed = useGameStore((s) => s.buySeed)
  const price = useGameStore((s) => (s.data ? plotPrice(s.data) : 0))
  const plotCount = useGameStore((s) => s.data?.plots.length ?? 0)
  const buyingPlot = useGameStore((s) => s.buyingPlot)
  const setBuyingPlot = useGameStore((s) => s.setBuyingPlot)

  return (
    <>
      <p className="muted">
        Seu dinheiro: <CoinIcon size={16} /> {money}
      </p>
      {CROP_ORDER.map((id) => {
        const crop = CROPS[id]
        return (
          <div className="shop-row" key={id}>
            <CropIcon crop={id} size={44} />
            <div className="shop-info">
              <b>{crop.name}</b> <span className="muted">(você tem {inventory[id] ?? 0})</span>
              <small>
                Cresce em {crop.growTicks}s · vende por <CoinIcon size={13} /> {crop.sellPrice}
              </small>
            </div>
            <button className="btn" disabled={money < crop.seedPrice} onClick={() => buySeed(id)}>
              <CoinIcon size={16} /> {crop.seedPrice}
            </button>
          </div>
        )
      })}
      <div className="shop-row">
        <div className="shop-info">
          <b>Terreno</b> <span className="muted">(você tem {plotCount})</span>
          <small>{buyingPlot ? 'Clique num terreno destacado no mapa' : 'Um terreno novo 10x10 ao lado de um que você já tem'}</small>
        </div>
        <button className="btn" disabled={!buyingPlot && money < price} onClick={() => setBuyingPlot(!buyingPlot)}>
          {buyingPlot ? 'Cancelar' : <><CoinIcon size={16} /> {price}</>}
        </button>
      </div>
    </>
  )
}

function TipsPanel() {
  return (
    <>
      <h3>Controles</h3>
      <ul>
        <li>Arraste o mapa com o mouse para se mover.</li>
        <li>Clique num tile: arar, plantar e colher.</li>
        <li><b>Shift</b> + clique: ação na linha inteira.</li>
        <li><b>Ctrl</b> + clique: ação na coluna inteira.</li>
        <li>Teclas <b>1</b>, <b>2</b>, <b>3</b>: escolhe a semente.</li>
        <li><b>Esc</b> fecha este menu.</li>
      </ul>
      <h3>Plantas</h3>
      <table className="crops">
        <thead>
          <tr><th>Planta</th><th>Cresce</th><th>Semente</th><th>Venda</th></tr>
        </thead>
        <tbody>
          {CROP_ORDER.map((id) => (
            <tr key={id}>
              <td>{CROPS[id].name}</td>
              <td>{CROPS[id].growTicks}s</td>
              <td>{CROPS[id].seedPrice}</td>
              <td>{CROPS[id].sellPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">Só dá para colher quando a planta está madura.</p>
    </>
  )
}

function AccountPanel() {
  const playerId = useGameStore((s) => s.playerId)
  const newGame = useGameStore((s) => s.newGame)
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <p><b>Convidado</b></p>
      <p className="muted">Id: {playerId?.slice(0, 8)}…</p>
      <p className="muted">Ainda não há login: seu progresso fica ligado a este navegador.</p>

      <h3>Novo jogo</h3>
      <p className="muted">Começa do zero com um jogador novo. O progresso atual continua guardado no banco, mas você deixa de ter acesso a ele.</p>
      {confirming ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn danger"
            onClick={() => {
              newGame()
              setConfirming(false)
            }}
          >
            Sim, começar de novo
          </button>
          <button className="btn" onClick={() => setConfirming(false)}>Cancelar</button>
        </div>
      ) : (
        <button className="btn" onClick={() => setConfirming(true)}>Novo jogo…</button>
      )}
    </>
  )
}

function AboutPanel() {
  return (
    <>
      <p>Dead Harvest: planta de dia, sobrevive à noite.</p>
      <p className="muted">
        Interface: UI Pack Adventure, por Kenney (kenney.nl), licença CC0. A arte do mundo e os ícones foram desenhados para o jogo. Fonte: Fredoka (Google Fonts).
      </p>
    </>
  )
}

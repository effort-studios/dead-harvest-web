import { useEffect, useRef, useState } from 'react'
import { CROP_ORDER, CROPS, formatDuration, type CropId } from '../game/crops'
import { FRUIT_ORDER, FRUITS, FRUIT_REGROW_MS, FRUITS_PER_HARVEST, TREES } from '../game/trees'
import { plotPrice } from '../game/state'
import { useGameStore } from '../store/gameStore'
import { BulbIcon, CloseIcon, CoinIcon, CropIcon, FarmerIcon, FruitIcon, InfoIcon, ShopIcon } from './Icons'

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
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')

  return (
    <>
      <p className="muted">
        Seu dinheiro: <CoinIcon size={16} /> {money}
      </p>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'buy'} className={tab === 'buy' ? 'active' : ''} onClick={() => setTab('buy')}>
          Sementes
        </button>
        <button role="tab" aria-selected={tab === 'sell'} className={tab === 'sell' ? 'active' : ''} onClick={() => setTab('sell')}>
          Vender frutas
        </button>
      </div>
      {tab === 'buy' ? (
        <>
          <BuySeeds />
          <BuyPlot />
        </>
      ) : (
        <SellFruits />
      )}
    </>
  )
}

// Select próprio (o <select> do navegador não aceita ícones nem estilo): botão que abre uma lista
function SeedSelect({ value, onChange }: { value: CropId; onChange: (crop: CropId) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const money = useGameStore((s) => s.data?.money ?? 0)

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    function onDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open])

  return (
    <div className="select" ref={ref}>
      <button className="select-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <CropIcon crop={value} size={30} />
        <span className="select-name">{CROPS[value].name}</span>
        <span className="select-price">
          <CoinIcon size={14} /> {CROPS[value].seedPrice}
        </span>
        <span className={`select-caret ${open ? 'up' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <ul className="select-list" role="listbox">
          {CROP_ORDER.map((id) => (
            <li
              key={id}
              role="option"
              aria-selected={id === value}
              className={`${id === value ? 'chosen' : ''} ${money < CROPS[id].seedPrice ? 'poor' : ''}`}
              onClick={() => {
                onChange(id)
                setOpen(false)
              }}
            >
              <CropIcon crop={id} size={28} />
              <span className="select-name">{CROPS[id].name}</span>
              <span className="select-time">{formatDuration(CROPS[id].growTicks)}</span>
              <span className="select-price">
                <CoinIcon size={14} /> {CROPS[id].seedPrice}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const BUY_AMOUNTS = [1, 5, 10]

function BuySeeds() {
  const money = useGameStore((s) => s.data?.money ?? 0)
  const inventory = useGameStore((s) => s.data?.inventory ?? {})
  const buySeed = useGameStore((s) => s.buySeed)
  const [crop, setCrop] = useState<CropId>(CROP_ORDER[0])
  const info = CROPS[crop]

  return (
    <>
      <SeedSelect value={crop} onChange={setCrop} />
      <div className="seed-card">
        <CropIcon crop={crop} size={52} />
        <ul>
          <li>Amadurece em <b>{formatDuration(info.growTicks)}</b></li>
          <li>Vende por <CoinIcon size={13} /> <b>{info.sellPrice}</b> (lucro <b>{info.sellPrice - info.seedPrice}</b>)</li>
          <li>Você tem <b>{inventory[crop] ?? 0}</b> semente(s)</li>
        </ul>
      </div>
      <p className="muted buy-label">Comprar:</p>
      <div className="buy-row">
        {BUY_AMOUNTS.map((n) => (
          <button key={n} className="btn" disabled={money < info.seedPrice * n} onClick={() => buySeed(crop, n)}>
            ×{n} · <CoinIcon size={15} /> {info.seedPrice * n}
          </button>
        ))}
      </div>
    </>
  )
}

function BuyPlot() {
  const money = useGameStore((s) => s.data?.money ?? 0)
  const price = useGameStore((s) => (s.data ? plotPrice(s.data) : 0))
  const plotCount = useGameStore((s) => s.data?.plots.length ?? 0)
  const buyingPlot = useGameStore((s) => s.buyingPlot)
  const setBuyingPlot = useGameStore((s) => s.setBuyingPlot)

  return (
    <div className="shop-row">
      <div className="shop-info">
        <b>Terreno</b> <span className="muted">(você tem {plotCount})</span>
        <small>{buyingPlot ? 'Clique num terreno destacado no mapa' : 'Um terreno novo 10x10 ao lado de um que você já tem'}</small>
      </div>
      <button className="btn" disabled={!buyingPlot && money < price} onClick={() => setBuyingPlot(!buyingPlot)}>
        {buyingPlot ? 'Cancelar' : <><CoinIcon size={16} /> {price}</>}
      </button>
    </div>
  )
}

function SellFruits() {
  const inventory = useGameStore((s) => s.data?.inventory ?? {})
  const sellFruit = useGameStore((s) => s.sellFruit)
  const readyTrees = useGameStore((s) => s.readyTrees)
  const ready = readyTrees ? readyTrees.split(',').length : 0
  const owned = FRUIT_ORDER.filter((id) => (inventory[id] ?? 0) > 0)

  return (
    <>
      {owned.length === 0 && <p className="muted">Você não tem frutas. Clique nas árvores com frutas no mapa para colher.</p>}
      {owned.map((id) => {
        const qty = inventory[id] ?? 0
        return (
          <div className="shop-row" key={id}>
            <FruitIcon fruit={id} size={40} />
            <div className="shop-info">
              <b>{FRUITS[id].name}</b> <span className="muted">(você tem {qty})</span>
              <small>
                <CoinIcon size={13} /> {FRUITS[id].sellPrice} cada
              </small>
            </div>
            <button className="btn" onClick={() => sellFruit(id)}>
              Vender tudo · <CoinIcon size={15} /> {FRUITS[id].sellPrice * qty}
            </button>
          </div>
        )
      })}
      <p className="muted">
        Árvores com frutas agora: {ready}/{TREES.length}. Cada colheita dá {FRUITS_PER_HARVEST} frutas e a árvore
        repõe depois de {FRUIT_REGROW_MS / 3600000} hora.
      </p>
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
        <li>Teclas <b>1</b> a <b>7</b>: escolhe a semente.</li>
        <li>Clique numa árvore com frutas para colher; venda na Loja.</li>
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
              <td>{formatDuration(CROPS[id].growTicks)}</td>
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

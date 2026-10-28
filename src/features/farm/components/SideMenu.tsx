import { useEffect, useRef, useState } from 'react'
import { CROP_ORDER, CROPS, formatDuration, type CropId } from '@/features/farm/model/crops'
import { TREES } from '@/features/farm/model/trees'
import { GRID_SIZE, plotPrice } from '@/features/farm/model/state'
import {
  BARN,
  barnReadyCount,
  GROWTH_BONUS,
  WATERING_CAN,
  WELL,
  FERTILIZER,
  ITEM_ORDER,
  itemName,
  ITEMS,
  MACHINES,
  machineReadyCount,
  sameBuilding,
  type BuildingRef,
  type ItemKind,
} from '@/features/farm/model/production'
import { serverNow, useFarmStore } from '../store'
import { Button, IconButton, Panel } from '@/shared/ui'
import { CloseIcon, CoinIcon } from '@/shared/ui/icons'
import { BulbIcon, CropIcon, PlotIcon, ShopIcon } from './icons'
import { BarnIcon, BuildingIcon, CanIcon, ItemIcon, MachineIcon, WellIcon } from './itemIcons'

type Section = 'shop' | 'storage' | 'yard' | 'tips'

const SECTIONS: { id: Section; Icon: (props: { size?: number }) => React.JSX.Element; title: string }[] = [
  { id: 'shop', Icon: ShopIcon, title: 'Loja' },
  { id: 'storage', Icon: (p) => <ItemIcon itemId="cornmeal" {...p} />, title: 'Armazém' },
  { id: 'yard', Icon: BarnIcon, title: 'Construções' },
  { id: 'tips', Icon: BulbIcon, title: 'Dicas' },
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

  // Escolheu um prédio para construir (aqui ou no painel do prédio): fecha o painel para o mapa ficar livre
  useEffect(
    () =>
      useFarmStore.subscribe((s, prev) => {
        if (s.placing && !prev.placing) setOpen(null)
      }),
    [],
  )

  const current = SECTIONS.find((s) => s.id === open)

  return (
    <div className="side-menu">
      <nav className={`side-rail ${open ? 'has-open' : ''}`}>
        {SECTIONS.map((s) => (
          <IconButton
            key={s.id}
            className="rail-btn"
            pressed={open === s.id}
            title={s.title}
            aria-label={s.title}
            onClick={() => setOpen(open === s.id ? null : s.id)}
          >
            <s.Icon size={34} />
          </IconButton>
        ))}
      </nav>

      {current && (
        <Panel className="side-panel">
          <h2>
            <span className="panel-title">
              <current.Icon size={26} /> {current.title}
            </span>
            <IconButton size="sm" aria-label="Fechar" onClick={() => setOpen(null)}>
              <CloseIcon size={20} />
            </IconButton>
          </h2>
          <div className="side-body">
            {open === 'shop' && <ShopPanel />}
            {open === 'storage' && <StoragePanel />}
            {open === 'yard' && <YardPanel />}
            {open === 'tips' && <TipsPanel />}
          </div>
        </Panel>
      )}
    </div>
  )
}

function ShopPanel() {
  const money = useFarmStore((s) => s.data?.money ?? 0)

  return (
    <>
      <p className="muted">
        Seu dinheiro: <CoinIcon size={16} /> {money}
      </p>
      <BuySeeds />
      <BuyPlot />
      <BuyTools />
      <BuyBuildings />
      <p className="muted">Para vender a colheita, abra o Armazém. Para usar o que você construiu, clique no prédio no mapa.</p>
    </>
  )
}

// Select próprio (o <select> do navegador não aceita ícones nem estilo): botão que abre uma lista
function SeedSelect({ value, onChange }: { value: CropId; onChange: (crop: CropId) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const money = useFarmStore((s) => s.data?.money ?? 0)

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
              <span className="select-time">{formatDuration(CROPS[id].growSeconds)}</span>
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
  const money = useFarmStore((s) => s.data?.money ?? 0)
  const inventory = useFarmStore((s) => s.data?.inventory ?? {})
  const buySeed = useFarmStore((s) => s.buySeed)
  const [crop, setCrop] = useState<CropId>(CROP_ORDER[0])
  const info = CROPS[crop]

  return (
    <>
      <SeedSelect value={crop} onChange={setCrop} />
      <div className="seed-card">
        <CropIcon crop={crop} size={52} />
        <ul>
          <li>Amadurece em <b>{formatDuration(info.growSeconds)}</b></li>
          <li>A colheita vale <CoinIcon size={13} /> <b>{info.sellPrice}</b> (lucro <b>{info.sellPrice - info.seedPrice}</b>)</li>
          <li>Você tem <b>{inventory[crop] ?? 0}</b> semente(s)</li>
        </ul>
      </div>
      <p className="muted buy-label">Comprar:</p>
      <div className="buy-row">
        {BUY_AMOUNTS.map((n) => (
          <Button key={n} disabled={money < info.seedPrice * n} onClick={() => buySeed(crop, n)}>
            ×{n} · <CoinIcon size={15} /> {info.seedPrice * n}
          </Button>
        ))}
      </div>
    </>
  )
}

function BuyPlot() {
  const money = useFarmStore((s) => s.data?.money ?? 0)
  const price = useFarmStore((s) => (s.data ? plotPrice(s.data) : 0))
  const plotCount = useFarmStore((s) => s.data?.plots.length ?? 0)
  const buyingPlot = useFarmStore((s) => s.buyingPlot)
  const setBuyingPlot = useFarmStore((s) => s.setBuyingPlot)

  const missing = price - money

  return (
    <div className="plot-shop">
      <p className="muted buy-label">Terreno:</p>
      <div className="seed-card">
        <PlotIcon size={52} />
        <ul>
          <li>Você tem <b>{plotCount}</b> terreno{plotCount === 1 ? '' : 's'}</li>
          <li>Novo terreno <b>{GRID_SIZE}x{GRID_SIZE}</b>, colado a um seu</li>
          <li>
            Custa <CoinIcon size={13} /> <b>{price}</b>
            {missing > 0 && <span className="plot-missing"> (faltam {missing})</span>}
          </li>
        </ul>
      </div>
      <Button className="plot-buy" variant={buyingPlot ? 'danger' : 'primary'} disabled={!buyingPlot && missing > 0} onClick={() => setBuyingPlot(!buyingPlot)}>
        {buyingPlot ? 'Cancelar escolha' : <>Escolher no mapa · <CoinIcon size={15} /> {price}</>}
      </Button>
      {buyingPlot && <p className="muted plot-hint">Clique num dos terrenos destacados no mapa (Esc cancela).</p>}
    </div>
  )
}

const KIND_TITLE: Record<ItemKind, string> = {
  crop: 'Colheitas',
  fruit: 'Frutas',
  animal_product: 'Dos animais',
  product: 'Das máquinas',
}

// Armazém: tudo que o jogador tem (menos sementes), por tipo, com o botão de vender
function StoragePanel() {
  const inventory = useFarmStore((s) => s.data?.inventory ?? {})
  const sellItem = useFarmStore((s) => s.sellItem)
  const readyTrees = useFarmStore((s) => s.readyTrees)
  const ready = readyTrees ? readyTrees.split(',').length : 0
  const owned = ITEM_ORDER.filter((id) => (inventory[id] ?? 0) > 0)
  const kinds = (Object.keys(KIND_TITLE) as ItemKind[]).filter((k) => owned.some((id) => ITEMS[id].kind === k))
  const total = owned.reduce((sum, id) => sum + (ITEMS[id].sellPrice ?? 0) * (inventory[id] ?? 0), 0)

  return (
    <>
      {owned.length === 0 ? (
        <p className="muted">O armazém está vazio. Colha as plantas maduras e as árvores com frutas; o que você colhe vem para cá.</p>
      ) : (
        <p className="muted">
          Tudo junto vale <CoinIcon size={13} /> <b>{total}</b>. Venda aqui ou use nas máquinas.
        </p>
      )}
      {kinds.map((kind) => (
        <div key={kind}>
          <h3>{KIND_TITLE[kind]}</h3>
          {owned
            .filter((id) => ITEMS[id].kind === kind)
            .map((id) => {
              const qty = inventory[id] ?? 0
              const price = ITEMS[id].sellPrice
              return (
                <div className="shop-row" key={id}>
                  <ItemIcon itemId={id} size={40} />
                  <div className="shop-info">
                    <b>{ITEMS[id].name}</b> <span className="muted">({qty})</span>
                    <small>
                      {price != null ? (
                        <>
                          <CoinIcon size={13} /> {price} cada
                        </>
                      ) : id === FERTILIZER.itemId ? (
                        'escolha na barra e clique na terra arada'
                      ) : (
                        'para os animais do celeiro'
                      )}
                    </small>
                  </div>
                  {price != null && (
                    <div className="sell-buttons">
                      {qty > 1 && (
                        <Button size="sm" onClick={() => sellItem(id, 1)} title="Vender 1">
                          ×1
                        </Button>
                      )}
                      <Button onClick={() => sellItem(id)} title="Vender todos">
                        Tudo · <CoinIcon size={15} /> {price * qty}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      ))}
      <p className="muted">
        Árvores com frutas agora: {ready}/{TREES.length}.
        {TREES[0] && ` Cada colheita dá ${TREES[0].fruitsPerHarvest} frutas e a árvore repõe depois de ${formatDuration(TREES[0].regrowMs / 1000)}.`}
      </p>
    </>
  )
}

// Ferramentas: o regador (compra uma vez; enche no poço)
function BuyTools() {
  const money = useFarmStore((s) => s.data?.money ?? 0)
  const charges = useFarmStore((s) => s.data?.canCharges ?? null)
  const hasWell = useFarmStore((s) => !!s.data?.well)
  const buyCan = useFarmStore((s) => s.buyCan)
  return (
    <div className="build-shop">
      <p className="muted buy-label">Ferramentas:</p>
      <div className="shop-row">
        <CanIcon size={40} />
        <span className="shop-info">
          <b>Regador</b>
          <small>
            {charges === null
              ? `${WATERING_CAN.charges} cargas · a planta regada cresce ${Math.round(GROWTH_BONUS.water * 100)}% mais rápido`
              : `${charges}/${WATERING_CAN.charges} cargas${hasWell ? ' · encha no poço' : ' · construa um poço para encher'}`}
          </small>
        </span>
        {charges === null ? (
          <Button disabled={money < WATERING_CAN.price} onClick={buyCan}>
            <CoinIcon size={14} /> {WATERING_CAN.price}
          </Button>
        ) : (
          <span className="muted">comprado</span>
        )}
      </div>
    </div>
  )
}

// Loja de prédios: o que ainda não foi construído, com o preço. Construir põe a prévia no mapa para o jogador
// clicar onde ele vai ficar; clicar no resto da linha mostra o que o prédio faz.
function BuyBuildings() {
  const data = useFarmStore((s) => s.data)
  const placing = useFarmStore((s) => s.placing)
  const { startPlacing, openBuilding } = useFarmStore.getState()
  if (!data) return null
  const items: { ref: BuildingRef; name: string; price: number; detail: string }[] = [
    ...(data.barn.capacity === 0 ? [{ ref: { kind: 'barn' as const }, name: 'Celeiro', price: BARN.price, detail: 'galinhas, vacas e ovelhas' }] : []),
    ...(!data.well ? [{ ref: { kind: 'well' as const }, name: 'Poço', price: WELL.price, detail: '1x1 · enche o regador' }] : []),
    ...MACHINES.filter((m) => !data.machines[m.id]).map((m) => ({
      ref: { kind: 'machine' as const, id: m.id },
      name: m.name,
      price: m.buyPrice,
      detail: `${m.size}x${m.size} · ${m.recipes.map((r) => itemName(r.outputItemId).toLowerCase()).join(', ')}`,
    })),
  ]
  return (
    <div className="build-shop">
      <p className="muted buy-label">Construções:</p>
      {items.length === 0 && <p className="muted">Você já construiu tudo.</p>}
      {items.map((b) => {
        const active = placing !== null && sameBuilding(placing, b.ref)
        return (
          <div className="shop-row" key={b.name}>
            <button className="build-info" onClick={() => openBuilding(b.ref)} title="Ver o que faz">
              <BuildingIcon target={b.ref} size={40} />
              <span className="shop-info">
                <b>{b.name}</b>
                <small>{b.detail}</small>
              </span>
            </button>
            <Button
 variant={active ? 'danger' : 'primary'}
 disabled={!active && data.money < b.price}
 onClick={() => startPlacing(active ? null : b.ref)}
 >
              {active ? 'Cancelar' : <><CoinIcon size={14} /> {b.price}</>}
            </Button>
          </div>
        )
      })}
    </div>
  )
}

// Prédios construídos: o estado de cada um; clicar abre o painel (o mesmo de clicar no mapa)
function YardPanel() {
  const data = useFarmStore((s) => s.data)
  const openBuilding = useFarmStore((s) => s.openBuilding)
  useFarmStore((s) => s.readyBuildings) // atualiza quando algo fica pronto
  if (!data) return null
  const now = serverNow()
  const barnReady = barnReadyCount(data.barn, now)
  const built = MACHINES.filter((m) => data.machines[m.id])

  return (
    <>
      <p className="muted">Clique num prédio (aqui ou no mapa) para usar. No mapa, arraste para mudar de lugar. Para construir, vá na Loja.</p>
      {data.barn.capacity === 0 && !data.well && built.length === 0 && <p className="muted">Nada construído ainda.</p>}
      {data.well && (
        <button className="shop-row yard-row" onClick={() => openBuilding({ kind: 'well' })}>
          <WellIcon size={40} />
          <span className="shop-info">
            <b>Poço</b>
            <small>{data.canCharges === null ? 'compre o regador na Loja' : `regador: ${data.canCharges}/${WATERING_CAN.charges} cargas`}</small>
          </span>
        </button>
      )}
      {data.barn.capacity > 0 && (
        <button className="shop-row yard-row" onClick={() => openBuilding({ kind: 'barn' })}>
          <BarnIcon size={40} />
          <span className="shop-info">
            <b>Celeiro</b>
            <small>{`${data.barn.animals.length}/${data.barn.capacity} animais${barnReady > 0 ? ` · ${barnReady} pronto(s)` : ''}`}</small>
          </span>
        </button>
      )}
      {built.map((m) => {
        const state = data.machines[m.id]
        const ready = machineReadyCount(data, m.id, now)
        return (
          <button key={m.id} className="shop-row yard-row" onClick={() => openBuilding({ kind: 'machine', id: m.id })}>
            <MachineIcon machineId={m.id} size={40} />
            <span className="shop-info">
              <b>{m.name}</b>
              <small>
                {ready > 0 ? (
                  <span className="ready-text">{ready} pronto(s)</span>
                ) : state.jobs.length > 0 ? (
                  `trabalhando (${state.jobs.length}/${m.queueSize})`
                ) : (
                  'parada'
                )}
              </small>
            </span>
          </button>
        )
      })}
    </>
  )
}

function TipsPanel() {
  return (
    <>
      <h3>Controles</h3>
      <ul>
        <li>Arraste o mapa com o mouse para se mover.</li>
        <li>Role a roda do mouse para aproximar e afastar.</li>
        <li><b>W A S D</b>: o fazendeiro anda para cima, esquerda, baixo e direita da tela (segure para continuar).</li>
        <li>Clique esquerdo no chão: o fazendeiro anda até lá.</li>
        <li>Clique direito no chão: abre um menu com o que dá para fazer ali (arar, desfazer a aragem, plantar, colher, regar, adubar) e <b>Mover para cá</b>. No celular, é só tocar.</li>
        <li><b>Shift</b> + clique: ação direta na linha inteira, sem menu.</li>
        <li><b>Ctrl</b> + clique: ação direta na coluna inteira, sem menu.</li>
        <li>Teclas <b>1</b> a <b>9</b>: escolhem o item da barra (só aparece o que você tem).</li>
        <li>Clique numa árvore com frutas para colher.</li>
        <li>Tudo que você colhe vai para o <b>Armazém</b>: venda lá ou use nas máquinas.</li>
        <li>Na <b>Loja</b>, escolha um prédio e clique no mapa onde construir. Clique num prédio para usar; arraste para mudar de lugar.</li>
        <li>Máquinas: escolha a receita, espere e mande o fazendeiro coletar. A fila tem 2 lugares.</li>
        <li>Celeiro: os animais comem a ração da Fábrica de ração e produzem ovos, leite e lã.</li>
        <li>Adubo (da Composteira): escolha na barra e clique na terra arada. A planta cresce 30% mais rápido. Dá para fazer de tomate ou do esterco da galinha e da vaca. Vale antes ou depois de plantar.</li>
        <li>Regador (Loja): escolha na barra e clique na terra arada ou na planta: mais 30%, somando com o adubo. Gasta 1 carga por tile; encha no poço.</li>
        <li><b>Esc</b> fecha este menu.</li>
      </ul>
      <h3>Plantas</h3>
      <table className="crops">
        <thead>
          <tr><th>Planta</th><th>Cresce</th><th>Semente</th><th>Colheita</th></tr>
        </thead>
        <tbody>
          {CROP_ORDER.map((id) => (
            <tr key={id}>
              <td>{CROPS[id].name}</td>
              <td>{formatDuration(CROPS[id].growSeconds)}</td>
              <td>{CROPS[id].seedPrice}</td>
              <td>{CROPS[id].sellPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">Só dá para colher quando a planta está madura. A colheita vai para o armazém.</p>
    </>
  )
}

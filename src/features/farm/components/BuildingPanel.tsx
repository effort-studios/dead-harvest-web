import { useEffect } from 'react'
import { formatDuration } from '@/features/farm/model/crops'
import {
  animalById,
  ANIMALS,
  animalStatus,
  BARN,
  barnExpandPrice,
  barnHungryCount,
  barnReadyCount,
  itemName,
  ITEMS,
  jobReady,
  machineById,
  missingInputs,
  RECIPES,
  WATERING_CAN,
  WELL,
  type MachineInfo,
  type RecipeInfo,
} from '@/features/farm/model/production'
import { Button, Chip, IconButton, Panel, ProgressBar } from '@/shared/ui'
import { CloseIcon, CoinIcon } from '@/shared/ui/icons'
import { serverNow, useFarmStore } from '../store'
import { AnimalIcon, BuildingIcon, ItemIcon } from './itemIcons'

// Painel do prédio clicado no mapa (ou aberto pela loja/menu Construções): o que a máquina faz e a fila dela,
// os animais do celeiro, ou o regador no poço. Prédio ainda não construído mostra o que ele faz e o botão de construir. Fica à direita, sem bloquear o mapa. O tempo restante anda junto com o relógio da tela.
export function BuildingPanel() {
  const building = useFarmStore((s) => s.building)
  const close = () => useFarmStore.getState().openBuilding(null)

  useEffect(() => {
    if (!building) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') useFarmStore.getState().openBuilding(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [building])

  const machine = building?.kind === 'machine' ? machineById(building.id) : undefined
  if (!building || (building.kind === 'machine' && !machine)) return null

  return (
    <Panel className="side-panel building-panel">
      <h2>
        <span className="panel-title">
          <BuildingIcon target={building} size={30} /> {machine ? machine.name : building.kind === 'well' ? 'Poço' : 'Celeiro'}
        </span>
        <IconButton size="sm" aria-label="Fechar" onClick={close}>
          <CloseIcon size={20} />
        </IconButton>
      </h2>
      <div className="side-body">{machine ? <MachineBody machine={machine} /> : building.kind === 'well' ? <WellBody /> : <BarnBody />}</div>
    </Panel>
  )
}

// Re-renderiza a cada segundo (o relógio da tela) para o tempo restante andar
function useNow() {
  useFarmStore((s) => s.data?.time)
  return serverNow()
}

const duration = (ms: number) => formatDuration(Math.max(1, Math.ceil(ms / 1000)))

function Progress({ value }: { value: number }) {
  return <ProgressBar value={value} size="sm" />
}

function Price({ value }: { value: number }) {
  return (
    <>
      <CoinIcon size={14} /> {value}
    </>
  )
}

// ---------- Máquina ----------

function MachineBody({ machine }: { machine: MachineInfo }) {
  const owned = useFarmStore((s) => !!s.data?.machines[machine.id])
  return owned ? <MachineQueue machine={machine} /> : <BuyMachine machine={machine} />
}

function BuyMachine({ machine }: { machine: MachineInfo }) {
  const money = useFarmStore((s) => s.data?.money ?? 0)
  const startPlacing = useFarmStore((s) => s.startPlacing)
  return (
    <>
      <p>
        Ocupa {machine.size}x{machine.size} {machine.size === 1 ? 'célula' : 'células'} do mapa. Ela faz:
      </p>
      {machine.recipes.map((r) => (
        <RecipeRow key={r.id} recipe={r} />
      ))}
      <Button className="wide" disabled={money < machine.buyPrice} onClick={() => startPlacing({ kind: 'machine', id: machine.id })}>
        Construir · <Price value={machine.buyPrice} />
      </Button>
      <p className="muted center">Depois é só clicar no mapa onde ela vai ficar.</p>
      {money < machine.buyPrice && <p className="muted center">Faltam {machine.buyPrice - money} moedas.</p>}
    </>
  )
}

function MachineQueue({ machine }: { machine: MachineInfo }) {
  const now = useNow()
  const jobs = useFarmStore((s) => s.data?.machines[machine.id]?.jobs ?? [])
  const collecting = useFarmStore((s) => s.data?.farmer.jobs.some((j) => j.action === 'collect_machine' && j.machineId === machine.id) ?? false)
  const collectMachine = useFarmStore((s) => s.collectMachine)
  const ready = jobs.filter((j) => jobReady(j, now)).length
  const full = jobs.length >= machine.queueSize

  return (
    <>
      <h3>
        Fila ({jobs.length}/{machine.queueSize})
      </h3>
      {jobs.length === 0 && <p className="muted">Parada. Escolha uma receita abaixo.</p>}
      {jobs.map((job) => {
        const recipe = RECIPES[job.recipeId]
        const done = jobReady(job, now)
        const started = now >= job.startsAt
        return (
          <div className="queue-row" key={job.id}>
            <ItemIcon itemId={recipe?.outputItemId ?? job.recipeId} size={34} />
            <div className="shop-info">
              <b>{recipe ? itemName(recipe.outputItemId) : job.recipeId}</b>
              {recipe && recipe.outputQuantity > 1 && <span className="muted"> ×{recipe.outputQuantity}</span>}
              {done ? (
                <small className="ready-text">Pronto!</small>
              ) : started ? (
                <>
                  <Progress value={(now - job.startsAt) / (job.readyAt - job.startsAt)} />
                  <small>falta {duration(job.readyAt - now)}</small>
                </>
              ) : (
                <small>na fila · começa em {duration(job.startsAt - now)}</small>
              )}
            </div>
          </div>
        )
      })}
      {ready > 0 && (
        <Button className="wide" disabled={collecting} onClick={() => collectMachine(machine.id)}>
          {collecting ? 'O fazendeiro está indo buscar...' : `Coletar (${ready})`}
        </Button>
      )}
      <h3>Receitas</h3>
      {full && <p className="muted">Fila cheia: colete o que ficou pronto para liberar espaço.</p>}
      {machine.recipes.map((r) => (
        <RecipeRow key={r.id} recipe={r} canStart={!full} />
      ))}
    </>
  )
}

// Uma receita: o que sai, quanto vale, quanto demora e os ingredientes (com o que falta em vermelho)
function RecipeRow({ recipe, canStart }: { recipe: RecipeInfo; canStart?: boolean }) {
  const inventory = useFarmStore((s) => s.data?.inventory ?? {})
  const startRecipe = useFarmStore((s) => s.startRecipe)
  const missing = missingInputs(inventory, recipe)
  const out = ITEMS[recipe.outputItemId]
  return (
    <div className="recipe">
      <div className="recipe-head">
        <ItemIcon itemId={recipe.outputItemId} size={38} />
        <div className="shop-info">
          <b>
            {itemName(recipe.outputItemId)}
            {recipe.outputQuantity > 1 && ` ×${recipe.outputQuantity}`}
          </b>
          <small>
            {formatDuration(recipe.seconds)} ·{' '}
            {out?.sellPrice != null ? (
              <>
                vende por <Price value={out.sellPrice} />
              </>
            ) : (
              'para usar na fazenda'
            )}
          </small>
        </div>
        {canStart !== undefined && (
          <Button disabled={!canStart || missing.length > 0} onClick={() => startRecipe(recipe.id)}>
            Produzir
          </Button>
        )}
      </div>
      <div className="recipe-inputs">
        {recipe.inputs.map((i) => {
          const have = inventory[i.itemId] ?? 0
          return (
            <Chip key={i.itemId} lacking={have < i.quantity} title={`${itemName(i.itemId)}: você tem ${have}`}>
              <ItemIcon itemId={i.itemId} size={20} /> {i.quantity} {itemName(i.itemId).toLowerCase()}
              <span className="chip-have">({have})</span>
            </Chip>
          )
        })}
      </div>
    </div>
  )
}

// ---------- Poço ----------

function WellBody() {
  const data = useFarmStore((s) => s.data)
  const startPlacing = useFarmStore((s) => s.startPlacing)
  const refillCan = useFarmStore((s) => s.refillCan)
  const going = useFarmStore((s) => s.data?.farmer.jobs.some((j) => j.action === 'refill_can') ?? false)
  if (!data) return null
  if (!data.well) {
    return (
      <>
        <p>No poço o fazendeiro enche o regador. Ocupa 1 célula do mapa.</p>
        <Button className="wide" disabled={data.money < WELL.price} onClick={() => startPlacing({ kind: 'well' })}>
          Construir · <Price value={WELL.price} />
        </Button>
        <p className="muted center">Depois é só clicar no mapa onde ele vai ficar.</p>
      </>
    )
  }
  if (data.canCharges === null) return <p>Compre o regador na Loja (Ferramentas) para encher aqui.</p>
  const full = data.canCharges >= WATERING_CAN.charges
  return (
    <>
      <p>
        Regador:{' '}
        <b>
          {data.canCharges}/{WATERING_CAN.charges}
        </b>{' '}
        cargas
      </p>
      <Progress value={data.canCharges / WATERING_CAN.charges} />
      <Button className="wide" disabled={full || going} onClick={refillCan}>
        {going ? 'O fazendeiro está indo encher...' : full ? 'O regador está cheio' : 'Encher o regador'}
      </Button>
    </>
  )
}

// ---------- Celeiro ----------

function BarnBody() {
  const capacity = useFarmStore((s) => s.data?.barn.capacity ?? 0)
  return capacity > 0 ? <Barn /> : <BuyBarn />
}

function BuyBarn() {
  const money = useFarmStore((s) => s.data?.money ?? 0)
  const startPlacing = useFarmStore((s) => s.startPlacing)
  return (
    <>
      <p>No celeiro moram os animais: galinhas dão ovos, vacas dão leite e ovelhas dão lã. Eles comem a ração da Fábrica de ração.</p>
      <p>
        Começa com <b>{BARN.startCapacity} baias</b> e dá para ampliar até {BARN.maxCapacity}.
      </p>
      <Button className="wide" disabled={money < BARN.price} onClick={() => startPlacing({ kind: 'barn' })}>
        Construir o celeiro · <Price value={BARN.price} />
      </Button>
      <p className="muted center">Depois é só clicar no mapa onde ele vai ficar (com o cercadinho dos animais ao lado).</p>
      {money < BARN.price && <p className="muted center">Faltam {BARN.price - money} moedas.</p>}
    </>
  )
}

function Barn() {
  const now = useNow()
  const barn = useFarmStore((s) => s.data!.barn)
  const money = useFarmStore((s) => s.data?.money ?? 0)
  const inventory = useFarmStore((s) => s.data?.inventory ?? {})
  const collecting = useFarmStore((s) => s.data?.farmer.jobs.some((j) => j.action === 'collect_barn') ?? false)
  const { feedAnimals, collectBarn, buyAnimal, expandBarn } = useFarmStore.getState()
  const ready = barnReadyCount(barn, now)
  const hungry = barnHungryCount(barn)
  const full = barn.animals.length >= barn.capacity
  const expandPrice = barnExpandPrice(barn.capacity)
  const feedItems = [...new Set(ANIMALS.map((a) => a.feedItemId))]

  return (
    <>
      <p className="muted">
        Baias:{' '}
        <b>
          {barn.animals.length}/{barn.capacity}
        </b>{' '}
        ·{' '}
        {feedItems.map((id) => (
          <span key={id}>
            {itemName(id)} no armazém: <b>{inventory[id] ?? 0}</b>
          </span>
        ))}
      </p>
      <div className="buy-row two">
        <Button disabled={hungry === 0} onClick={feedAnimals} title="Dá ração aos que estão com fome">
          Alimentar ({hungry})
        </Button>
        <Button disabled={ready === 0 || collecting} onClick={collectBarn} title="O fazendeiro vai ao celeiro e já dá ração de novo">
          {collecting ? 'Indo...' : `Coletar (${ready})`}
        </Button>
      </div>

      {barn.animals.length === 0 && <p className="muted">Nenhum animal ainda. Compre abaixo.</p>}
      {barn.animals.map((owned) => {
        const info = animalById(owned.animalId)
        const status = animalStatus(owned, now)
        return (
          <div className="queue-row" key={owned.id}>
            <AnimalIcon animalId={owned.animalId} size={34} />
            <div className="shop-info">
              <b>{info?.name ?? owned.animalId}</b>
              {status.kind === 'hungry' && <small className="hungry-text">Com fome</small>}
              {status.kind === 'ready' && <small className="ready-text">{info ? itemName(info.productItemId) : ''} pronto!</small>}
              {status.kind === 'producing' && (
                <>
                  <Progress value={status.progress} />
                  <small>
                    {info ? itemName(info.productItemId).toLowerCase() : ''} em {duration(status.readyAt - now)}
                  </small>
                </>
              )}
            </div>
          </div>
        )
      })}

      <h3>Comprar animais</h3>
      {full && <p className="muted">Celeiro cheio: amplie para ter mais baias.</p>}
      {ANIMALS.map((a) => (
        <div className="shop-row" key={a.id}>
          <AnimalIcon animalId={a.id} size={40} />
          <div className="shop-info">
            <b>{a.name}</b>
            <small>
              come {a.feedQuantity} {itemName(a.feedItemId).toLowerCase()} · dá {itemName(a.productItemId).toLowerCase()}
              {a.byproductItemId && ` + ${a.byproductQuantity} ${itemName(a.byproductItemId).toLowerCase()}`} a cada {formatDuration(a.produceSeconds)}
            </small>
          </div>
          <Button disabled={full || money < a.buyPrice} onClick={() => buyAnimal(a.id)}>
            <Price value={a.buyPrice} />
          </Button>
        </div>
      ))}

      <h3>Ampliar</h3>
      {barn.capacity >= BARN.maxCapacity ? (
        <p className="muted">O celeiro já está no tamanho máximo ({BARN.maxCapacity} baias).</p>
      ) : (
        <Button className="wide" disabled={money < expandPrice} onClick={expandBarn}>
          +{BARN.expandBy} baias · <Price value={expandPrice} />
        </Button>
      )}
    </>
  )
}

import { useState, type ReactNode } from 'react'
import { Button, Chip, Field, IconButton, Input, Panel, Plate, ProgressBar, Select, Slot, Tabs, Tooltip } from '@/shared/ui'
import { CloseIcon, CoinIcon, MusicIcon } from '@/shared/ui/icons'
import styles from './UiKitPage.module.css'

const SCALES = ['1px', '2px', '3px']

// Vitrine do design system: cada componente em todos os estados. É daqui que se confere uma moldura nova antes de
// ela ir para a HUD. Abre em /ui-kit, sem login.
export function UiKitPage() {
  const [tab, setTab] = useState('loja')
  const [selected, setSelected] = useState(1)
  const [scale, setScale] = useState('2px')

  return (
    <div className={styles.page} style={{ '--px': scale } as React.CSSProperties}>
      <header className={styles.header}>
        <h1>UI kit</h1>
        <div className={styles.scale}>
          Tamanho do pixel:
          {SCALES.map((s) => (
            <Button key={s} size="sm" pressed={s === scale} onClick={() => setScale(s)}>
              {s}
            </Button>
          ))}
        </div>
      </header>

      <Section title="Panel">
        <Panel className={styles.demoPanel}>
          <strong>Loja</strong>
          <p>Moldura de painel com interior escuro. O conteúdo respeita o padding.</p>
        </Panel>
      </Section>

      <Section title="Button">
        <Row label="primário">
          <Button>Normal</Button>
          <Button disabled>Desabilitado</Button>
          <Button pressed>Ligado</Button>
          <Button size="sm">Pequeno</Button>
        </Row>
        <Row label="perigo">
          <Button variant="danger">Parar fazendeiro (3)</Button>
          <Button variant="danger" disabled>
            Desabilitado
          </Button>
        </Row>
        <Row label="só ícone">
          <IconButton aria-label="Música"><MusicIcon size={26} /></IconButton>
          <IconButton size="sm" aria-label="Fechar"><CloseIcon size={18} /></IconButton>
          <IconButton disabled aria-label="Desabilitado"><MusicIcon size={26} /></IconButton>
        </Row>
      </Section>

      <Section title="Slot">
        <Row label="barra de itens">
          {[1, 2, 3, 4].map((n) => (
            <Slot key={n} hotkey={n} count={n === 1 ? 12 : undefined} selected={selected === n} onClick={() => setSelected(n)}>
              {n < 4 && <CoinIcon size={30} />}
            </Slot>
          ))}
          <Slot disabled hotkey={5} />
        </Row>
      </Section>

      <Section title="Plate">
        <Row label="valores">
          <Plate>Fabris</Plate>
          <Plate>
            <CoinIcon size={20} /> 28799
          </Plate>
          <Plate size="lg">18:33</Plate>
        </Row>
      </Section>

      <Section title="Field (Input, Select)">
        <div className={styles.fields}>
          <Field label="E-mail" hint="O mesmo do cadastro">
            <Input placeholder="voce@exemplo.com" />
          </Field>
          <Field label="Senha" error="Senha curta demais">
            <Input type="password" invalid defaultValue="123" />
          </Field>
          <Field label="Semente">
            <Select defaultValue="milho">
              <option value="milho">Milho</option>
              <option value="tomate">Tomate</option>
            </Select>
          </Field>
          <Field label="Desabilitado">
            <Input disabled defaultValue="Bloqueado" />
          </Field>
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs
          items={[
            { id: 'loja', label: 'Loja' },
            { id: 'armazem', label: 'Armazém' },
            { id: 'construir', label: 'Construir' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </Section>

      <Section title="Chip">
        <Row label="ingredientes">
          <Chip>Milho 3/3</Chip>
          <Chip lacking>Ovo 0/2</Chip>
        </Row>
      </Section>

      <Section title="ProgressBar">
        <div className={styles.bars}>
          <ProgressBar value={0.65} label="Produção" />
          <ProgressBar value={0.4} variant="health" label="Vida" />
          <ProgressBar value={0.85} variant="energy" label="Energia" />
          <ProgressBar value={0} label="Vazia" />
          <ProgressBar value={1} label="Cheia" />
        </div>
      </Section>

      <Section title="Tooltip">
        <Tooltip>
          <b>Milho</b>
          <small>Amadurece em 48min</small>
        </Tooltip>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.rowItems}>{children}</div>
    </div>
  )
}

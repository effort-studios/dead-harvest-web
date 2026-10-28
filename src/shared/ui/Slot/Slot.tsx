import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../cx'
import styles from './Slot.module.css'

type SlotProps = ComponentProps<'button'> & {
  selected?: boolean
  /** tecla de atalho, no canto de cima à esquerda */
  hotkey?: ReactNode
  /** quantidade, no canto de cima à direita */
  count?: ReactNode
}

// Quadrado afundado onde fica um item (barra de itens, inventário)
export function Slot({ selected, hotkey, count, className, children, type = 'button', ...props }: SlotProps) {
  return (
    <button type={type} aria-pressed={selected} className={cx(styles.slot, selected && styles.selected, className)} {...props}>
      {hotkey !== undefined && <span className={styles.hotkey}>{hotkey}</span>}
      {children}
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  )
}

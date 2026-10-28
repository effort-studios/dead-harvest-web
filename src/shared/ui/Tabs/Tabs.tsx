import type { ReactNode } from 'react'
import { cx } from '../cx'
import styles from './Tabs.module.css'

type TabsProps = {
  items: { id: string; label: ReactNode }[]
  value: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div role="tablist" className={cx(styles.tabs, className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === value}
          className={cx(styles.tab, item.id === value && styles.active)}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

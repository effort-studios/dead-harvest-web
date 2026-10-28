import type { ComponentProps } from 'react'
import { cx } from '../cx'
import styles from './Panel.module.css'

// Janela com moldura dourada e interior escuro (menus, lojas, login, perfil)
export function Panel({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx(styles.panel, className)} {...props} />
}

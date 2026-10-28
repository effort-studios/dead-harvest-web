import type { ComponentProps } from 'react'
import { cx } from '../cx'
import styles from './Tooltip.module.css'

// Balão de texto. A posição é de quem usa (o jogo move o balão junto com o mouse).
export function Tooltip({ className, ...props }: ComponentProps<'div'>) {
  return <div role="tooltip" className={cx(styles.tooltip, className)} {...props} />
}

import type { ComponentProps } from 'react'
import { cx } from '../cx'
import styles from './Chip.module.css'

// Etiqueta pequena (ingrediente, categoria). `lacking` marca o que está faltando.
export function Chip({ lacking, className, ...props }: ComponentProps<'span'> & { lacking?: boolean }) {
  return <span className={cx(styles.chip, lacking && styles.lacking, className)} {...props} />
}

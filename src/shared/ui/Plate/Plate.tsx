import type { ComponentProps } from 'react'
import { cx } from '../cx'
import styles from './Plate.module.css'

// Placa de texto só para mostrar um valor (nome, dinheiro, dia, hora)
export function Plate({ size = 'md', className, ...props }: ComponentProps<'div'> & { size?: 'md' | 'lg' }) {
  return <div className={cx(styles.plate, styles[size], className)} {...props} />
}

import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../cx'
import styles from './Field.module.css'

type FieldProps = { label: ReactNode; hint?: ReactNode; error?: ReactNode; className?: string; children: ReactNode }

// Rótulo + controle + dica ou erro. O controle é um Input ou um Select.
export function Field({ label, hint, error, className, children }: FieldProps) {
  return (
    <label className={cx(styles.field, className)}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? <span className={styles.error}>{error}</span> : hint && <span className={styles.hint}>{hint}</span>}
    </label>
  )
}

type ControlProps = { invalid?: boolean }

export function Input({ invalid, className, ...props }: ComponentProps<'input'> & ControlProps) {
  return <input aria-invalid={invalid} className={cx(styles.control, invalid && styles.invalid, className)} {...props} />
}

// A seta fica num invólucro: o fundo do select some por baixo do `fill` da moldura
export function Select({ invalid, className, ...props }: ComponentProps<'select'> & ControlProps) {
  return (
    <span className={styles.selectWrap}>
      <select aria-invalid={invalid} className={cx(styles.control, styles.select, invalid && styles.invalid, className)} {...props} />
    </span>
  )
}

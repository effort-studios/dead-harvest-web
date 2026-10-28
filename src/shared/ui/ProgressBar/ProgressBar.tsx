import { cx } from '../cx'
import styles from './ProgressBar.module.css'

type ProgressBarProps = {
  /** de 0 a 1 */
  value: number
  variant?: 'progress' | 'health' | 'energy'
  label?: string
  className?: string
}

// Barra para progresso de produção, vida e energia. Só a moldura é arte; o preenchimento é CSS.
export function ProgressBar({ value, variant = 'progress', label, className }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div className={cx(styles.bar, className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <span className={cx(styles.fill, styles[variant])} style={{ width: `${pct}%` }} />
    </div>
  )
}

import type { ComponentProps } from 'react'
import { cx } from '../cx'
import styles from './Button.module.css'

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'danger'
  size?: 'md' | 'sm'
  /** só um ícone dentro: o botão fica quadrado */
  iconOnly?: boolean
  /** botão de liga e desliga (aria-pressed): fica afundado enquanto ligado */
  pressed?: boolean
}

export function Button({ variant = 'primary', size = 'md', iconOnly, pressed, className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cx(styles.button, styles[variant], styles[size], iconOnly && styles.icon, pressed && styles.on, className)}
      {...props}
    />
  )
}

export function IconButton(props: Omit<ButtonProps, 'iconOnly'>) {
  return <Button iconOnly {...props} />
}

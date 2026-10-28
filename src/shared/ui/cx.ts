// Junta nomes de classe ignorando o que for falso: cx(styles.a, ativo && styles.b)
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

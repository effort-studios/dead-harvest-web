// Ícones do pacote Game Icons (Kenney, CC0). São imagens brancas usadas como "máscara":
// o ícone toma a cor do texto (currentColor), então muda de cor só com CSS.
export type IconName = 'cart' | 'question' | 'singleplayer' | 'information' | 'save' | 'cross'

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const url = `url(${import.meta.env.BASE_URL}assets/icons/${name}.png)`
  return (
    <i
      className="icon"
      aria-hidden="true"
      style={{ width: size, height: size, WebkitMaskImage: url, maskImage: url }}
    />
  )
}

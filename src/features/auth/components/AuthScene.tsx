import styles from './AuthScene.module.css'

// Fundo da tela de login: a fazenda ao pôr do sol (art/pixellab/raw/login/scene.png, 640 x 360 gerada na PixelLab,
// ampliada em 3x na tela cheia sem borrar). Só enfeite (aria-hidden).
export function AuthScene() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.vignette} />
    </div>
  )
}

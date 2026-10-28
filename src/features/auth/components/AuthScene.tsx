import type { CSSProperties } from 'react'
import styles from './AuthScene.module.css'

// Fundo da tela de login: a fazenda ao entardecer, com a lua subindo e uma horda de zumbis marchando.
// Só enfeite (aria-hidden), montado com a mesma arte do jogo, ampliada sem borrar.
export function AuthScene() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.sky} />
      <div className={styles.stars} />
      <img className={styles.moon} src="/assets/icons/moon.png" alt="" />
      <div className={styles.ground} />
      <div className={styles.fog} />

      <img className={`${styles.prop} ${styles.barn}`} src="/assets/world/barn.png" alt="" />
      <img className={`${styles.prop} ${styles.hay}`} src="/assets/world/hayStack.png" alt="" />
      <img className={`${styles.prop} ${styles.rock}`} src="/assets/world/rock.png" alt="" />
      <img className={`${styles.prop} ${styles.treeA}`} src="/assets/world/tree.png" alt="" />
      <img className={`${styles.prop} ${styles.treeB}`} src="/assets/world/tree_apple.png" alt="" />
      <img className={`${styles.prop} ${styles.bush}`} src="/assets/world/bush.png" alt="" />
      <span className={`${styles.prop} ${styles.cow}`} />
      <span className={`${styles.prop} ${styles.chicken}`} />

      {/* a horda: quanto mais longe (menor e mais alto), mais devagar */}
      <Zombie scale={1} bottom="30vh" duration={95} delay={-30} still={62} />
      <Zombie scale={1} bottom="28vh" duration={85} delay={-48} still={38} />
      <Zombie scale={1} bottom="31vh" duration={100} delay={-5} still={86} />
      <Zombie scale={2} bottom="17vh" duration={64} delay={-25} still={52} />
      <Zombie scale={2} bottom="20vh" duration={72} delay={-58} still={14} />

      <div className={styles.vignette} />
    </div>
  )
}

// Zumbi andando para a esquerda (8 quadros de 44 x 59, gerados na PixelLab), ampliado em número inteiro de vezes.
// `still`: onde ele fica (em vw) para quem prefere menos movimento.
function Zombie({ scale, bottom, duration, delay, still }: { scale: number; bottom: string; duration: number; delay: number; still: number }) {
  const style = {
    width: 44 * scale,
    height: 59 * scale,
    bottom,
    backgroundSize: `${352 * scale}px ${59 * scale}px`,
    '--scale': scale,
    '--dur': `${duration}s`,
    '--delay': `${delay}s`,
    '--still': `${still}vw`,
  } as CSSProperties
  return <span className={styles.zombie} style={style} />
}

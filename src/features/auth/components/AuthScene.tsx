import type { CSSProperties } from 'react'
import styles from './AuthScene.module.css'

// Fundo da tela de login: a fazenda ao entardecer, com a lua subindo e uma horda de zumbis marchando no horizonte.
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
      <Zombie scale={4} bottom="31vh" duration={95} delay={-30} still={62} />
      <Zombie scale={5} bottom="28vh" duration={80} delay={-48} still={38} />
      <Zombie scale={4} bottom="32vh" duration={100} delay={-5} still={86} />
      <Zombie scale={7} bottom="21vh" duration={62} delay={-25} still={52} />
      <Zombie scale={6} bottom="24vh" duration={70} delay={-58} still={14} />

      <div className={styles.vignette} />
    </div>
  )
}

// Silhueta de zumbi em pixels (12 x 17): braços esticados para a frente e olhos vermelhos
// `still`: onde ele fica (em vw) para quem prefere menos movimento
function Zombie({ scale, bottom, duration, delay, still }: { scale: number; bottom: string; duration: number; delay: number; still: number }) {
  const style = { width: 12 * scale, height: 17 * scale, bottom, animationDuration: `${duration}s`, animationDelay: `${delay}s`, '--still': `${still}vw` } as CSSProperties
  return (
    <svg className={styles.zombie} style={style} viewBox="0 0 12 17" shapeRendering="crispEdges">
      <g className={styles.body} style={{ animationDuration: `${duration / 28}s` }}>
        <rect x="5" y="1" width="4" height="4" />
        <rect x="4" y="5" width="6" height="6" />
        <rect x="0" y="5" width="5" height="1" />
        <rect x="0" y="7" width="4" height="1" />
        <rect x="4" y="11" width="2" height="6" />
        <rect x="7" y="11" width="2" height="5" />
        <rect className={styles.eye} x="5" y="2" width="1" height="1" />
        <rect className={styles.eye} x="7" y="2" width="1" height="1" />
      </g>
    </svg>
  )
}

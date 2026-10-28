import { useEffect, useRef } from 'react'
import { farmerPose, farmerWalkSpeed, type FreeWalkState } from '@/features/farm/model/farmer'
import { heldDirection, isWalkKey, stepWalk } from '@/features/farm/model/freeWalk'
import type { WalkPhase } from '@/features/farm/api'
import { serverNow, setLivePosition, settled, useFarmStore } from '@/features/farm/store'

// Andar livre com W A S D: o fazendeiro anda quadro a quadro aqui, sem esperar o servidor. Avisa o servidor
// ao começar (marca o horário), ao parar (posição final) e, no meio, de tempos em tempos para não perder
// o caminho se a aba fechar. O servidor confere a velocidade pelo tempo desde o aviso anterior. Devolve a posição de quem está andando
// (null = o desenho usa a pose do servidor).
//
// Com fila de tarefas, andar cancela a fila. Se uma tarefa entra na fila enquanto anda (clique no mapa), a
// tarefa vence: a caminhada para e só volta quando todas as teclas forem soltas.

const SYNC_MS = 3000 // de quanto em quanto tempo avisa a posição enquanto anda
const MAX_FRAME_S = 0.1 // aba em segundo plano / travada: não dá um salto de uma vez

export function useFreeWalk(onFrame: () => void) {
  const walk = useRef<FreeWalkState | null>(null)
  const onFrameRef = useRef(onFrame)
  useEffect(() => {
    onFrameRef.current = onFrame
  })

  useEffect(() => {
    const held: string[] = []
    let raf = 0
    let last = 0
    let lastSync = 0
    let session = 0 // cada parada confirmada só limpa a caminhada se ninguém recomeçou nesse meio-tempo
    let suppressed = false // uma tarefa tomou o lugar da caminhada: espera soltar as teclas

    const store = () => useFarmStore.getState()
    const send = (w: FreeWalkState, phase: WalkPhase) => store().walkTo(w.r, w.c, phase)

    function abort() {
      suppressed = true
      cancelAnimationFrame(raf)
      raf = 0
      walk.current = null
      setLivePosition(null)
      onFrameRef.current()
    }

    function frame(now: number) {
      const w = walk.current
      const { data } = store()
      if (!w || !data) return
      if (data.farmer.jobs.length > 0) return abort()
      const dir = heldDirection(held)
      const dt = Math.min((now - last) / 1000, MAX_FRAME_S)
      last = now
      if (dir) {
        const next = stepWalk(w, dir, dt, farmerWalkSpeed())
        walk.current = { r: next.r, c: next.c, facing: dir, moving: true, walked: w.walked + next.moved }
      } else {
        w.moving = false // teclas que se anulam (W + S): parado
      }
      const here = walk.current!
      setLivePosition({ row: here.r, col: here.c })
      if (now - lastSync >= SYNC_MS) {
        lastSync = now
        send(here, 'move')
      }
      onFrameRef.current()
      raf = requestAnimationFrame(frame)
    }

    function begin() {
      const { data } = store()
      if (!data) return
      if (!walk.current) {
        // parte de onde o fazendeiro está na tela agora (andando para uma tarefa, pode estar no meio do caminho)
        const pose = farmerPose(data.farmer, serverNow(), { dr: 1, dc: 0 })
        walk.current = { r: pose.r, c: pose.c, facing: pose.facing, moving: false, walked: 0 }
      }
      if (data.farmer.jobs.length > 0) store().cancelQueue()
      send(walk.current, 'start')
      session++
      last = performance.now()
      lastSync = last
      raf = requestAnimationFrame(frame)
    }

    function end() {
      cancelAnimationFrame(raf)
      raf = 0
      const w = walk.current
      if (!w) return
      w.moving = false
      send(w, 'end') // posição final: o servidor passa a ser quem sabe onde ele parou
      setLivePosition(null)
      const mine = session
      void settled().then(() => {
        if (session === mine && held.length === 0) walk.current = null // agora a pose do servidor é a mesma
        onFrameRef.current()
      })
      onFrameRef.current()
    }

    function onDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (e.ctrlKey || e.metaKey || e.altKey || target?.closest('input, textarea, select, [contenteditable]')) return
      const key = e.key.toLowerCase()
      if (!isWalkKey(key)) return
      if (!held.includes(key)) held.push(key)
      if (!suppressed && raf === 0) begin()
    }

    function onUp(e: KeyboardEvent) {
      const i = held.indexOf(e.key.toLowerCase())
      if (i < 0) return
      held.splice(i, 1)
      if (held.length > 0) return
      if (suppressed) suppressed = false
      else end()
    }

    function releaseAll() {
      if (held.length === 0) return
      held.length = 0
      if (suppressed) suppressed = false
      else end()
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', releaseAll)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', releaseAll)
      cancelAnimationFrame(raf)
      setLivePosition(null)
    }
  }, [])

  return walk
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { Clock } from 'three'
import { startEyeHeightTransition } from '@/three/immersiveCamera'
import { InteractionSystem } from '@/three/interaction'
import { createRoomSceneEngine, disposeRoomSceneEngine, resizeRoomSceneEngine } from '@/three/sceneEngine'
import { createSceneNavigationController } from '@/three/sceneNavigationController'
import { createScenePointerController } from '@/three/scenePointerController'
import { createHudProjector } from '@/three/sceneProjection'
import type {
  ImmersiveState,
  RoomSceneEngine,
  RoomSceneProps,
  SceneMode,
  WalkState,
} from './sceneContract'

export function useRoomSceneRuntime(props: RoomSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef(props)
  useEffect(() => {
    stateRef.current = props
  }, [props])
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null)
  const interactionPromptRef = useRef<string | null>(null)
  const interactionSystemRef = useRef(new InteractionSystem())
  const modeRef = useRef<SceneMode>('plan')
  const activeRoomRef = useRef(props.activeRoomId)
  const walkRef = useRef<WalkState>({ yaw: 0, pitch: 0, keys: new Set(), look: null })
  const immersiveRef = useRef<ImmersiveState>({
    heightTransition: startEyeHeightTransition(0, 0),
    y: 0,
    vy: 0,
    grounded: true,
    bob: 0,
  })
  const engineRef = useRef<RoomSceneEngine | null>(null)

  const publishInteractionPrompt = useCallback((prompt: string | null) => {
    if (interactionPromptRef.current === prompt) return
    interactionPromptRef.current = prompt
    setInteractionPrompt(prompt)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const engine = createRoomSceneEngine(container)
    engineRef.current = engine
    const interactions = interactionSystemRef.current
    const pointer = createScenePointerController({
      engine,
      state: stateRef,
      mode: modeRef,
      walk: walkRef,
    })
    const navigation = createSceneNavigationController({
      engine,
      state: stateRef,
      mode: modeRef,
      walk: walkRef,
      immersive: immersiveRef,
      interactions,
      publishPrompt: publishInteractionPrompt,
    })
    const projectHud = createHudProjector()

    engine.renderer.domElement.addEventListener('pointerdown', pointer.onPointerDown, { capture: true })
    engine.renderer.domElement.addEventListener('dblclick', pointer.onDoubleClick)
    window.addEventListener('pointermove', pointer.onPointerMove)
    window.addEventListener('pointerup', pointer.onPointerUp)
    window.addEventListener('keydown', navigation.onKeyDown)
    window.addEventListener('keyup', navigation.onKeyUp)
    window.addEventListener('blur', navigation.onBlur)

    const onResize = () => resizeRoomSceneEngine(engine, container)
    onResize()
    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(container)

    const clock = new Clock()
    let animationFrame = 0
    const tick = () => {
      animationFrame = requestAnimationFrame(tick)
      const deltaTime = Math.min(clock.getDelta(), 0.05)
      navigation.update(deltaTime)
      projectHud(engine, stateRef.current, modeRef.current)
      engine.renderer.render(engine.scene, engine.camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      engine.renderer.domElement.removeEventListener('pointerdown', pointer.onPointerDown, { capture: true })
      engine.renderer.domElement.removeEventListener('dblclick', pointer.onDoubleClick)
      window.removeEventListener('pointermove', pointer.onPointerMove)
      window.removeEventListener('pointerup', pointer.onPointerUp)
      window.removeEventListener('keydown', navigation.onKeyDown)
      window.removeEventListener('keyup', navigation.onKeyUp)
      window.removeEventListener('blur', navigation.onBlur)
      interactions.clear()
      disposeRoomSceneEngine(engine, container)
      engineRef.current = null
    }
  }, [publishInteractionPrompt])

  return {
    containerRef,
    stateRef,
    engineRef,
    modeRef,
    activeRoomRef,
    walkRef,
    immersiveRef,
    interactionSystemRef,
    interactionPrompt,
    publishInteractionPrompt,
  }
}

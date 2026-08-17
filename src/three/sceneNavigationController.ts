import { MathUtils, Vector3 } from 'three'
import type {
  ImmersiveState,
  MutableRef,
  RoomSceneEngine,
  RoomSceneProps,
  SceneMode,
  WalkState,
} from '@/features/planner/scene/sceneContract'
import { stepEyeHeightTransition } from './immersiveCamera'
import { isInteractionKeyPress, type InteractionSystem } from './interaction'
import { roomLocalToWorld, worldToRoomLocal } from './roomCoordinates'
import { shouldHandleSceneKeyboard } from './sceneInput'
import { walkCollide } from './collision'

interface CreateNavigationControllerOptions {
  engine: RoomSceneEngine
  state: MutableRef<RoomSceneProps>
  mode: MutableRef<SceneMode>
  walk: MutableRef<WalkState>
  immersive: MutableRef<ImmersiveState>
  interactions: InteractionSystem
  publishPrompt: (prompt: string | null) => void
}

export interface SceneNavigationController {
  onKeyDown: (event: KeyboardEvent) => void
  onKeyUp: (event: KeyboardEvent) => void
  onBlur: () => void
  update: (deltaTime: number) => void
}

export function createSceneNavigationController(options: CreateNavigationControllerOptions): SceneNavigationController {
  const { engine, state, mode, walk, immersive, interactions, publishPrompt } = options
  const forward = new Vector3()
  const movement = new Vector3()

  const onKeyDown = (event: KeyboardEvent) => {
    if (!shouldHandleSceneKeyboard(mode.current, event.target as HTMLElement | null)) return
    if (event.key === ' ') event.preventDefault()
    if (
      isInteractionKeyPress(event.key, event.repeat) &&
      mode.current === 'immersive' &&
      immersive.current.heightTransition.phase === 'ready' &&
      interactions.interactFocused()
    ) {
      event.preventDefault()
    }
    walk.current.keys.add(event.key.toLowerCase())
  }

  const onKeyUp = (event: KeyboardEvent) => walk.current.keys.delete(event.key.toLowerCase())
  const onBlur = () => walk.current.keys.clear()

  const updateWalk = (deltaTime: number) => {
    publishPrompt(null)
    const keys = walk.current.keys
    const speed = keys.has('shift') ? 4 : 2
    const yaw = walk.current.yaw
    engine.camera.rotation.set(walk.current.pitch, yaw, 0)
    engine.camera.getWorldDirection(forward)
    const rightX = Math.cos(yaw)
    const rightZ = -Math.sin(yaw)
    movement.set(0, 0, 0)
    if (keys.has('w') || keys.has('arrowup')) movement.add(forward)
    if (keys.has('s') || keys.has('arrowdown')) movement.sub(forward)
    if (keys.has('d') || keys.has('arrowright')) { movement.x += rightX; movement.z += rightZ }
    if (keys.has('a') || keys.has('arrowleft')) { movement.x -= rightX; movement.z -= rightZ }
    movement.y += (keys.has(' ') ? 1 : 0) - (keys.has('c') ? 1 : 0)
    if (movement.lengthSq() === 0) return
    movement.normalize()
    engine.camera.position.addScaledVector(movement, speed * deltaTime)
    engine.camera.position.y = MathUtils.clamp(engine.camera.position.y, -30, 60)
  }

  const updateImmersive = (deltaTime: number) => {
    const current = state.current
    const activeRoom = current.rooms.find((room) => room.id === current.activeRoomId) ?? current.rooms[0]
    if (!activeRoom) return
    const immersiveState = immersive.current

    if (immersiveState.heightTransition.phase !== 'ready') {
      publishPrompt(null)
      immersiveState.heightTransition = stepEyeHeightTransition(
        immersiveState.heightTransition,
        deltaTime,
        current.eyeHeight,
      )
      engine.camera.position.y = immersiveState.heightTransition.y
      engine.camera.rotation.set(walk.current.pitch, walk.current.yaw, 0)
      return
    }

    const keys = walk.current.keys
    const speed = keys.has('shift') ? 4 : 2
    const yaw = walk.current.yaw
    const forwardX = -Math.sin(yaw)
    const forwardZ = -Math.cos(yaw)
    const rightX = Math.cos(yaw)
    const rightZ = -Math.sin(yaw)
    let moveX = 0
    let moveZ = 0
    if (keys.has('w') || keys.has('arrowup')) { moveX += forwardX; moveZ += forwardZ }
    if (keys.has('s') || keys.has('arrowdown')) { moveX -= forwardX; moveZ -= forwardZ }
    if (keys.has('a') || keys.has('arrowleft')) { moveX -= rightX; moveZ -= rightZ }
    if (keys.has('d') || keys.has('arrowright')) { moveX += rightX; moveZ += rightZ }
    const moving = moveX !== 0 || moveZ !== 0

    if (moving) {
      const length = Math.hypot(moveX, moveZ)
      moveX /= length
      moveZ /= length
      const radius = 0.22
      const currentX = engine.camera.position.x
      const currentZ = engine.camera.position.z
      const tryWalk = (nextX: number, nextZ: number): { x: number; z: number } | null => {
        const local = worldToRoomLocal(nextX, nextZ, activeRoom)
        const x = MathUtils.clamp(local.x, -activeRoom.params.length / 2 + radius, activeRoom.params.length / 2 - radius)
        const z = MathUtils.clamp(local.z, -activeRoom.params.width / 2 + radius, activeRoom.params.width / 2 - radius)
        if (walkCollide(activeRoom.items, current.obstacles, x, z, radius)) return null
        return roomLocalToWorld(x, z, activeRoom)
      }
      const next =
        tryWalk(currentX + moveX * speed * deltaTime, currentZ + moveZ * speed * deltaTime) ??
        tryWalk(currentX + moveX * speed * deltaTime, currentZ) ??
        tryWalk(currentX, currentZ + moveZ * speed * deltaTime)
      if (next) {
        engine.camera.position.x = next.x
        engine.camera.position.z = next.z
      }
    }

    if (immersiveState.grounded && keys.has(' ')) {
      immersiveState.vy = 4.4
      immersiveState.grounded = false
    }
    immersiveState.vy -= 12 * deltaTime
    immersiveState.y += immersiveState.vy * deltaTime
    if (immersiveState.y <= 0) {
      immersiveState.y = 0
      immersiveState.vy = 0
      immersiveState.grounded = true
    }

    let bobHeight = 0
    if (moving && immersiveState.grounded) {
      immersiveState.bob += deltaTime * speed * 2.4
      bobHeight = Math.abs(Math.sin(immersiveState.bob)) * (speed > 3 ? 0.045 : 0.03)
    }
    engine.camera.position.y = current.eyeHeight + immersiveState.y + bobHeight
    engine.camera.rotation.set(walk.current.pitch, walk.current.yaw, 0)
    engine.camera.getWorldDirection(forward)
    const focus = interactions.update(engine.camera.position, forward, deltaTime)
    publishPrompt(focus?.prompt ?? null)
  }

  const update = (deltaTime: number) => {
    if (mode.current === 'walk') updateWalk(deltaTime)
    else if (mode.current === 'immersive') updateImmersive(deltaTime)
    else {
      publishPrompt(null)
      engine.controls.update()
    }
  }

  return { onKeyDown, onKeyUp, onBlur, update }
}

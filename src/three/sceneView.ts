import type {
  ImmersiveState,
  RoomSceneEngine,
  SceneMode,
  WalkState,
} from '@/features/planner/scene/sceneContract'
import type { ViewCommand } from '@/features/planner/model/scene'
import { startEyeHeightTransition } from './immersiveCamera'
import type { InteractionSystem } from './interaction'
import { rotatedRectHalf } from './collision'
import type { RoomConfig } from './types'
import { shouldShowRoomLabel } from './viewVisibility'
import { getWalkOverviewPose } from './walkCamera'

interface ApplySceneViewOptions {
  engine: RoomSceneEngine
  view: ViewCommand
  rooms: RoomConfig[]
  activeRoomId: string
  eyeHeight: number
  previousMode: SceneMode
  roomChanged: boolean
  walk: WalkState
  immersive: ImmersiveState
  interactions: InteractionSystem
}

export function applySceneView(options: ApplySceneViewOptions): SceneMode {
  const { engine, view, rooms, activeRoomId, eyeHeight, previousMode, roomChanged, walk, immersive, interactions } = options
  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? rooms[0]
  if (!activeRoom) return previousMode

  interactions.reset()
  const showRoomLabels = shouldShowRoomLabel(view.kind)
  for (const group of engine.roomGroups.values()) {
    group.traverse((object) => {
      if (object.userData.isLabel) object.visible = showRoomLabels
    })
  }

  if (view.kind === 'layout') {
    engine.controls.enabled = true
    engine.camera.rotation.order = 'XYZ'
    let minX = Infinity
    let maxX = -Infinity
    let minZ = Infinity
    let maxZ = -Infinity
    for (const room of rooms) {
      const { hw, hd } = rotatedRectHalf(room.params.length, room.params.width, room.rotation)
      minX = Math.min(minX, room.x - hw)
      maxX = Math.max(maxX, room.x + hw)
      minZ = Math.min(minZ, room.z - hd)
      maxZ = Math.max(maxZ, room.z + hd)
    }
    const centerX = (minX + maxX) / 2
    const centerZ = (minZ + maxZ) / 2
    const fitHeight = Math.max(maxX - minX, maxZ - minZ) * 1.2 + 2
    engine.camera.position.set(centerX, Math.max(fitHeight, 4), centerZ)
    engine.controls.target.set(centerX, 0, centerZ)
    engine.controls.update()
    return 'layout'
  }

  if (view.kind === 'walk') {
    engine.controls.enabled = false
    engine.camera.rotation.order = 'YXZ'
    walk.keys.clear()
    if (previousMode === 'immersive' && !roomChanged) return 'walk'
    const pose = getWalkOverviewPose(activeRoom)
    engine.camera.position.set(pose.x, pose.y, pose.z)
    walk.yaw = pose.yaw
    walk.pitch = pose.pitch
    engine.camera.rotation.set(pose.pitch, pose.yaw, 0)
    return 'walk'
  }

  if (view.kind === 'immersive') {
    engine.controls.enabled = false
    if (roomChanged) {
      engine.camera.position.x = activeRoom.x
      engine.camera.position.z = activeRoom.z
    }
    const orientation = engine.camera.quaternion.clone()
    engine.camera.rotation.order = 'YXZ'
    engine.camera.quaternion.copy(orientation)
    walk.yaw = engine.camera.rotation.y
    walk.pitch = engine.camera.rotation.x
    walk.keys.clear()
    immersive.heightTransition = startEyeHeightTransition(engine.camera.position.y, eyeHeight)
    immersive.y = 0
    immersive.vy = 0
    immersive.grounded = true
    immersive.bob = 0
    return 'immersive'
  }

  engine.controls.enabled = true
  engine.camera.rotation.order = 'XYZ'
  const fitHeight = Math.max(activeRoom.params.length, activeRoom.params.width) * 1.15
  engine.camera.position.set(activeRoom.x, fitHeight, activeRoom.z)
  engine.controls.target.set(activeRoom.x, 0, activeRoom.z)
  engine.controls.update()
  return 'plan'
}

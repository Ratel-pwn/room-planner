import type { RoomConfig } from './types'

export interface WalkCameraPose {
  x: number
  y: number
  z: number
  yaw: number
  pitch: number
}

/** 根据指针纵向位移更新俯仰角，允许垂直观察但避免视野翻转。 */
export function updateLookPitch(pitch: number, pointerDeltaY: number): number {
  const next = pitch - pointerDeltaY * 0.004
  return Math.min(Math.PI / 2, Math.max(-Math.PI / 2, next))
}

/** 根据房间尺寸和旋转计算漫游模式的斜向俯视初始机位。 */
export function getWalkOverviewPose(room: RoomConfig): WalkCameraPose {
  const localX = room.params.length * 0.65
  const localZ = room.params.width * 1.05
  const c = Math.cos(room.rotation)
  const s = Math.sin(room.rotation)
  const x = room.x + localX * c - localZ * s
  const z = room.z + localX * s + localZ * c
  const y = Math.max(
    room.params.height + 1.5,
    Math.max(room.params.length, room.params.width) * 0.9,
  )
  const dx = room.x - x
  const dz = room.z - z
  const horizontalDistance = Math.hypot(dx, dz)
  const yaw = Math.atan2(-dx, -dz)
  const pitch = -Math.atan2(y - 0.35, horizontalDistance)

  return { x, y, z, yaw, pitch }
}

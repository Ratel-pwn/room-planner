import type { RoomConfig } from './types'

type RoomTransform = Pick<RoomConfig, 'x' | 'z' | 'rotation'>

export function worldToRoomLocal(wx: number, wz: number, room: RoomTransform): { x: number; z: number } {
  const dx = wx - room.x
  const dz = wz - room.z
  const cosine = Math.cos(room.rotation)
  const sine = Math.sin(room.rotation)
  return { x: dx * cosine - dz * sine, z: dx * sine + dz * cosine }
}

export function roomLocalToWorld(lx: number, lz: number, room: RoomTransform): { x: number; z: number } {
  const cosine = Math.cos(room.rotation)
  const sine = Math.sin(room.rotation)
  return {
    x: room.x + lx * cosine + lz * sine,
    z: room.z - lx * sine + lz * cosine,
  }
}

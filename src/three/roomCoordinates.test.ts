import { describe, expect, it } from 'vitest'
import type { RoomConfig } from './types'
import { roomLocalToWorld, worldToRoomLocal } from './roomCoordinates'

const room = {
  x: 4,
  z: -2,
  rotation: Math.PI / 2,
} as RoomConfig

describe('room coordinate transforms', () => {
  it('round-trips coordinates through a rotated room', () => {
    const world = roomLocalToWorld(1.25, -0.75, room)
    const local = worldToRoomLocal(world.x, world.z, room)

    expect(local.x).toBeCloseTo(1.25)
    expect(local.z).toBeCloseTo(-0.75)
  })
})

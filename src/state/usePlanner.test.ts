import { describe, expect, it } from 'vitest'
import * as planner from './usePlanner'
import { makeRoom, makeSpace } from './plannerStorage'
import type { FurnitureItem, SpaceConfig } from '@/three/types'

describe('placing furniture into a room', () => {
  it('writes the clicked furniture into the target room', () => {
    const api = planner as typeof planner & {
      placeFurnitureInRoom?: (space: SpaceConfig, roomId: string, item: FurnitureItem) => SpaceConfig
    }
    expect(api.placeFurnitureInRoom).toBeTypeOf('function')
    if (!api.placeFurnitureInRoom) return

    const space = makeSpace('test')
    const addedRoom = makeRoom('新房间', 8, 0)
    space.rooms.push(addedRoom)
    const item: FurnitureItem = { id: 'placed-desk', type: 'desk120', x: 0.4, z: -0.2, rotation: 0 }

    const next = api.placeFurnitureInRoom(space, addedRoom.id, item)

    expect(next.rooms[0].items).toHaveLength(0)
    expect(next.rooms[1].items).toEqual([item])
  })
})

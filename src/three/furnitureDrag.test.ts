import { describe, expect, it, vi } from 'vitest'
import { commitFurnitureDrag, moveFurnitureDrag, startFurnitureDrag } from './furnitureDrag'
import { DEFAULT_ROOM, type FurnitureItem } from './types'

describe('furniture drag session', () => {
  it('keeps intermediate moves local and commits the final position once', () => {
    const item: FurnitureItem = { id: 'desk', type: 'desk120', x: 0, z: 0, rotation: 0 }
    const items = [item]
    let drag = startFurnitureDrag(item, { x: 0, z: 0 })
    const commit = vi.fn()

    drag = moveFurnitureDrag(drag, items, DEFAULT_ROOM, item, { x: 0.5, z: 0.4 })
    drag = moveFurnitureDrag(drag, items, DEFAULT_ROOM, item, { x: 1, z: 0.8 })

    expect(commit).not.toHaveBeenCalled()
    commitFurnitureDrag(drag, commit)
    expect(commit).toHaveBeenCalledOnce()
    expect(commit).toHaveBeenCalledWith('desk', drag.x, drag.z)
  })

  it('does not commit a click without movement', () => {
    const item: FurnitureItem = { id: 'desk', type: 'desk120', x: 0, z: 0, rotation: 0 }
    const drag = startFurnitureDrag(item, { x: 0, z: 0 })
    const commit = vi.fn()

    commitFurnitureDrag(drag, commit)

    expect(commit).not.toHaveBeenCalled()
  })
})

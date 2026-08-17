import { resolveDrag } from './collision'
import type { RoomObstacle } from './obstacles'
import type { FurnitureItem, RoomParams } from './types'

export interface FloorPoint {
  x: number
  z: number
}

export interface FurnitureDragState {
  id: string
  startX: number
  startZ: number
  x: number
  z: number
  dx: number
  dz: number
}

export function startFurnitureDrag(item: FurnitureItem, pointer: FloorPoint): FurnitureDragState {
  return {
    id: item.id,
    startX: item.x,
    startZ: item.z,
    x: item.x,
    z: item.z,
    dx: item.x - pointer.x,
    dz: item.z - pointer.z,
  }
}

export function moveFurnitureDrag(
  drag: FurnitureDragState,
  items: FurnitureItem[],
  room: Pick<RoomParams, 'length' | 'width'>,
  item: FurnitureItem,
  pointer: FloorPoint,
  obstacles: RoomObstacle[] = [],
): FurnitureDragState {
  const currentItem = { ...item, x: drag.x, z: drag.z }
  const next = resolveDrag(items, room, currentItem, pointer.x + drag.dx, pointer.z + drag.dz, obstacles)
  return { ...drag, x: next.x, z: next.z }
}

export function commitFurnitureDrag(
  drag: FurnitureDragState,
  commit: (id: string, x: number, z: number) => void,
): void {
  if (drag.x === drag.startX && drag.z === drag.startZ) return
  commit(drag.id, drag.x, drag.z)
}

import { FURNITURE_DEFS, type FurnitureItem, type FurnitureType } from './types'

/** 旋转后的占地半尺寸（AABB 近似） */
export function rotatedHalf(type: FurnitureType, rotation: number): { hw: number; hd: number } {
  const def = FURNITURE_DEFS[type]
  const c = Math.abs(Math.cos(rotation))
  const s = Math.abs(Math.sin(rotation))
  return { hw: (def.w * c + def.d * s) / 2, hd: (def.w * s + def.d * c) / 2 }
}

export interface Box2 {
  type: FurnitureType
  rotation: number
  x: number
  z: number
  excludeId?: string
}

/**
 * 检测候选位置是否与其他家具重叠。
 * 返回与之碰撞的家具 id；无碰撞返回 null。
 * margin 为两件家具之间要求的最小间隙（米）。
 */
export function findCollision(items: FurnitureItem[], cand: Box2, margin = 0.02): string | null {
  const a = rotatedHalf(cand.type, cand.rotation)
  for (const it of items) {
    if (it.id === cand.excludeId) continue
    const b = rotatedHalf(it.type, it.rotation)
    if (Math.abs(cand.x - it.x) < a.hw + b.hw + margin && Math.abs(cand.z - it.z) < a.hd + b.hd + margin) {
      return it.id
    }
  }
  return null
}

/** 把家具限制在房间内 */
export function clampToRoom(
  room: { length: number; width: number },
  type: FurnitureType,
  rotation: number,
  x: number,
  z: number,
): { x: number; z: number } {
  const { hw, hd } = rotatedHalf(type, rotation)
  return {
    x: Math.min(Math.max(x, -room.length / 2 + hw), room.length / 2 - hw),
    z: Math.min(Math.max(z, -room.width / 2 + hd), room.width / 2 - hd),
  }
}

/**
 * 拖动解算：优先全量移动；碰撞时退化为只沿 X 或只沿 Z 滑动；都撞则原地不动。
 */
export function resolveDrag(
  items: FurnitureItem[],
  room: { length: number; width: number },
  item: FurnitureItem,
  targetX: number,
  targetZ: number,
): { x: number; z: number } {
  const tryPos = (x: number, z: number): { x: number; z: number } | null => {
    const c = clampToRoom(room, item.type, item.rotation, x, z)
    return findCollision(items, { type: item.type, rotation: item.rotation, x: c.x, z: c.z, excludeId: item.id })
      ? null
      : c
  }
  return (
    tryPos(targetX, targetZ) ??
    tryPos(targetX, item.z) ??
    tryPos(item.x, targetZ) ?? { x: item.x, z: item.z }
  )
}

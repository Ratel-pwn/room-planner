import type { RoomObstacle } from './buildRoom'
import { FURNITURE_DEFS, type FurnitureItem, type FurnitureType } from './types'

/** 旋转后的占地半尺寸（AABB 近似，仅用于房间边界约束） */
export function rotatedHalf(type: FurnitureType, rotation: number): { hw: number; hd: number } {
  const def = FURNITURE_DEFS[type]
  const c = Math.abs(Math.cos(rotation))
  const s = Math.abs(Math.sin(rotation))
  return { hw: (def.w * c + def.d * s) / 2, hd: (def.w * s + def.d * c) / 2 }
}

/** 把家具限制在房间内（按整体占地） */
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

// ─────────────────────────────────────────────────────────────
// 精细化碰撞：每件家具拆成若干实体块（局部坐标，y 为离地高度区间）
// 只有实体块在三维上真正相交才算碰撞 —— 椅子座面可以塞进桌面下，
// 但靠背会被桌沿挡住。
// ─────────────────────────────────────────────────────────────

interface Part {
  cx: number // 局部中心 X
  cz: number // 局部中心 Z
  hx: number // 半宽 X
  hz: number // 半深 Z
  y0: number // 底（离地）
  y1: number // 顶
}

function deskProfile(w: number, d: number): Part[] {
  const lx = w / 2 - 0.0425
  const lz = d / 2 - 0.0425
  const parts: Part[] = [{ cx: 0, cz: 0, hx: w / 2, hz: d / 2, y0: 0.72, y1: 0.75 }]
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) parts.push({ cx: sx * lx, cz: sz * lz, hx: 0.0225, hz: 0.0225, y0: 0, y1: 0.72 })
  return parts
}

function tableLegs(w: number, d: number, size: number, topY: number): Part[] {
  const lx = w / 2 - size / 2 - 0.02
  const lz = d / 2 - size / 2 - 0.02
  const parts: Part[] = []
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) parts.push({ cx: sx * lx, cz: sz * lz, hx: size / 2, hz: size / 2, y0: 0, y1: topY })
  return parts
}

const PROFILES: Record<FurnitureType, Part[]> = {
  desk120: deskProfile(1.2, 0.6),
  desk160: deskProfile(1.6, 0.8),
  roundTable: [
    { cx: 0, cz: 0, hx: 0.45, hz: 0.45, y0: 0.72, y1: 0.75 }, // 桌面（圆面外接方）
    { cx: 0, cz: 0, hx: 0.035, hz: 0.035, y0: 0.025, y1: 0.72 }, // 中柱
    { cx: 0, cz: 0, hx: 0.3, hz: 0.3, y0: 0, y1: 0.025 }, // 底盘
  ],
  chair: [
    { cx: 0, cz: 0, hx: 0.21, hz: 0.21, y0: 0.43, y1: 0.47 }, // 座面
    { cx: 0, cz: -0.19, hx: 0.21, hz: 0.0175, y0: 0.45, y1: 0.85 }, // 靠背
    ...tableLegs(0.4, 0.4, 0.03, 0.43),
  ],
  bench: [
    { cx: 0, cz: 0, hx: 0.5, hz: 0.175, y0: 0.4, y1: 0.45 }, // 凳面
    ...tableLegs(0.96, 0.31, 0.05, 0.4),
  ],
  shelf: [{ cx: 0, cz: 0, hx: 0.45, hz: 0.15, y0: 0, y1: 1.8 }], // 整体实心
  sofa: [
    { cx: 0, cz: 0, hx: 0.9, hz: 0.31, y0: 0, y1: 0.43 }, // 底座+座垫
    { cx: 0, cz: -0.24, hx: 0.9, hz: 0.07, y0: 0.43, y1: 0.8 }, // 靠背
    { cx: -0.85, cz: 0, hx: 0.05, hz: 0.27, y0: 0.43, y1: 0.61 }, // 左扶手
    { cx: 0.85, cz: 0, hx: 0.05, hz: 0.27, y0: 0.43, y1: 0.61 }, // 右扶手
  ],
  teaTable: [
    { cx: 0, cz: 0, hx: 0.5, hz: 0.25, y0: 0.415, y1: 0.45 }, // 台面
    ...tableLegs(0.96, 0.46, 0.035, 0.415),
  ],
}

// ── 2D 旋转矩形（OBB）重叠：分离轴定理 ──

interface Obb {
  x: number
  z: number
  hx: number
  hz: number
  rot: number
}

function obbOverlap(a: Obb, b: Obb, margin: number): boolean {
  const axes: Array<[number, number]> = []
  for (const o of [a, b]) {
    const c = Math.cos(o.rot)
    const s = Math.sin(o.rot)
    axes.push([c, -s]) // 局部 X 轴在世界中的方向
    axes.push([s, c]) // 局部 Z 轴
  }
  const radius = (o: Obb, ax: number, az: number) => {
    const c = Math.cos(o.rot)
    const s = Math.sin(o.rot)
    return o.hx * Math.abs(ax * c - az * s) + o.hz * Math.abs(ax * s + az * c)
  }
  const dx = b.x - a.x
  const dz = b.z - a.z
  for (const [ax, az] of axes) {
    const dist = Math.abs(dx * ax + dz * az)
    if (dist >= radius(a, ax, az) + radius(b, ax, az) + margin) return false
  }
  return true
}

/** 局部实体块 → 世界 OBB（绕 Y 旋转 θ） */
function partToWorld(p: Part, x: number, z: number, rot: number): Obb & { y0: number; y1: number } {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  return {
    x: x + p.cx * c + p.cz * s,
    z: z - p.cx * s + p.cz * c,
    hx: p.hx,
    hz: p.hz,
    rot,
    y0: p.y0,
    y1: p.y1,
  }
}

export interface Box2 {
  type: FurnitureType
  rotation: number
  x: number
  z: number
  excludeId?: string
}

/**
 * 精细碰撞检测：逐实体块做 OBB 平面重叠 + 高度区间重叠。
 * obstacles 为墙面凸出设施（弱电箱、空调、门套、踢脚线等，轴对齐）。
 * 返回与之碰撞的家具 id（或 'wall:第n项设施'）；无碰撞返回 null。
 * margin 为实体块之间的最小间隙（米）。
 */
export function findCollision(
  items: FurnitureItem[],
  cand: Box2,
  margin = 0.02,
  obstacles: RoomObstacle[] = [],
  obstacleMargin = 0.005,
): string | null {
  const partsA = PROFILES[cand.type].map((p) => partToWorld(p, cand.x, cand.z, cand.rotation))
  for (const it of items) {
    if (it.id === cand.excludeId) continue
    const partsB = PROFILES[it.type]
    for (const pa of partsA) {
      for (const pb of partsB) {
        const wb = partToWorld(pb, it.x, it.z, it.rotation)
        // 高度不相交则不可能碰撞（椅子座面可以从桌面下穿过）
        if (pa.y1 <= wb.y0 + 0.005 || wb.y1 <= pa.y0 + 0.005) continue
        if (obbOverlap(pa, wb, margin)) return it.id
      }
    }
  }
  // 墙面设施（轴对齐，rot = 0）；间隙要求小于家具之间，允许贴墙摆放
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i]
    for (const pa of partsA) {
      if (pa.y1 <= o.y0 + 0.005 || o.y1 <= pa.y0 + 0.005) continue
      if (obbOverlap(pa, { x: o.x, z: o.z, hx: o.hx, hz: o.hz, rot: 0 }, obstacleMargin)) return `wall:${i}`
    }
  }
  return null
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
  obstacles: RoomObstacle[] = [],
): { x: number; z: number } {
  const tryPos = (x: number, z: number): { x: number; z: number } | null => {
    const c = clampToRoom(room, item.type, item.rotation, x, z)
    return findCollision(
      items,
      { type: item.type, rotation: item.rotation, x: c.x, z: c.z, excludeId: item.id },
      0.02,
      obstacles,
    )
      ? null
      : c
  }
  return tryPos(targetX, targetZ) ?? tryPos(targetX, item.z) ?? tryPos(item.x, targetZ) ?? { x: item.x, z: item.z }
}

// ─────────────────────────────────────────────────────────────
// 第一人称漫游：把人看作半径 r 的圆（身体高约 1.7m）
// 与高度区间和人体相交的家具实体块 / 墙面设施做圆-OBB 检测
// ─────────────────────────────────────────────────────────────

const BODY_Y0 = 0.1 // 脚踝以下不挡（可跨过地面小物）
const BODY_Y1 = 1.5 // 头顶余量（吊灯下可通过）

function circleHitsObb(x: number, z: number, ob: Obb, r: number): boolean {
  // 世界 → OBB 局部（partToWorld 的逆变换）
  const dx = x - ob.x
  const dz = z - ob.z
  const c = Math.cos(ob.rot)
  const s = Math.sin(ob.rot)
  const lx = dx * c - dz * s
  const lz = dx * s + dz * c
  const qx = Math.max(-ob.hx, Math.min(ob.hx, lx))
  const qz = Math.max(-ob.hz, Math.min(ob.hz, lz))
  return Math.hypot(lx - qx, lz - qz) < r
}

/** 行走到 (x, z) 是否会撞上家具或墙面设施 */
export function walkCollide(
  items: FurnitureItem[],
  obstacles: RoomObstacle[],
  x: number,
  z: number,
  r = 0.22,
): boolean {
  for (const it of items) {
    for (const p of PROFILES[it.type]) {
      if (p.y1 <= BODY_Y0 || p.y0 >= BODY_Y1) continue
      if (circleHitsObb(x, z, partToWorld(p, it.x, it.z, it.rotation), r)) return true
    }
  }
  for (const o of obstacles) {
    if (o.y1 <= BODY_Y0 || o.y0 >= BODY_Y1) continue
    if (circleHitsObb(x, z, { x: o.x, z: o.z, hx: o.hx, hz: o.hz, rot: 0 }, r)) return true
  }
  return false
}

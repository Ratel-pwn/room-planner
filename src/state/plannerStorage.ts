import {
  DEFAULT_ROOM,
  NO_BUMPS,
  type BumpCorners,
  type FurnitureItem,
  type RoomConfig,
  type RoomParams,
  type SpaceConfig,
} from '@/three/types'

const LS_V4 = 'room-planner-v4'
const LS_V3 = 'room-planner-v3'
const LS_V2 = 'room-planner-v2'
const LS_V1 = 'room-planner-v1'

export interface SavedStateV4 {
  spaces: SpaceConfig[]
  activeSpaceId: string
  activeRoomId: string
}

export function makeRoom(name: string, x = 0, z = 0, params?: Partial<RoomParams>): RoomConfig {
  return {
    id: `room-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    x,
    z,
    rotation: 0,
    params: { ...DEFAULT_ROOM, ...params },
    bumps: NO_BUMPS.map((b) => ({ ...b })) as BumpCorners,
    items: [],
  }
}

export function makeSpace(name: string): SpaceConfig {
  const space: SpaceConfig = {
    id: `space-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    rooms: [],
  }
  space.rooms.push(makeRoom('房间 1'))
  return space
}

/** 新房间的默认摆放位置：排在现有最右侧房间的右边，留 0.5m 间隔 */
export function nextRoomPosition(rooms: RoomConfig[], params: RoomParams): { x: number; z: number } {
  if (!rooms.length) return { x: 0, z: 0 }
  let right = -Infinity
  for (const r of rooms) right = Math.max(right, r.x + r.params.length / 2)
  return { x: right + 0.5 + params.length / 2, z: 0 }
}

type LegacyRoom = Omit<RoomConfig, 'x' | 'z' | 'rotation'> & { x?: number; z?: number; rotation?: number }

/** 把一批没有完整位置信息的旧房间沿 X 轴依次排开，并补齐 rotation */
function normalizeRooms(rooms: LegacyRoom[]): RoomConfig[] {
  let cursor = 0
  return rooms.map((r) => {
    let { x, z } = r
    if (x == null || z == null) {
      x = cursor + r.params.length / 2
      z = 0
    }
    cursor = x + r.params.length / 2 + 0.5
    return { ...r, x, z, rotation: r.rotation ?? 0 } as RoomConfig
  })
}

export function loadSaved(): SavedStateV4 {
  // v4
  try {
    const raw = localStorage.getItem(LS_V4)
    if (raw) {
      const s = JSON.parse(raw) as SavedStateV4
      if (s.spaces?.length && s.spaces[0].rooms?.length) return s
    }
  } catch {
    /* ignore */
  }
  // v3 → v4：补 rotation 字段
  // v2 → v4：所有房间包进一个空间，横向排开
  for (const key of [LS_V3, LS_V2]) {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const s = JSON.parse(raw) as { spaces?: Array<{ id: string; name: string; rooms: LegacyRoom[] }>; rooms?: LegacyRoom[]; activeSpaceId?: string; activeRoomId?: string }
        if (s.spaces?.length && s.spaces[0].rooms?.length) {
          return {
            spaces: s.spaces.map((sp) => ({ ...sp, rooms: normalizeRooms(sp.rooms) })),
            activeSpaceId: s.activeSpaceId ?? s.spaces[0].id,
            activeRoomId: s.activeRoomId ?? s.spaces[0].rooms[0].id,
          }
        }
        if (s.rooms?.length) {
          const space = makeSpace('空间 1')
          space.rooms = normalizeRooms(s.rooms)
          const active = space.rooms.find((r) => r.id === s.activeRoomId) ?? space.rooms[0]
          return { spaces: [space], activeSpaceId: space.id, activeRoomId: active.id }
        }
      }
    } catch {
      /* ignore */
    }
  }
  // v1 → v4（单房间）
  try {
    const raw = localStorage.getItem(LS_V1)
    if (raw) {
      const s = JSON.parse(raw) as { room: RoomParams; items: FurnitureItem[] }
      const space = makeSpace('空间 1')
      const room = makeRoom('房间 1')
      room.params = { ...DEFAULT_ROOM, ...s.room }
      room.items = s.items ?? []
      space.rooms = [room]
      return { spaces: [space], activeSpaceId: space.id, activeRoomId: room.id }
    }
  } catch {
    /* ignore */
  }
  const space = makeSpace('空间 1')
  return { spaces: [space], activeSpaceId: space.id, activeRoomId: space.rooms[0].id }
}

export function persist(state: SavedStateV4) {
  localStorage.setItem(LS_V4, JSON.stringify(state))
}

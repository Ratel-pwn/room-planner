import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ViewCommand } from '@/features/planner/model/scene'
import { buildRoomObstacles } from '@/three/obstacles'
import { clampToRoom, findCollision, rectsOverlap, rotatedRectHalf } from '@/three/collision'
import {
  FURNITURE_DEFS,
  type BumpCorners,
  type CornerBump,
  type FurnitureItem,
  type FurnitureType,
  type RoomConfig,
  type RoomParams,
  type SpaceConfig,
} from '@/three/types'
import { loadSaved, makeRoom, makeSpace, nextRoomPosition, normalizeEyeHeight, persist } from './plannerStorage'
import { createDebouncedWriter } from './persistScheduler'

export const CORNER_LABELS = ['左下角', '右下角', '右上角', '左上角'] as const

export function placeFurnitureInRoom(space: SpaceConfig, roomId: string, item: FurnitureItem): SpaceConfig {
  return {
    ...space,
    rooms: space.rooms.map((room) => (room.id === roomId ? { ...room, items: [...room.items, item] } : room)),
  }
}

/** 拖房间时的最小间距（米） */
const ROOM_GAP = 0.06

/** 房间在给定位置/旋转下是否与其他房间重叠（用旋转后的 AABB 近似） */
function roomFits(rooms: RoomConfig[], id: string, x: number, z: number, rotation: number, L: number, W: number): boolean {
  const a = rotatedRectHalf(L, W, rotation)
  return !rooms.some((o) => {
    if (o.id === id) return false
    const b = rotatedRectHalf(o.params.length, o.params.width, o.rotation)
    return rectsOverlap(x, z, a.hw * 2, a.hd * 2, o.x, o.z, b.hw * 2, b.hd * 2, ROOM_GAP)
  })
}

/**
 * 房间规划器的全部状态与动作。
 * 结构：空间（Space）→ 房间（Room）→ 家具（FurnitureItem）。
 * PlannerPage 只做组件组合，不直接管状态。
 */
export function usePlanner() {
  const [saved] = useState(loadSaved)
  const [spaces, setSpaces] = useState<SpaceConfig[]>(saved.spaces)
  const [activeSpaceId, setActiveSpaceId] = useState<string>(saved.activeSpaceId)
  const [activeRoomId, setActiveRoomId] = useState<string>(saved.activeRoomId)
  const [eyeHeight, setEyeHeightState] = useState(saved.eyeHeight)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [placingType, setPlacingType] = useState<FurnitureType | null>(null)
  // 默认进入 3D 漫游
  const [view, setView] = useState<ViewCommand>({ kind: 'walk', seq: 1 })
  const [persistScheduler] = useState(() => createDebouncedWriter(persist, 120))

  const space = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0]
  const room = space.rooms.find((r) => r.id === activeRoomId) ?? space.rooms[0]
  const items = room.items
  const selected = items.find((i) => i.id === selectedId) ?? null

  useEffect(() => {
    persistScheduler.schedule({ spaces, activeSpaceId, activeRoomId, eyeHeight })
  }, [spaces, activeSpaceId, activeRoomId, eyeHeight, persistScheduler])

  useEffect(() => {
    const flush = () => persistScheduler.flush()
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      persistScheduler.flush()
    }
  }, [persistScheduler])

  const setEyeHeight = useCallback((value: number) => {
    setEyeHeightState(normalizeEyeHeight(value))
  }, [])

  const cancelInteraction = useCallback(() => {
    setPlacingType(null)
    setSelectedId(null)
    setView((current) =>
      current.kind === 'walk' || current.kind === 'immersive'
        ? { kind: 'plan', seq: current.seq + 1 }
        : current,
    )
  }, [])

  /** 更新当前空间 */
  const patchActiveSpace = useCallback(
    (fn: (s: SpaceConfig) => SpaceConfig) => {
      setSpaces((list) => list.map((s) => (s.id === space.id ? fn(s) : s)))
    },
    [space.id],
  )

  /** 更新当前房间 */
  const patchActiveRoom = useCallback(
    (fn: (r: RoomConfig) => RoomConfig) => {
      patchActiveSpace((s) => ({ ...s, rooms: s.rooms.map((r) => (r.id === room.id ? fn(r) : r)) }))
    },
    [patchActiveSpace, room.id],
  )

  const patchRoom = useCallback(
    (patch: Partial<RoomParams>) => patchActiveRoom((r) => ({ ...r, params: { ...r.params, ...patch } })),
    [patchActiveRoom],
  )

  const patchBump = useCallback(
    (index: number, patch: Partial<CornerBump>) =>
      patchActiveRoom((r) => {
        const bumps = r.bumps.map((b, i) => (i === index ? { ...b, ...patch } : b)) as BumpCorners
        return { ...r, bumps }
      }),
    [patchActiveRoom],
  )

  const setItems = useCallback(
    (fn: (items: FurnitureItem[]) => FurnitureItem[]) => patchActiveRoom((r) => ({ ...r, items: fn(r.items) })),
    [patchActiveRoom],
  )

  /** 墙面凸出设施碰撞体（弱电箱、空调、门套、踢脚线、四角凸起等），当前房间局部坐标 */
  const obstacles = useMemo(() => buildRoomObstacles(room.params, room.bumps), [room.params, room.bumps])

  /** 当前房间已摆放家具的总价（有参考价的家具才计入） */
  const placedTotal = useMemo(
    () => items.reduce((sum, i) => sum + (FURNITURE_DEFS[i.type].price ?? 0), 0),
    [items],
  )

  // ── 视角 ──
  const setViewKind = useCallback((kind: ViewCommand['kind']) => {
    setView((v) => ({ kind, seq: v.seq + 1 }))
  }, [])

  // ── 空间管理 ──
  const switchSpace = useCallback(
    (id: string) => {
      if (id === space.id) return
      const target = spaces.find((s) => s.id === id)
      if (!target) return
      setActiveSpaceId(id)
      setActiveRoomId(target.rooms[0].id)
      setSelectedId(null)
      setPlacingType(null)
      setView((v) => ({ kind: v.kind, seq: v.seq + 1 }))
    },
    [space.id, spaces],
  )

  const addSpace = useCallback(() => {
    setSpaces((list) => {
      const s = makeSpace(`空间 ${list.length + 1}`)
      setActiveSpaceId(s.id)
      setActiveRoomId(s.rooms[0].id)
      return [...list, s]
    })
    setSelectedId(null)
    setPlacingType(null)
    setView((v) => ({ kind: v.kind, seq: v.seq + 1 }))
  }, [])

  const renameSpace = useCallback(
    (name: string) => {
      const normalized = name.trim()
      if (normalized) patchActiveSpace((current) => ({ ...current, name: normalized }))
    },
    [patchActiveSpace],
  )

  const deleteSpace = useCallback(() => {
    if (spaces.length <= 1) return
    const rest = spaces.filter((s) => s.id !== space.id)
    setSpaces(rest)
    setActiveSpaceId(rest[0].id)
    setActiveRoomId(rest[0].rooms[0].id)
    setSelectedId(null)
    setPlacingType(null)
    setView((v) => ({ kind: v.kind, seq: v.seq + 1 }))
  }, [spaces, space.id])

  // ── 房间管理（当前空间内）──
  const switchRoom = useCallback(
    (id: string) => {
      if (id === room.id) return
      setActiveRoomId(id)
      setSelectedId(null)
      setPlacingType(null)
      if (view.kind !== 'layout') setView((v) => ({ kind: v.kind, seq: v.seq + 1 })) // 重新定位视角
    },
    [room.id, view.kind],
  )

  /** 新增房间（可带名称/尺寸参数），随后进入布局模式摆放位置 */
  const addRoom = useCallback(
    (cfg?: { name?: string; length?: number; width?: number; height?: number }) => {
      const params: Partial<RoomParams> = {}
      if (cfg?.length) params.length = cfg.length
      if (cfg?.width) params.width = cfg.width
      if (cfg?.height) params.height = cfg.height
      const pos = nextRoomPosition(space.rooms, { ...room.params, ...params })
      const r = makeRoom(cfg?.name?.trim() || `房间 ${space.rooms.length + 1}`, pos.x, pos.z, params)
      patchActiveSpace((s) => ({ ...s, rooms: [...s.rooms, r] }))
      setActiveRoomId(r.id)
      setSelectedId(null)
      setPlacingType(null)
      setView((v) => ({ kind: 'layout', seq: v.seq + 1 }))
    },
    [space.rooms, room.params, patchActiveSpace],
  )

  const renameRoom = useCallback(
    (name: string) => {
      const normalized = name.trim()
      if (normalized) patchActiveRoom((current) => ({ ...current, name: normalized }))
    },
    [patchActiveRoom],
  )

  /** 按 id 删除房间（至少保留一个） */
  const deleteRoomById = useCallback(
    (id: string) => {
      if (space.rooms.length <= 1) return
      const target = space.rooms.find((r) => r.id === id)
      if (!target) return
      const rest = space.rooms.filter((r) => r.id !== id)
      patchActiveSpace((s) => ({ ...s, rooms: rest }))
      if (id === room.id) {
        setActiveRoomId(rest[0].id)
        setView((v) => ({ kind: v.kind, seq: v.seq + 1 }))
      }
      setSelectedId(null)
      setPlacingType(null)
    },
    [space.rooms, room.id, patchActiveSpace],
  )

  /** 布局模式：拖拽房间在空间内的位置（防止与其他房间重叠，先整体移、再试单轴滑） */
  const moveRoom = useCallback(
    (id: string, x: number, z: number) => {
      patchActiveSpace((s) => {
        const target = s.rooms.find((r) => r.id === id)
        if (!target) return s
        const L = target.params.length
        const W = target.params.width
        const rot = target.rotation
        if (roomFits(s.rooms, id, x, z, rot, L, W))
          return { ...s, rooms: s.rooms.map((r) => (r.id === id ? { ...r, x, z } : r)) }
        if (roomFits(s.rooms, id, x, target.z, rot, L, W))
          return { ...s, rooms: s.rooms.map((r) => (r.id === id ? { ...r, x } : r)) }
        if (roomFits(s.rooms, id, target.x, z, rot, L, W))
          return { ...s, rooms: s.rooms.map((r) => (r.id === id ? { ...r, z } : r)) }
        return s
      })
    },
    [patchActiveSpace],
  )

  /** 旋转房间（弧度，与其他房间重叠时不生效） */
  const rotateRoom = useCallback(
    (id: string, rotation: number) => {
      patchActiveSpace((s) => {
        const target = s.rooms.find((r) => r.id === id)
        if (!target) return s
        const rot = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
        if (!roomFits(s.rooms, id, target.x, target.z, rot, target.params.length, target.params.width)) return s
        return { ...s, rooms: s.rooms.map((r) => (r.id === id ? { ...r, rotation: rot } : r)) }
      })
    },
    [patchActiveSpace],
  )

  /** 布局模式双击房间：设为当前房间并进入平面模式 */
  const enterRoom = useCallback(
    (id: string) => {
      if (id !== room.id) {
        setActiveRoomId(id)
        setSelectedId(null)
        setPlacingType(null)
      }
      setView((v) => ({ kind: 'plan', seq: v.seq + 1 }))
    },
    [room.id],
  )

  // ── 家具操作 ──
  const togglePlacing = useCallback((type: FurnitureType) => {
    setPlacingType((t) => (t === type ? null : type))
    setSelectedId(null)
  }, [])

  const onPlace = useCallback(
    (roomId: string, type: FurnitureType, x: number, z: number) => {
      const id = `${type}-${Date.now().toString(36)}`
      const item: FurnitureItem = { id, type, x, z, rotation: 0 }
      patchActiveSpace((currentSpace) => placeFurnitureInRoom(currentSpace, roomId, item))
      setActiveRoomId(roomId)
      setSelectedId(id)
      setPlacingType(null)
    },
    [patchActiveSpace],
  )

  const onMove = useCallback(
    (id: string, x: number, z: number) => {
      setItems((list) => list.map((i) => (i.id === id ? { ...i, x, z } : i)))
    },
    [setItems],
  )

  /** 旋转（碰撞或越界时不生效） */
  const applyRotation = useCallback(
    (id: string, rotation: number) => {
      setItems((list) => {
        const it = list.find((i) => i.id === id)
        if (!it) return list
        const rot = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
        const c = clampToRoom(room.params, it.type, rot, it.x, it.z)
        if (findCollision(list, { type: it.type, rotation: rot, x: c.x, z: c.z, excludeId: id }, 0.02, obstacles))
          return list
        return list.map((i) => (i.id === id ? { ...i, rotation: rot, x: c.x, z: c.z } : i))
      })
    },
    [setItems, room.params, obstacles],
  )

  const rotateSelected = useCallback(
    (deg: number) => {
      if (!selected) return
      applyRotation(selected.id, selected.rotation + (deg * Math.PI) / 180)
    },
    [selected, applyRotation],
  )

  const dupSelected = useCallback(() => {
    if (!selected) return
    const id = `${selected.type}-${Date.now().toString(36)}`
    const offsets: Array<[number, number]> = [
      [0.4, 0.4],
      [-0.4, 0.4],
      [0.4, -0.4],
      [-0.4, -0.4],
      [0.8, 0],
      [0, 0.8],
      [-0.8, 0],
      [0, -0.8],
    ]
    setItems((list) => {
      for (const [dx, dz] of offsets) {
        const c = clampToRoom(room.params, selected.type, selected.rotation, selected.x + dx, selected.z + dz)
        if (!findCollision(list, { type: selected.type, rotation: selected.rotation, x: c.x, z: c.z }, 0.02, obstacles)) {
          return [...list, { ...selected, id, x: c.x, z: c.z }]
        }
      }
      return list // 周围全是家具时不复制
    })
    setSelectedId(id)
  }, [selected, setItems, room.params, obstacles])

  const delSelected = useCallback(() => {
    if (!selected) return
    setItems((list) => list.filter((i) => i.id !== selected.id))
    setSelectedId(null)
  }, [selected, setItems])

  const clearItems = useCallback(() => {
    setItems(() => [])
    setSelectedId(null)
  }, [setItems])

  return {
    // 状态
    spaces,
    space,
    room,
    items,
    selected,
    selectedId,
    placingType,
    view,
    eyeHeight,
    obstacles,
    placedTotal,
    // 视角
    setViewKind,
    setEyeHeight,
    cancelInteraction,
    // 空间管理
    switchSpace,
    addSpace,
    renameSpace,
    deleteSpace,
    // 房间管理
    switchRoom,
    addRoom,
    renameRoom,
    deleteRoomById,
    moveRoom,
    rotateRoom,
    enterRoom,
    // 房间配置
    patchRoom,
    patchBump,
    // 家具
    togglePlacing,
    setSelectedId,
    onPlace,
    onMove,
    applyRotation,
    rotateSelected,
    dupSelected,
    delSelected,
    clearItems,
  }
}

export type Planner = ReturnType<typeof usePlanner>

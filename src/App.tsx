import { useCallback, useEffect, useMemo, useState } from 'react'
import { RoomScene, type ViewCommand } from '@/components/RoomScene'
import { buildRoomObstacles } from '@/three/buildRoom'
import { clampToRoom, findCollision } from '@/three/collision'
import { BUDGET, SHOPPING_LIST, buildOfficeLayout, shoppingTotal } from '@/three/presets'
import {
  DEFAULT_ROOM,
  FURNITURE_DEFS,
  NO_BUMPS,
  type BumpCorners,
  type CornerBump,
  type FurnitureItem,
  type FurnitureType,
  type RoomConfig,
  type RoomParams,
} from '@/three/types'

const LS_V2 = 'room-planner-v2'
const LS_V1 = 'room-planner-v1'

interface SavedStateV2 {
  rooms: RoomConfig[]
  activeRoomId: string
}

function makeRoom(name: string): RoomConfig {
  return {
    id: `room-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    params: { ...DEFAULT_ROOM },
    bumps: NO_BUMPS.map((b) => ({ ...b })) as BumpCorners,
    items: [],
  }
}

function loadSaved(): SavedStateV2 {
  try {
    const raw = localStorage.getItem(LS_V2)
    if (raw) {
      const s = JSON.parse(raw) as SavedStateV2
      if (s.rooms?.length) return s
    }
  } catch {
    /* ignore */
  }
  // 迁移 v1（单房间）
  try {
    const raw = localStorage.getItem(LS_V1)
    if (raw) {
      const s = JSON.parse(raw) as { room: RoomParams; items: FurnitureItem[] }
      const room = makeRoom('房间 1')
      room.params = { ...DEFAULT_ROOM, ...s.room }
      room.items = s.items ?? []
      return { rooms: [room], activeRoomId: room.id }
    }
  } catch {
    /* ignore */
  }
  const room = makeRoom('房间 1')
  return { rooms: [room], activeRoomId: room.id }
}

function NumField(props: {
  label: string
  value: number
  step?: number
  min?: number
  max?: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm text-neutral-700">
      <span className="whitespace-nowrap">{props.label}</span>
      <input
        type="number"
        className="w-24 rounded-md border border-neutral-300 bg-white px-2 py-1 text-right text-sm outline-none focus:border-neutral-500"
        value={props.value}
        step={props.step ?? 0.1}
        min={props.min}
        max={props.max}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (!Number.isNaN(v)) props.onChange(v)
        }}
      />
    </label>
  )
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-neutral-200 px-4 py-3">
      <div className="mb-2 text-xs font-semibold tracking-widest text-neutral-400">{props.title}</div>
      <div className="flex flex-col gap-2">{props.children}</div>
    </div>
  )
}

const btn =
  'rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:border-neutral-500 hover:bg-neutral-50 active:bg-neutral-100'
const btnActive = 'border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800'

const CORNER_LABELS = ['左下角', '右下角', '右上角', '左上角'] as const

export default function App() {
  const [saved] = useState(loadSaved)
  const [rooms, setRooms] = useState<RoomConfig[]>(saved.rooms)
  const [activeRoomId, setActiveRoomId] = useState<string>(saved.activeRoomId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [placingType, setPlacingType] = useState<FurnitureType | null>(null)
  // 默认进入 3D 漫游
  const [view, setView] = useState<ViewCommand>({ kind: 'walk', seq: 1 })

  const room = rooms.find((r) => r.id === activeRoomId) ?? rooms[0]

  useEffect(() => {
    localStorage.setItem(LS_V2, JSON.stringify({ rooms, activeRoomId }))
  }, [rooms, activeRoomId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlacingType(null)
        setSelectedId(null)
        setView((v) => (v.kind === 'walk' || v.kind === 'immersive' ? { kind: 'plan', seq: v.seq + 1 } : v))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /** 更新当前房间 */
  const patchActiveRoom = useCallback(
    (fn: (r: RoomConfig) => RoomConfig) => {
      setRooms((list) => list.map((r) => (r.id === room.id ? fn(r) : r)))
    },
    [room.id],
  )

  const patchRoom = useCallback((patch: Partial<RoomParams>) => patchActiveRoom((r) => ({ ...r, params: { ...r.params, ...patch } })), [patchActiveRoom])

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

  /** 墙面凸出设施碰撞体（弱电箱、空调、门套、踢脚线、四角凸起等） */
  const obstacles = useMemo(() => buildRoomObstacles(room.params, room.bumps), [room.params, room.bumps])

  // ── 房间管理 ──
  const switchRoom = (id: string) => {
    if (id === room.id) return
    setActiveRoomId(id)
    setSelectedId(null)
    setPlacingType(null)
    setView((v) => ({ kind: v.kind, seq: v.seq + 1 })) // 重新定位视角
  }

  const addRoom = () => {
    const r = makeRoom(`房间 ${rooms.length + 1}`)
    setRooms((list) => [...list, r])
    setActiveRoomId(r.id)
    setSelectedId(null)
    setPlacingType(null)
    setView((v) => ({ kind: v.kind, seq: v.seq + 1 }))
  }

  const renameRoom = () => {
    const name = prompt('房间名称', room.name)
    if (name?.trim()) patchActiveRoom((r) => ({ ...r, name: name.trim() }))
  }

  const deleteRoom = () => {
    if (rooms.length <= 1) return
    if (!confirm(`删除「${room.name}」？其中的家具布局会一并删除。`)) return
    const rest = rooms.filter((r) => r.id !== room.id)
    setRooms(rest)
    setActiveRoomId(rest[0].id)
    setSelectedId(null)
    setPlacingType(null)
    setView((v) => ({ kind: v.kind, seq: v.seq + 1 }))
  }

  // ── 家具操作 ──
  const onPlace = useCallback(
    (type: FurnitureType, x: number, z: number) => {
      const id = `${type}-${Date.now().toString(36)}`
      setItems((list) => [...list, { id, type, x, z, rotation: 0 }])
      setSelectedId(id)
      setPlacingType(null)
    },
    [setItems],
  )

  const onMove = useCallback(
    (id: string, x: number, z: number) => {
      setItems((list) => list.map((i) => (i.id === id ? { ...i, x, z } : i)))
    },
    [setItems],
  )

  const items = room.items
  const selected = items.find((i) => i.id === selectedId) ?? null

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

  const rotateSelected = (deg: number) => {
    if (!selected) return
    applyRotation(selected.id, selected.rotation + (deg * Math.PI) / 180)
  }

  const dupSelected = () => {
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
  }

  const delSelected = () => {
    if (!selected) return
    setItems((list) => list.filter((i) => i.id !== selected.id))
    setSelectedId(null)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-100 font-sans">
      {/* 侧栏 */}
      <div className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-4">
          <h1 className="text-base font-semibold text-neutral-900">房间模型 · 桌椅摆放规划</h1>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            默认 3D 漫游：WASD 移动、拖动环视。切到平面模式可拖动平移画布、布置家具。布局自动保存在本机。
          </p>
        </div>

        {/* 房间列表 */}
        <div className="border-b border-neutral-200 px-4 py-3">
          <div className="mb-2 text-xs font-semibold tracking-widest text-neutral-400">我的房间</div>
          <div className="flex flex-wrap gap-1.5">
            {rooms.map((r) => (
              <button
                key={r.id}
                className={`${btn} max-w-[120px] truncate px-2.5 py-1 text-xs ${r.id === room.id ? btnActive : ''}`}
                title={r.name}
                onClick={() => switchRoom(r.id)}
              >
                {r.name}
              </button>
            ))}
            <button className={`${btn} px-2.5 py-1 text-xs`} onClick={addRoom} title="新增房间">
              ＋ 新增
            </button>
          </div>
          <div className="mt-2 flex gap-3 text-xs text-neutral-500">
            <button className="hover:text-neutral-800" onClick={renameRoom}>
              重命名
            </button>
            {rooms.length > 1 && (
              <button className="text-red-500 hover:text-red-700" onClick={deleteRoom}>
                删除当前房间
              </button>
            )}
          </div>
        </div>

        <Section title="视角">
          <div className="flex gap-2">
            <button
              className={`${btn} flex-1 ${view.kind === 'plan' ? btnActive : ''}`}
              onClick={() => setView((v) => ({ kind: 'plan', seq: v.seq + 1 }))}
            >
              平面模式
            </button>
            <button
              className={`${btn} flex-1 ${view.kind === 'walk' ? btnActive : ''}`}
              onClick={() => setView((v) => ({ kind: 'walk', seq: v.seq + 1 }))}
            >
              自由漫游
            </button>
            <button
              className={`${btn} flex-1 ${view.kind === 'immersive' ? btnActive : ''}`}
              onClick={() => setView((v) => ({ kind: 'immersive', seq: v.seq + 1 }))}
            >
              沉浸体验
            </button>
          </div>
          <p className="text-[11px] leading-4 text-neutral-400">
            自由漫游：无碰撞摄像机，可穿墙升降。沉浸体验：模拟人开门进屋，落地走/跑/跳，有真实碰撞。
          </p>
        </Section>

        <Section title="8 人办公方案（技术团队）">
          <button
            className={`${btn} w-full border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800`}
            onClick={() => {
              setItems(() => buildOfficeLayout())
              setSelectedId(null)
              setPlacingType(null)
            }}
          >
            一键摆入 8 人办公布局
          </button>
          <div className="mt-1 flex flex-col gap-1.5">
            {SHOPPING_LIST.map((e) => (
              <div key={e.key} className="flex items-baseline justify-between gap-2 text-xs text-neutral-600">
                <span className="leading-4">
                  {e.name} <span className="text-neutral-400">{e.spec} ×{e.qty}</span>
                </span>
                <span className="whitespace-nowrap font-medium text-neutral-800">
                  ¥{(e.unitPrice * e.qty).toFixed(e.unitPrice % 1 ? 2 : 0)}
                </span>
              </div>
            ))}
            <div className="mt-1 flex items-baseline justify-between border-t border-neutral-200 pt-1.5 text-xs">
              <span className="text-neutral-500">合计（预算 ¥{BUDGET}）</span>
              <span className={`font-semibold ${shoppingTotal > BUDGET ? 'text-red-600' : 'text-emerald-600'}`}>
                ¥{shoppingTotal.toFixed(2)}
                {shoppingTotal > BUDGET && ` · 超 ¥${(shoppingTotal - BUDGET).toFixed(2)}`}
              </span>
            </div>
          </div>
        </Section>

        <Section title="添加家具">
          <div className="grid grid-cols-2 gap-2">
            {Object.values(FURNITURE_DEFS).map((def) => (
              <button
                key={def.type}
                className={`${btn} ${placingType === def.type ? btnActive : ''}`}
                onClick={() => setPlacingType((t) => (t === def.type ? null : def.type))}
              >
                {def.label}
              </button>
            ))}
          </div>
          {placingType && (
            <p className="text-xs text-amber-600">放置模式：在地面上点击放置，Esc 取消。</p>
          )}
        </Section>

        {selected && (
          <Section title={`已选中：${FURNITURE_DEFS[selected.type].label}`}>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <span className="whitespace-nowrap">角度</span>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                className="flex-1"
                value={Math.round((selected.rotation * 180) / Math.PI) % 360}
                onChange={(e) => applyRotation(selected.id, (parseFloat(e.target.value) * Math.PI) / 180)}
              />
              <span className="w-10 text-right text-xs text-neutral-500">
                {Math.round((selected.rotation * 180) / Math.PI) % 360}°
              </span>
            </label>
            <div className="flex gap-2">
              <button className={`${btn} flex-1`} onClick={() => rotateSelected(45)}>
                转 45°
              </button>
              <button className={`${btn} flex-1`} onClick={() => rotateSelected(90)}>
                转 90°
              </button>
            </div>
            <div className="flex gap-2">
              <button className={`${btn} flex-1`} onClick={dupSelected}>
                复制
              </button>
              <button className={`${btn} flex-1 text-red-600 hover:border-red-400`} onClick={delSelected}>
                删除
              </button>
            </div>
          </Section>
        )}

        <Section title="房间尺寸（米）">
          <NumField label="长（窗到门）" value={room.params.length} step={0.05} min={2} max={20} onChange={(v) => patchRoom({ length: v })} />
          <NumField label="宽" value={room.params.width} step={0.05} min={1.5} max={20} onChange={(v) => patchRoom({ width: v })} />
          <NumField label="层高（估）" value={room.params.height} step={0.05} min={2.2} max={5} onChange={(v) => patchRoom({ height: v })} />
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={room.params.showCeiling}
              onChange={(e) => patchRoom({ showCeiling: e.target.checked })}
            />
            显示天花板
          </label>
        </Section>

        <Section title="角落凸起（柱 / 管道井）">
          <p className="text-[11px] leading-4 text-neutral-400">
            房间四角可能有结构凸起，按俯视平面的方位逐个设置（0 表示无凸起）。
          </p>
          <div className="grid grid-cols-2 gap-2">
            {room.bumps.map((b, i) => (
              <div key={i} className="rounded-md border border-neutral-200 p-2">
                <div className="mb-1.5 text-xs font-medium text-neutral-600">{CORNER_LABELS[i]}</div>
                <div className="flex flex-col gap-1.5">
                  <NumField label="横向" value={b.w} step={0.05} min={0} max={1.5} onChange={(v) => patchBump(i, { w: v })} />
                  <NumField label="纵向" value={b.d} step={0.05} min={0} max={1.5} onChange={(v) => patchBump(i, { d: v })} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="窗户（端墙）">
          <NumField label="窗宽" value={room.params.windowWidth} step={0.1} min={0.6} max={room.params.width - 0.2} onChange={(v) => patchRoom({ windowWidth: v })} />
          <NumField label="窗台高" value={room.params.windowSill} step={0.05} min={0} max={2} onChange={(v) => patchRoom({ windowSill: v })} />
          <NumField label="窗高" value={room.params.windowHeight} step={0.05} min={0.4} max={3} onChange={(v) => patchRoom({ windowHeight: v })} />
          <button
            className={btn}
            onClick={() => patchRoom({ windowEnd: room.params.windowEnd === 'negX' ? 'posX' : 'negX' })}
          >
            窗 / 门互换方向
          </button>
        </Section>

        <Section title="门（窗对面）">
          <NumField label="门宽" value={room.params.doorWidth} step={0.05} min={0.6} max={1.6} onChange={(v) => patchRoom({ doorWidth: v })} />
          <NumField label="门偏移" value={room.params.doorOffset} step={0.05} min={-room.params.width / 2 + room.params.doorWidth / 2} max={room.params.width / 2 - room.params.doorWidth / 2} onChange={(v) => patchRoom({ doorOffset: v })} />
        </Section>

        <div className="px-4 py-3">
          <button
            className={`${btn} w-full text-red-600 hover:border-red-400`}
            onClick={() => {
              if (confirm('清空当前房间的所有家具？')) {
                setItems(() => [])
                setSelectedId(null)
              }
            }}
          >
            清空家具（{items.length} 件）
          </button>
        </div>
      </div>

      {/* 3D 视口 */}
      <div className="relative flex-1">
        <RoomScene
          room={room.params}
          bumps={room.bumps}
          items={items}
          obstacles={obstacles}
          selectedId={selectedId}
          placingType={placingType}
          view={view}
          onSelect={setSelectedId}
          onMove={onMove}
          onPlace={onPlace}
        />
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-white/85 px-3 py-1.5 text-xs text-neutral-500 shadow-sm">
          {view.kind === 'walk' &&
            'WASD / 方向键移动 · Space 升 / C 降 · Shift 加速 · 拖动环视 · 无碰撞 · Esc 返回平面'}
          {view.kind === 'immersive' &&
            'WASD 移动 · Shift 跑 · Space 跳 · 拖动环视 · Esc 返回平面'}
          {view.kind === 'plan' && '左键拖动平移画布 · 滚轮缩放 · 点家具可拖动布置 · 网格间距 0.5 m'}
        </div>
        {(view.kind === 'walk' || view.kind === 'immersive') && (
          <div className="absolute right-3 top-3">
            <button
              className={`${btn} bg-white/90 shadow-sm`}
              onClick={() => setView((v) => ({ kind: 'plan', seq: v.seq + 1 }))}
            >
              返回平面
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

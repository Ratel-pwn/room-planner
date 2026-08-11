import { useCallback, useEffect, useMemo, useState } from 'react'
import { RoomScene, type ViewCommand } from '@/components/RoomScene'
import { buildRoomObstacles } from '@/three/buildRoom'
import { clampToRoom, findCollision } from '@/three/collision'
import { BUDGET, SHOPPING_LIST, buildOfficeLayout, shoppingTotal } from '@/three/presets'
import { DEFAULT_ROOM, FURNITURE_DEFS, type FurnitureItem, type FurnitureType, type RoomParams } from '@/three/types'

const LS_KEY = 'room-planner-v1'

interface SavedState {
  room: RoomParams
  items: FurnitureItem[]
}

function loadSaved(): SavedState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const s = JSON.parse(raw) as SavedState
      return { room: { ...DEFAULT_ROOM, ...s.room }, items: s.items ?? [] }
    }
  } catch {
    /* ignore */
  }
  return { room: DEFAULT_ROOM, items: [] }
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

export default function App() {
  const [saved] = useState(loadSaved)
  const [room, setRoom] = useState<RoomParams>(saved.room)
  const [items, setItems] = useState<FurnitureItem[]>(saved.items)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [placingType, setPlacingType] = useState<FurnitureType | null>(null)
  const [view, setView] = useState<ViewCommand>({ kind: 'persp', seq: 0 })

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ room, items }))
  }, [room, items])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlacingType(null)
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const patchRoom = useCallback((patch: Partial<RoomParams>) => setRoom((r) => ({ ...r, ...patch })), [])

  /** 墙面凸出设施碰撞体（弱电箱、空调、门套、踢脚线等） */
  const obstacles = useMemo(() => buildRoomObstacles(room), [room])

  const onPlace = useCallback((type: FurnitureType, x: number, z: number) => {
    const id = `${type}-${Date.now().toString(36)}`
    setItems((list) => [...list, { id, type, x, z, rotation: 0 }])
    setSelectedId(id)
    setPlacingType(null)
  }, [])

  const onMove = useCallback((id: string, x: number, z: number) => {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, x, z } : i)))
  }, [])

  const selected = items.find((i) => i.id === selectedId) ?? null

  /** 旋转（碰撞或越界时不生效） */
  const applyRotation = useCallback(
    (id: string, rotation: number) => {
      setItems((list) => {
        const it = list.find((i) => i.id === id)
        if (!it) return list
        const rot = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
        const c = clampToRoom(room, it.type, rot, it.x, it.z)
        if (findCollision(list, { type: it.type, rotation: rot, x: c.x, z: c.z, excludeId: id }, 0.02, obstacles))
          return list
        return list.map((i) => (i.id === id ? { ...i, rotation: rot, x: c.x, z: c.z } : i))
      })
    },
    [room, obstacles],
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
        const c = clampToRoom(room, selected.type, selected.rotation, selected.x + dx, selected.z + dz)
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
            点「添加」后在地面点击放置；拖动家具移动；点选后可旋转、复制、删除。布局自动保存在本机。
          </p>
        </div>

        <Section title="视角">
          <div className="flex gap-2">
            <button
              className={`${btn} flex-1 ${view.kind === 'persp' ? btnActive : ''}`}
              onClick={() => setView((v) => ({ kind: 'persp', seq: v.seq + 1 }))}
            >
              3D 视角
            </button>
            <button
              className={`${btn} flex-1 ${view.kind === 'top' ? btnActive : ''}`}
              onClick={() => setView((v) => ({ kind: 'top', seq: v.seq + 1 }))}
            >
              俯视平面
            </button>
          </div>
        </Section>

        <Section title="8 人办公方案（技术团队）">
          <button
            className={`${btn} w-full border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800`}
            onClick={() => {
              setItems(buildOfficeLayout())
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
            <p className="text-[11px] leading-4 text-neutral-400">
              价格为 2026-08 淘宝/京东/苏宁公开在售参考价；若想卡进 ¥1000，沙发可换二手或延后采购。
            </p>
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
          <NumField label="长（窗到门）" value={room.length} step={0.05} min={2} max={20} onChange={(v) => patchRoom({ length: v })} />
          <NumField label="宽" value={room.width} step={0.05} min={1.5} max={20} onChange={(v) => patchRoom({ width: v })} />
          <NumField label="层高（估）" value={room.height} step={0.05} min={2.2} max={5} onChange={(v) => patchRoom({ height: v })} />
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={room.showCeiling}
              onChange={(e) => patchRoom({ showCeiling: e.target.checked })}
            />
            显示天花板
          </label>
        </Section>

        <Section title="窗户（端墙）">
          <NumField label="窗宽" value={room.windowWidth} step={0.1} min={0.6} max={room.width - 0.2} onChange={(v) => patchRoom({ windowWidth: v })} />
          <NumField label="窗台高" value={room.windowSill} step={0.05} min={0} max={2} onChange={(v) => patchRoom({ windowSill: v })} />
          <NumField label="窗高" value={room.windowHeight} step={0.05} min={0.4} max={3} onChange={(v) => patchRoom({ windowHeight: v })} />
          <button
            className={btn}
            onClick={() => patchRoom({ windowEnd: room.windowEnd === 'negX' ? 'posX' : 'negX' })}
          >
            窗 / 门互换方向
          </button>
        </Section>

        <Section title="门（窗对面）">
          <NumField label="门宽" value={room.doorWidth} step={0.05} min={0.6} max={1.6} onChange={(v) => patchRoom({ doorWidth: v })} />
          <NumField label="门偏移" value={room.doorOffset} step={0.05} min={-room.width / 2 + room.doorWidth / 2} max={room.width / 2 - room.doorWidth / 2} onChange={(v) => patchRoom({ doorOffset: v })} />
        </Section>

        <div className="px-4 py-3">
          <button
            className={`${btn} w-full text-red-600 hover:border-red-400`}
            onClick={() => {
              if (confirm('清空所有家具？')) {
                setItems([])
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
          room={room}
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
          左键拖动旋转视角 · 滚轮缩放 · 右键拖动平移 · 网格间距 0.5 m
        </div>
      </div>
    </div>
  )
}

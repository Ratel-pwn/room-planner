import { useEffect, useRef } from 'react'
import { RotateCw, Settings2, Trash2 } from 'lucide-react'
import type { RoomAnchors } from '@/features/planner/model/scene'
import type { RoomConfig } from '@/three/types'
import { cn } from '@/lib/utils'

interface Props {
  room: RoomConfig
  /** 是否为当前编辑的房间 */
  active: boolean
  /** 是否能删除（至少保留一个房间） */
  canDelete: boolean
  /** RoomScene 每帧写入的房间屏幕锚点表 */
  anchors: React.RefObject<RoomAnchors>
  /** 打开该房间的设置窗口 */
  onOpenSettings: (id: string) => void
  /** 顺时针旋转 90°（与其他房间重叠时不生效） */
  onRotate90: (id: string) => void
  onDelete: (id: string) => void
}

/**
 * 布局模式下跟随每个房间的浮动工具条：设置 / 旋转 90° / 删除。
 * 位置通过 rAF 直接写 transform，不走 React 渲染。
 */
export function RoomFloat({ room, active, canDelete, anchors, onOpenSettings, onRotate90, onDelete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const el = rootRef.current
      const a = anchors.current?.[room.id]
      if (!el || !a) return
      el.style.opacity = a.visible ? '1' : '0'
      el.style.pointerEvents = a.visible ? 'auto' : 'none'
      el.style.transform = `translate(${a.x}px, ${a.y}px) translate(-50%, calc(-100% - 6px))`
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [anchors, room.id])

  return (
    <div
      ref={rootRef}
      className={cn(
        'hud-panel absolute left-0 top-0 z-40 flex items-center gap-1.5 px-2 py-1 opacity-0 transition-opacity duration-100 will-change-transform',
        active && 'outline-2 outline-[#e0a92e]',
      )}
    >
      <span
        className={cn(
          'max-w-[110px] truncate text-xs font-semibold',
          active ? 'text-[#f2c353]' : 'text-[#ece7da]',
        )}
      >
        {room.name}
      </span>
      <span className="h-4 w-0.5 rounded bg-black/60" />
      <button className="hud-btn p-1" title="房间设置" onClick={() => onOpenSettings(room.id)}>
        <Settings2 size={13} />
      </button>
      <button className="hud-btn p-1" title="顺时针旋转 90°" onClick={() => onRotate90(room.id)}>
        <RotateCw size={13} />
      </button>
      <button
        className="hud-btn hud-btn-danger p-1"
        title={canDelete ? '删除房间' : '至少保留一个房间'}
        disabled={!canDelete}
        onClick={() => onDelete(room.id)}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

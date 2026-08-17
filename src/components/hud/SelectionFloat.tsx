import { useEffect, useRef } from 'react'
import { Copy, RotateCcw, RotateCw, Trash2, X } from 'lucide-react'
import type { SelectionAnchor } from '@/components/RoomScene'
import { FURNITURE_DEFS, type FurnitureItem } from '@/three/types'

interface Props {
  /** RoomScene 每帧写入的选中家具屏幕投影锚点 */
  anchor: React.RefObject<SelectionAnchor>
  selected: FurnitureItem
  onRotate: (deg: number) => void
  onRotateTo: (deg: number) => void
  onDuplicate: () => void
  onDelete: () => void
  onClose: () => void
}

/**
 * 跟随选中家具悬浮在其上方的操作条。
 * 顶部带一个修图软件式的旋转把手：按住把手绕家具拖动即可调角度。
 * 位置通过 rAF 直接写 transform，不走 React 渲染。
 */
export function SelectionFloat({ anchor, selected, onRotate, onRotateTo, onDuplicate, onDelete, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const deg = ((Math.round((selected.rotation * 180) / Math.PI) % 360) + 360) % 360

  // 每帧跟随家具投影位置
  useEffect(() => {
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const el = rootRef.current
      const a = anchor.current
      if (!el || !a) return
      const show = a.visible
      el.style.opacity = show ? '1' : '0'
      el.style.pointerEvents = show ? 'auto' : 'none'
      el.style.transform = `translate(${a.x}px, ${a.y}px) translate(-50%, calc(-100% - 14px))`
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [anchor])

  // 旋转把手：绕家具屏幕中心拖动，平面视角下屏幕顺时针 = 世界 Y 轴反向
  const onKnobDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const a = anchor.current
    if (!a) return
    const phi0 = Math.atan2(e.clientY - a.cy, e.clientX - a.cx)
    const rot0 = (selected.rotation * 180) / Math.PI
    const move = (ev: PointerEvent) => {
      const aa = anchor.current
      if (!aa) return
      const phi = Math.atan2(ev.clientY - aa.cy, ev.clientX - aa.cx)
      const delta = ((phi - phi0) * 180) / Math.PI
      onRotateTo(rot0 - delta)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      ref={rootRef}
      className="absolute left-0 top-0 flex flex-col items-center opacity-0 transition-opacity duration-100 will-change-transform"
    >
      {/* 旋转把手 */}
      <button
        onPointerDown={onKnobDown}
        title="按住拖动旋转"
        className="flex h-6 w-6 cursor-grab items-center justify-center rounded-full border-2 border-[#0c0b0a] bg-gradient-to-b from-[#e8b33c] to-[#cd9b1f] shadow-[0_2px_0_#0c0b0a,inset_0_1px_0_rgba(255,255,255,0.35)] active:cursor-grabbing active:translate-y-0.5 active:shadow-none"
      >
        <RotateCw size={11} className="text-[#241b06]" />
      </button>
      {/* 连接线 */}
      <div className="h-5 w-0.5 bg-[#0c0b0a]/70" />

      {/* 操作条 */}
      <div className="hud-panel flex items-center gap-2 px-2.5 py-1.5">
        <span className="max-w-[130px] truncate text-xs font-semibold text-[#ece7da]">
          {FURNITURE_DEFS[selected.type].short}
        </span>
        <span className="w-9 text-right text-xs tabular-nums text-[#f2c353]">{deg}°</span>
        <span className="h-5 w-0.5 rounded bg-black/60" />
        <button className="hud-btn px-2 py-1 text-xs" onClick={() => onRotate(45)} title="顺时针转 45°">
          <RotateCw size={13} /> 45°
        </button>
        <button className="hud-btn px-2 py-1 text-xs" onClick={() => onRotate(90)} title="顺时针转 90°">
          <RotateCcw size={13} /> 90°
        </button>
        <button className="hud-btn px-2 py-1 text-xs" onClick={onDuplicate} title="复制">
          <Copy size={13} />
        </button>
        <button className="hud-btn hud-btn-danger px-2 py-1 text-xs" onClick={onDelete} title="删除">
          <Trash2 size={13} />
        </button>
        <button className="hud-btn px-1.5 py-1 text-xs" onClick={onClose} title="取消选中 (Esc)">
          <X size={13} />
        </button>
      </div>
    </div>
  )
}

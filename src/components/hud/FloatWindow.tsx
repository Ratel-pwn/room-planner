import { useRef, useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  /** 窗口标题 */
  title: React.ReactNode
  /** 初始位置（左上角，像素） */
  initialX?: number
  initialY?: number
  /** 内容宽度 */
  width?: number
  onClose: () => void
  children: React.ReactNode
}

/**
 * 可拖拽的浮动窗口（非模态）。
 * 按住标题栏拖动；窗口不遮罩场景，可与 3D 画面同时交互。
 */
export function FloatWindow({ title, initialX, initialY, width = 340, onClose, children }: Props) {
  const [pos, setPos] = useState(() => ({
    x: initialX ?? Math.max(16, (window.innerWidth - width) / 2),
    y: initialY ?? Math.max(70, window.innerHeight * 0.16),
  }))
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)

  const onHeaderDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    // 点到关闭按钮时不启动拖拽
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    const move = (ev: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      setPos({
        x: Math.min(Math.max(0, ev.clientX - d.dx), window.innerWidth - 80),
        y: Math.min(Math.max(0, ev.clientY - d.dy), window.innerHeight - 48),
      })
    }
    const up = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      className="hud-panel absolute z-50 flex flex-col overflow-hidden"
      style={{ left: pos.x, top: pos.y, width }}
    >
      {/* 标题栏（拖拽把手） */}
      <div
        onPointerDown={onHeaderDown}
        className="flex cursor-grab touch-none items-center justify-between gap-2 border-b border-black/50 bg-black/30 px-3 py-2 select-none active:cursor-grabbing"
      >
        <div className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-[#f2eee4]">{title}</div>
        <button
          className="hud-btn h-6 w-6 shrink-0 p-0"
          onClick={onClose}
          title="关闭"
        >
          <X size={13} />
        </button>
      </div>
      {/* 内容区 */}
      <div className="max-h-[70vh] overflow-y-auto">{children}</div>
    </div>
  )
}

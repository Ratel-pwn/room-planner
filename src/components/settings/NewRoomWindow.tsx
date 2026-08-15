import { useState } from 'react'
import { Plus } from 'lucide-react'
import { FloatWindow } from '@/components/hud/FloatWindow'
import { NumField, Section } from './fields'

interface Props {
  /** 已有房间数量（生成默认名称） */
  roomCount: number
  onClose: () => void
  onAdd: (cfg: { name: string; length: number; width: number; height: number }) => void
}

/** 新增房间窗口（可拖拽）：设置名称与尺寸后添加，随后可在布局模式拖拽摆放 */
export function NewRoomWindow(p: Props) {
  const [name, setName] = useState(`房间 ${p.roomCount + 1}`)
  const [length, setLength] = useState(4)
  const [width, setWidth] = useState(3.2)
  const [height, setHeight] = useState(2.8)

  const submit = () => {
    p.onAdd({ name: name.trim() || `房间 ${p.roomCount + 1}`, length, width, height })
    p.onClose()
  }

  return (
    <FloatWindow
      title={
        <>
          <Plus size={15} className="shrink-0 text-[#e0a92e]" /> 新增房间
        </>
      }
      width={300}
      initialY={Math.max(70, window.innerHeight * 0.24)}
      onClose={p.onClose}
    >
      <Section title="基本参数">
        <label className="flex items-center justify-between gap-2 text-sm text-[#d8d2c2]">
          <span className="whitespace-nowrap">名称</span>
          <input
            className="hud-input"
            value={name}
            maxLength={10}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
        </label>
        <NumField label="长（米）" value={length} step={0.1} min={2} max={20} onChange={setLength} />
        <NumField label="宽（米）" value={width} step={0.1} min={1.5} max={20} onChange={setWidth} />
        <NumField label="层高（米）" value={height} step={0.1} min={2.2} max={5} onChange={setHeight} />
      </Section>
      <div className="flex gap-2 px-4 py-3">
        <button className="hud-btn flex-1 text-xs" onClick={p.onClose}>
          取消
        </button>
        <button className="hud-btn hud-btn-amber flex-1 text-xs" onClick={submit}>
          <Plus size={13} /> 添加房间
        </button>
      </div>
    </FloatWindow>
  )
}

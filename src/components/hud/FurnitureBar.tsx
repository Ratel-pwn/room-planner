import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { FURNITURE_DEFS, type FurnitureItem, type FurnitureType } from '@/three/types'
import { getFurnitureThumbnails, type Thumbnails } from '@/three/thumbnails'
import { FurnitureCard } from './FurnitureCard'
import { getFurnitureBarTransform, toggleFurnitureBar } from './hudControls'

interface Props {
  placingType: FurnitureType | null
  items: FurnitureItem[]
  onPick: (type: FurnitureType) => void
  onOpenSettings: () => void
}

/** 屏幕底部的建造工具栏：家具卡片 + 数字快捷键（1-8） */
export function FurnitureBar({ placingType, items, onPick, onOpenSettings }: Props) {
  const [thumbs, setThumbs] = useState<Thumbnails>({})
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    // 首帧后再生成离屏缩略图，避免阻塞 3D 场景初始化
    const t = window.setTimeout(() => setThumbs(getFurnitureThumbnails()), 60)
    return () => window.clearTimeout(t)
  }, [])

  const defs = Object.values(FURNITURE_DEFS)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex flex-col items-center gap-2">
      {placingType && (
        <div className="hud-panel pointer-events-auto px-3 py-1.5 text-xs text-[#f2c353]">
          放置模式：点击地面摆放「{FURNITURE_DEFS[placingType].short}」 · Esc 取消
        </div>
      )}
      <div
        data-furniture-bar
        className="hud-panel pointer-events-auto relative flex items-center gap-2 px-2.5 py-2 transition-transform duration-200 ease-out"
        style={{ transform: getFurnitureBarTransform(collapsed) }}
      >
        <button
          data-furniture-collapse
          className="hud-btn absolute -top-[18px] left-1/2 -ml-7 h-5 w-14 rounded-b-none rounded-t-[8px] border-b-0 p-0 shadow-none"
          onClick={() => setCollapsed((value) => toggleFurnitureBar(value))}
          title={collapsed ? '展开家具栏' : '收起家具栏'}
          aria-label={collapsed ? '展开家具栏' : '收起家具栏'}
        >
          {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        <div className="absolute -top-3 right-2">
          <button
            className="hud-btn h-7 w-7 rounded-full p-0"
            onClick={onOpenSettings}
            title="家具设置"
            aria-label="打开家具设置"
          >
            <Settings size={14} />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {defs.map((def, i) => (
            <FurnitureCard
              key={def.type}
              def={def}
              thumb={thumbs[def.type]}
              hotkey={i + 1}
              active={placingType === def.type}
              count={items.filter((it) => it.type === def.type).length}
              onClick={() => onPick(def.type)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

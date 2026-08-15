import { useEffect, useState } from 'react'
import { Hammer } from 'lucide-react'
import { FURNITURE_DEFS, type FurnitureItem, type FurnitureType } from '@/three/types'
import { getFurnitureThumbnails, type Thumbnails } from '@/three/thumbnails'
import { FurnitureCard } from './FurnitureCard'

interface Props {
  placingType: FurnitureType | null
  items: FurnitureItem[]
  onPick: (type: FurnitureType) => void
}

/** 屏幕底部的建造工具栏：家具卡片 + 数字快捷键（1-8） */
export function FurnitureBar({ placingType, items, onPick }: Props) {
  const [thumbs, setThumbs] = useState<Thumbnails>({})

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
      <div className="hud-panel pointer-events-auto flex items-center gap-2 px-2.5 py-2">
        <div className="flex flex-col items-center px-1.5">
          <Hammer size={16} className="text-[#e0a92e]" />
          <span className="hud-label mt-1">建造</span>
        </div>
        <div className="h-12 w-0.5 rounded bg-black/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
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

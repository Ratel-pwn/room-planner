import { useEffect, useState } from 'react'
import { Armchair, Trash2 } from 'lucide-react'
import { FurnitureCard } from '@/components/hud/FurnitureCard'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FURNITURE_DEFS, type FurnitureType } from '@/three/types'
import { getFurnitureThumbnails, type Thumbnails } from '@/three/thumbnails'
import { Section } from './fields'

interface ContentProps {
  itemCount: number
  clearItems: () => void
  onPick: (type: FurnitureType) => void
  thumbnails?: Thumbnails
}

export function FurnitureSettingsContent(p: ContentProps) {
  return (
    <>
      <DialogHeader className="border-b border-black/50 px-5 py-4">
        <DialogTitle className="flex items-center gap-2 text-[#f2eee4]">
          <Armchair size={16} className="text-[#e0a92e]" /> 家具设置
        </DialogTitle>
      </DialogHeader>

      <Section title="家具列表">
        <div className="flex flex-wrap gap-2">
          {Object.values(FURNITURE_DEFS).map((def, index) => (
            <FurnitureCard
              key={def.type}
              def={def}
              thumb={p.thumbnails?.[def.type]}
              hotkey={index + 1}
              active={false}
              count={0}
              onClick={() => p.onPick(def.type)}
            />
          ))}
        </div>
      </Section>

      <div className="px-4 py-3">
        <button className="hud-btn hud-btn-danger w-full" onClick={p.clearItems}>
          <Trash2 size={14} /> 清空家具（{p.itemCount} 件）
        </button>
      </div>
    </>
  )
}

interface Props extends ContentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FurnitureSettingsDialog(p: Props) {
  const [thumbnails, setThumbnails] = useState<Thumbnails>({})

  useEffect(() => {
    if (!p.open) return
    const timer = window.setTimeout(() => setThumbnails(getFurnitureThumbnails()), 60)
    return () => window.clearTimeout(timer)
  }, [p.open])

  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto border-2 border-[#0c0b0a] bg-[#211f1c] p-0 text-[#f2eee4] shadow-[0_6px_0_rgba(0,0,0,0.5)] sm:max-w-[440px] [&>button]:text-[#9a917f] [&>button]:hover:text-[#f2eee4]">
        <FurnitureSettingsContent
          itemCount={p.itemCount}
          clearItems={p.clearItems}
          onPick={(type) => {
            p.onPick(type)
            p.onOpenChange(false)
          }}
          thumbnails={thumbnails}
        />
      </DialogContent>
    </Dialog>
  )
}

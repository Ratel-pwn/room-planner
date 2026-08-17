import { useEffect, useState } from 'react'
import { Armchair, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FURNITURE_DEFS } from '@/three/types'
import { getFurnitureThumbnails, type Thumbnails } from '@/three/thumbnails'
import { Section } from './fields'

interface ContentProps {
  itemCount: number
  clearItems: () => void
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
        <div className="grid grid-cols-2 gap-2">
          {Object.values(FURNITURE_DEFS).map((def) => (
            <div
              key={def.type}
              className="flex min-w-0 items-center gap-2 rounded-lg border border-black/45 bg-[#2b2925] p-2"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#1b1a18]">
                {p.thumbnails?.[def.type] ? (
                  <img
                    src={p.thumbnails[def.type] ?? undefined}
                    alt={def.short}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Armchair size={20} className="text-[#756e60]" />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-[#f2eee4]">{def.short}</div>
                <div className="mt-0.5 whitespace-nowrap text-[10px] text-[#9a917f]">
                  {def.w} × {def.d} × {def.h} m
                </div>
                <div className="mt-0.5 text-[10px] text-[#c99a35]">
                  {def.price == null ? '暂无参考价' : `¥${def.price}`}
                </div>
              </div>
            </div>
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
          thumbnails={thumbnails}
        />
      </DialogContent>
    </Dialog>
  )
}

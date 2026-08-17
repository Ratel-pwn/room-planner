import { Building2, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { SpaceConfig } from '@/three/types'
import { NumField, Section } from './fields'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  space: SpaceConfig
  canDeleteSpace: boolean
  renameSpace: () => void
  deleteSpace: () => void
  eyeHeight: number
  setEyeHeight: (value: number) => void
}

/** 全局设置弹窗：空间管理与全局体验参数。 */
export function SettingsDialog(p: Props) {
  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto border-2 border-[#0c0b0a] bg-[#211f1c] p-0 text-[#f2eee4] shadow-[0_6px_0_rgba(0,0,0,0.5)] sm:max-w-[420px] [&>button]:text-[#9a917f] [&>button]:hover:text-[#f2eee4]">
        <DialogHeader className="border-b border-black/50 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 pr-6 text-[#f2eee4]">
            <Building2 size={16} className="text-[#e0a92e]" /> 空间设置
          </DialogTitle>
          <p className="text-xs leading-5 text-[#9a917f]">
            当前：{p.space.name} · {p.space.rooms.length} 个房间
          </p>
        </DialogHeader>

        <Section title="空间管理">
          <div className="flex gap-2">
            <button className="hud-btn flex-1 text-xs" onClick={p.renameSpace}>
              <Pencil size={13} /> 重命名空间
            </button>
            <button className="hud-btn hud-btn-danger flex-1 text-xs" disabled={!p.canDeleteSpace} onClick={p.deleteSpace}>
              <Trash2 size={13} /> 删除空间
            </button>
          </div>
          <p className="text-[11px] leading-4 text-[#7d7666]">
            房间的新增、删除与参数设置：切到“布局”模式，使用场景里的 + 和每个房间的悬浮栏操作。
          </p>
        </Section>

        <Section title="沉浸设置">
          <NumField
            label="眼高（米）"
            value={p.eyeHeight}
            min={1}
            max={2.5}
            step={0.05}
            onChange={p.setEyeHeight}
          />
          <p className="text-[11px] leading-4 text-[#7d7666]">对所有空间和房间生效，默认为 1.7 米。</p>
        </Section>
      </DialogContent>
    </Dialog>
  )
}

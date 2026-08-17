import { useState } from 'react'
import { Building2, CircleHelp, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { SpaceConfig } from '@/three/types'
import { NumField, Section } from './fields'

const HELP_ITEMS: Array<{ title: string; keys: string }> = [
  { title: '布局模式', keys: '拖动房间摆放位置 · 房间上方悬浮条可设置 / 旋转 / 删除 · 右下角 + 新增房间 · 双击进入房间' },
  { title: '平面模式', keys: '左键拖动平移 · 滚轮缩放 · 点家具可拖动 · 数字键 1-8 选家具' },
  { title: '自由漫游', keys: 'WASD 沿视野方向移动（朝哪看往哪飞）· Space 抬升 / C 下降 · Shift 加速 · 拖动环视 · 点击选中家具 · Esc 返回平面' },
  { title: '沉浸体验', keys: 'WASD 移动 · Shift 跑 · Space 跳 · 靠近并看向门按 F 开关门 · 拖动环视 · 点击选中家具 · Esc 返回平面' },
  { title: '放置家具', keys: '底部建造栏选家具（或按 1-8）· 点击地面摆放 · Esc 取消' },
]

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

/** 全局设置弹窗：空间管理 + 操作说明（房间设置在各房间的悬浮窗口里） */
export function SettingsDialog(p: Props) {
  const [helpOpen, setHelpOpen] = useState(false)
  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto border-2 border-[#0c0b0a] bg-[#211f1c] p-0 text-[#f2eee4] shadow-[0_6px_0_rgba(0,0,0,0.5)] sm:max-w-[420px] [&>button]:text-[#9a917f] [&>button]:hover:text-[#f2eee4]">
        <DialogHeader className="border-b border-black/50 px-5 py-4">
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="flex items-center gap-2 text-[#f2eee4]">
              <Building2 size={16} className="text-[#e0a92e]" /> 空间设置
            </DialogTitle>
            <button
              className={`hud-btn h-7 w-7 rounded-full p-0 ${helpOpen ? 'hud-btn-active' : ''}`}
              onClick={() => setHelpOpen((v) => !v)}
              title="操作说明"
            >
              <CircleHelp size={15} />
            </button>
          </div>
          <p className="text-xs leading-5 text-[#9a917f]">
            当前：{p.space.name} · {p.space.rooms.length} 个房间
          </p>
          {helpOpen && (
            <div className="hud-inset mt-2 flex flex-col gap-2">
              {HELP_ITEMS.map((h) => (
                <div key={h.title}>
                  <div className="text-xs font-semibold text-[#f2c353]">{h.title}</div>
                  <div className="text-[11px] leading-4 text-[#b8b1a0]">{h.keys}</div>
                </div>
              ))}
            </div>
          )}
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
            房间的新增、删除与参数设置：切到「布局」模式，用场景里的 + 和每个房间的悬浮条操作。
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

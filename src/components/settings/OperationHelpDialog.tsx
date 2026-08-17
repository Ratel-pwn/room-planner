import { CircleHelp } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const HELP_ITEMS: Array<{ title: string; keys: string }> = [
  { title: '布局模式', keys: '拖动房间摆放位置 · 房间上方悬浮栏可设置 / 旋转 / 删除 · 右下角 + 新增房间 · 双击进入房间' },
  { title: '平面模式', keys: '左键拖动画布 · 滚轮缩放 · 点击家具可拖动 · 数字键 1-8 选择家具' },
  { title: '自由漫游', keys: 'WASD 沿视野方向移动 · Space 抬升 / C 下降 · Shift 加速 · 拖动环视 · Esc 返回平面' },
  { title: '沉浸体验', keys: 'WASD 移动 · Shift 跑 · Space 跳 · 靠近并看向门按 F 开关门 · 拖动环视 · Esc 返回平面' },
  { title: '放置家具', keys: '从底部家具栏选择家具（或按 1-8）· 点击地面摆放 · Esc 取消' },
]

export function OperationHelpContent() {
  return (
    <>
      <DialogHeader className="border-b border-black/50 px-5 py-4">
        <DialogTitle className="flex items-center gap-2 text-[#f2eee4]">
          <CircleHelp size={16} className="text-[#e0a92e]" /> 操作说明
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-3 px-5 py-4">
        {HELP_ITEMS.map((item) => (
          <div key={item.title} className="hud-inset">
            <div className="text-xs font-semibold text-[#f2c353]">{item.title}</div>
            <div className="mt-1 text-[11px] leading-4 text-[#b8b1a0]">{item.keys}</div>
          </div>
        ))}
      </div>
    </>
  )
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OperationHelpDialog(p: Props) {
  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto border-2 border-[#0c0b0a] bg-[#211f1c] p-0 text-[#f2eee4] shadow-[0_6px_0_rgba(0,0,0,0.5)] sm:max-w-[440px] [&>button]:text-[#9a917f] [&>button]:hover:text-[#f2eee4]">
        <OperationHelpContent />
      </DialogContent>
    </Dialog>
  )
}

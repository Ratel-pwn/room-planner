import { Building2, ChevronDown, Coins, DoorOpen, Eye, Gamepad2, LayoutGrid, Map, Plus, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ViewCommand } from '@/components/RoomScene'
import { cn } from '@/lib/utils'
import type { RoomConfig, SpaceConfig } from '@/three/types'

const VIEW_MODES: Array<{ kind: ViewCommand['kind']; label: string; icon: typeof Map; hint: string }> = [
  { kind: 'layout', label: '布局', icon: LayoutGrid, hint: '空间布局：拖动摆放房间位置，双击进入房间' },
  { kind: 'plan', label: '平面', icon: Map, hint: '平面模式：拖动平移画布，布置家具' },
  { kind: 'walk', label: '漫游', icon: Eye, hint: '自由漫游：无碰撞摄像机，沿视野方向飞行' },
  { kind: 'immersive', label: '沉浸', icon: Gamepad2, hint: '沉浸体验：模拟人开门进屋，有真实碰撞' },
]

interface Props {
  space: SpaceConfig
  spaces: SpaceConfig[]
  room: RoomConfig
  viewKind: ViewCommand['kind']
  placedTotal: number
  onSwitchSpace: (id: string) => void
  onAddSpace: () => void
  onViewChange: (kind: ViewCommand['kind']) => void
  onOpenSettings: () => void
}

/** 顶部 HUD：空间切换 · 当前房间名 · 视角切换 · 经费 · 设置入口 */
export function TopBar(p: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3">
      {/* 左：空间切换 + 当前房间名（房间的增删改在布局模式里做） */}
      <div className="pointer-events-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hud-btn py-2 pl-3 pr-2.5">
              <Building2 size={15} className="text-[#e0a92e]" />
              <span className="max-w-[120px] truncate text-sm font-bold">{p.space.name}</span>
              <ChevronDown size={14} className="text-[#9a917f]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="border-2 border-[#0c0b0a] bg-[#242320] text-[#f2eee4] shadow-[0_4px_0_rgba(0,0,0,0.5)]"
          >
            <div className="hud-label px-2 py-1.5">切换空间</div>
            {p.spaces.map((s) => (
              <DropdownMenuItem
                key={s.id}
                onClick={() => p.onSwitchSpace(s.id)}
                className={cn(
                  'cursor-pointer focus:bg-[#3d3b36] focus:text-[#f2eee4]',
                  s.id === p.space.id && 'text-[#e8b33c]',
                )}
              >
                <span className="max-w-[160px] truncate">{s.name}</span>
                <span className="ml-auto pl-4 text-xs text-[#9a917f]">{s.rooms.length} 个房间</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-black/50" />
            <DropdownMenuItem onClick={p.onAddSpace} className="cursor-pointer focus:bg-[#3d3b36] focus:text-[#f2eee4]">
              <Plus size={14} className="mr-1 text-[#e0a92e]" /> 新增空间
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 静态展示当前房间名（不可点） */}
        <div className="hud-panel flex items-center gap-1.5 py-2 pl-3 pr-3" title="当前编辑的房间（在布局模式中切换）">
          <DoorOpen size={15} className="text-[#e0a92e]" />
          <span className="max-w-[120px] truncate text-sm font-bold">{p.room.name}</span>
        </div>
      </div>

      {/* 中：视角切换 */}
      <div className="hud-panel pointer-events-auto flex gap-1 p-1">
        {VIEW_MODES.map(({ kind, label, icon: Icon, hint }) => (
          <button
            key={kind}
            title={hint}
            onClick={() => p.onViewChange(kind)}
            className={cn('hud-btn border-transparent px-3 py-1.5 text-xs shadow-none', p.viewKind === kind && 'hud-btn-active')}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* 右：经费 + 设置 */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="hud-panel flex items-center gap-1.5 px-3 py-2" title="当前房间已摆放家具的参考总价">
          <Coins size={15} className="text-[#e8b33c]" />
          <span className="text-sm font-bold tabular-nums text-[#f2c353]">
            ¥{p.placedTotal.toFixed(p.placedTotal % 1 ? 2 : 0)}
          </span>
        </div>
        <button className="hud-btn p-2.5" onClick={p.onOpenSettings} title="空间设置与操作说明">
          <Settings size={16} />
        </button>
      </div>
    </div>
  )
}

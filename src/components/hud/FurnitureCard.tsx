import { cn } from '@/lib/utils'
import type { FurnitureDef } from '@/three/types'

interface Props {
  def: FurnitureDef
  thumb: string | null | undefined
  /** 快捷数字键（1 起） */
  hotkey: number
  /** 当前正处于该家具的放置模式 */
  active: boolean
  /** 房间里已摆放的数量 */
  count: number
  onClick: () => void
}

/** 底部家具栏中的单张家具卡片（建造游戏物品槽风格） */
export function FurnitureCard({ def, thumb, hotkey, active, count, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      title={`${def.label}（按 ${hotkey}）`}
      className={cn(
        'group relative flex w-[86px] shrink-0 flex-col items-center rounded-[10px] border-2 border-[#0c0b0a] pb-1.5 pt-1',
        'bg-gradient-to-b from-[#38362f] to-[#24231f]',
        'shadow-[0_3px_0_#0c0b0a,inset_0_1px_0_rgba(255,255,255,0.09)]',
        'transition-[transform,box-shadow,background] duration-75',
        'hover:-translate-y-1 hover:from-[#45423a] hover:to-[#2c2b26]',
        'active:translate-y-0 active:shadow-none',
        active &&
          'from-[#54471c] to-[#3a3115] shadow-[0_3px_0_#0c0b0a,0_0_14px_rgba(224,169,46,0.55),inset_0_0_0_2px_#e0a92e]',
      )}
    >
      {/* 快捷键角标 */}
      <span
        className={cn(
          'absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded border border-black/60',
          'bg-black/55 text-[10px] font-bold leading-none text-[#9a917f]',
          active && 'text-[#e8b33c]',
        )}
      >
        {hotkey}
      </span>
      {/* 已放置数量 */}
      {count > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded border border-black/60 bg-black/55 px-0.5 text-[10px] font-bold leading-none text-[#e8b33c]">
          ×{count}
        </span>
      )}

      {/* 3D 缩略图 */}
      <span className="flex h-[52px] w-[72px] items-center justify-center">
        {thumb ? (
          <img src={thumb} alt={def.short} draggable={false} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-2xl">🪑</span>
        )}
      </span>

      <span className={cn('text-xs font-semibold leading-4 text-[#ece7da]', active && 'text-[#f2c353]')}>
        {def.short}
      </span>
      <span className="text-[10px] leading-3 text-[#9a917f]">
        {def.w}×{def.d}m{def.price != null ? ` · ¥${def.price}` : ''}
      </span>
    </button>
  )
}

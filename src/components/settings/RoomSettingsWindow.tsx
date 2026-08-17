import { DoorOpen, Pencil, RotateCw, Ruler, Trash2 } from 'lucide-react'
import { FloatWindow } from '@/components/hud/FloatWindow'
import type { CornerBump, RoomConfig, RoomParams } from '@/three/types'
import { CORNER_LABELS } from '@/state/usePlanner'
import { NumField, Section } from './fields'

interface Props {
  /** 被设置的房间（打开前已被设为当前房间） */
  room: RoomConfig
  canDeleteRoom: boolean
  onClose: () => void
  patchRoom: (patch: Partial<RoomParams>) => void
  patchBump: (index: number, patch: Partial<CornerBump>) => void
  moveRoom: (id: string, x: number, z: number) => void
  rotateRoom: (id: string, rotation: number) => void
  renameRoom: () => void
  deleteRoom: () => void
}

/** 单个房间的设置窗口（可拖拽浮动窗，从全局设置中独立出来） */
export function RoomSettingsWindow(p: Props) {
  const { room } = p
  const deg = Math.round((room.rotation * 180) / Math.PI)
  return (
    <FloatWindow
      title={
        <>
          <Ruler size={15} className="shrink-0 text-[#e0a92e]" />
          <span className="truncate">{room.name} · 房间设置</span>
        </>
      }
      width={360}
      onClose={p.onClose}
    >
      <Section title="房间管理">
        <div className="flex gap-2">
          <button className="hud-btn flex-1 text-xs" onClick={p.renameRoom}>
            <Pencil size={13} /> 重命名
          </button>
          <button className="hud-btn hud-btn-danger flex-1 text-xs" disabled={!p.canDeleteRoom} onClick={p.deleteRoom}>
            <Trash2 size={13} /> 删除房间
          </button>
        </div>
      </Section>

      <Section title="空间位置（米）">
        <NumField label="位置 X" value={room.x} step={0.1} onChange={(v) => p.moveRoom(room.id, v, room.z)} />
        <NumField label="位置 Z" value={room.z} step={0.1} onChange={(v) => p.moveRoom(room.id, room.x, v)} />
        <NumField
          label="旋转角度（°）"
          value={deg}
          step={5}
          min={0}
          max={359}
          onChange={(v) => p.rotateRoom(room.id, (v * Math.PI) / 180)}
        />
        <input
          type="range"
          className="hud-range w-full"
          min={0}
          max={359}
          value={deg}
          onChange={(e) => p.rotateRoom(room.id, (parseFloat(e.target.value) * Math.PI) / 180)}
        />
        <div className="flex items-center gap-2">
          <button
            className="hud-btn flex-1 text-xs"
            onClick={() => p.rotateRoom(room.id, room.rotation + Math.PI / 2)}
          >
            <RotateCw size={13} /> 顺时针转 90°
          </button>
          <span className="w-12 text-right text-xs tabular-nums text-[#f2c353]">{deg}°</span>
        </div>
        <p className="text-[11px] leading-4 text-[#7d7666]">旋转/移动与其他房间重叠时不生效。</p>
      </Section>

      <Section title="房间尺寸（米）">
        <NumField label="长（窗到门）" value={room.params.length} step={0.05} min={2} max={20} onChange={(v) => p.patchRoom({ length: v })} />
        <NumField label="宽" value={room.params.width} step={0.05} min={1.5} max={20} onChange={(v) => p.patchRoom({ width: v })} />
        <NumField label="层高（估）" value={room.params.height} step={0.05} min={2.2} max={5} onChange={(v) => p.patchRoom({ height: v })} />
        <label className="flex items-center gap-2 text-sm text-[#d8d2c2]">
          <input
            type="checkbox"
            className="hud-range"
            checked={room.params.showCeiling}
            onChange={(e) => p.patchRoom({ showCeiling: e.target.checked })}
          />
          显示天花板
        </label>
      </Section>

      <Section title="角落凸起（柱 / 管道井）">
        <p className="text-[11px] leading-4 text-[#7d7666]">
          房间四角可能有结构凸起，按俯视平面的方位逐个设置（0 表示无凸起）。
        </p>
        <div className="grid grid-cols-2 gap-2">
          {room.bumps.map((b, i) => (
            <div key={i} className="hud-inset">
              <div className="mb-1.5 text-xs font-medium text-[#b8b1a0]">{CORNER_LABELS[i]}</div>
              <div className="flex flex-col gap-1.5">
                <NumField label="横向" value={b.w} step={0.05} min={0} max={1.5} onChange={(v) => p.patchBump(i, { w: v })} />
                <NumField label="纵向" value={b.d} step={0.05} min={0} max={1.5} onChange={(v) => p.patchBump(i, { d: v })} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="窗户（端墙）">
        <NumField label="窗宽" value={room.params.windowWidth} step={0.1} min={0.6} max={room.params.width - 0.2} onChange={(v) => p.patchRoom({ windowWidth: v })} />
        <NumField label="窗台高" value={room.params.windowSill} step={0.05} min={0} max={2} onChange={(v) => p.patchRoom({ windowSill: v })} />
        <NumField label="窗高" value={room.params.windowHeight} step={0.05} min={0.4} max={3} onChange={(v) => p.patchRoom({ windowHeight: v })} />
        <button
          className="hud-btn text-xs"
          onClick={() => p.patchRoom({ windowEnd: room.params.windowEnd === 'negX' ? 'posX' : 'negX' })}
        >
          <DoorOpen size={13} /> 窗 / 门互换方向
        </button>
      </Section>

      <Section title="门（窗对面）">
        <NumField label="门宽" value={room.params.doorWidth} step={0.05} min={0.6} max={1.6} onChange={(v) => p.patchRoom({ doorWidth: v })} />
        <NumField label="门偏移" value={room.params.doorOffset} step={0.05} min={-room.params.width / 2 + room.params.doorWidth / 2} max={room.params.width / 2 - room.params.doorWidth / 2} onChange={(v) => p.patchRoom({ doorOffset: v })} />
      </Section>

    </FloatWindow>
  )
}

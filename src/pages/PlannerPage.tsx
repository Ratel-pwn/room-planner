import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { RoomScene, type RoomAnchors, type SelectionAnchor } from '@/components/RoomScene'
import { FurnitureBar } from '@/components/hud/FurnitureBar'
import { RoomFloat } from '@/components/hud/RoomFloat'
import { SelectionFloat } from '@/components/hud/SelectionFloat'
import { TopBar } from '@/components/hud/TopBar'
import { NewRoomWindow } from '@/components/settings/NewRoomWindow'
import { FurnitureSettingsDialog } from '@/components/settings/FurnitureSettingsDialog'
import { OperationHelpDialog } from '@/components/settings/OperationHelpDialog'
import { RoomSettingsWindow } from '@/components/settings/RoomSettingsWindow'
import { SettingsDialog } from '@/components/settings/SettingsDialog'
import { usePlanner } from '@/state/usePlanner'
import { FURNITURE_DEFS, type FurnitureType } from '@/three/types'

const HOTKEY_ORDER = Object.keys(FURNITURE_DEFS) as FurnitureType[]

export default function PlannerPage() {
  const planner = usePlanner()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [furnitureSettingsOpen, setFurnitureSettingsOpen] = useState(false)
  const [newRoomOpen, setNewRoomOpen] = useState(false)
  // 布局模式下打开设置的房间 id（打开前先切为当前房间）
  const [roomSettingsId, setRoomSettingsId] = useState<string | null>(null)
  // 选中家具的屏幕投影锚点：RoomScene 每帧写入，SelectionFloat 读取定位
  const anchorRef = useRef<SelectionAnchor>({ x: 0, y: 0, cx: 0, cy: 0, visible: false })
  // 布局模式下每个房间的屏幕锚点：RoomScene 每帧写入，RoomFloat 读取定位
  const roomAnchorsRef = useRef<RoomAnchors>({})

  const { view, placingType, selected } = planner
  const isLayout = view.kind === 'layout'

  /** 数字键 1-8 快速选择家具（输入框聚焦、弹窗打开或布局模式下不生效） */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (settingsOpen || helpOpen || furnitureSettingsOpen || newRoomOpen || roomSettingsId || isLayout) return
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable))
        return
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= HOTKEY_ORDER.length) planner.togglePlacing(HOTKEY_ORDER[n - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settingsOpen, helpOpen, furnitureSettingsOpen, newRoomOpen, roomSettingsId, isLayout, planner])

  // 离开布局模式时关掉布局专属窗口
  useEffect(() => {
    if (!isLayout) {
      setNewRoomOpen(false)
      setRoomSettingsId(null)
    }
  }, [isLayout])

  /** 打开某房间的设置：先切为当前房间，再开窗口（窗口编辑的始终是当前房间） */
  const openRoomSettings = (id: string) => {
    planner.switchRoom(id)
    setRoomSettingsId(id)
  }

  // 被设置的房间可能已被删除；窗口始终编辑当前房间
  const roomSettingsOpen = roomSettingsId !== null && isLayout

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#e9ebed] font-sans">
      {/* 3D 视口（全屏） */}
      <RoomScene
        rooms={planner.space.rooms}
        activeRoomId={planner.room.id}
        obstacles={planner.obstacles}
        selectedId={planner.selectedId}
        placingType={placingType}
        view={view}
        eyeHeight={planner.eyeHeight}
        selectionAnchor={anchorRef}
        roomAnchors={roomAnchorsRef}
        onSelect={planner.setSelectedId}
        onMove={planner.onMove}
        onPlace={planner.onPlace}
        onMoveRoom={planner.moveRoom}
        onPickRoom={planner.switchRoom}
        onEnterRoom={planner.enterRoom}
      />

      {/* 顶部 HUD */}
      <TopBar
        space={planner.space}
        spaces={planner.spaces}
        viewKind={view.kind}
        placedTotal={planner.placedTotal}
        onSwitchSpace={planner.switchSpace}
        onAddSpace={planner.addSpace}
        onViewChange={planner.setViewKind}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* 跟随选中家具的悬浮操作条（含旋转把手，布局模式下隐藏） */}
      {selected && !isLayout && (
        <SelectionFloat
          anchor={anchorRef}
          selected={selected}
          onRotate={planner.rotateSelected}
          onRotateTo={(deg) => planner.applyRotation(selected.id, (deg * Math.PI) / 180)}
          onDuplicate={planner.dupSelected}
          onDelete={planner.delSelected}
          onClose={() => planner.setSelectedId(null)}
        />
      )}

      {/* 底部建造栏（布局模式下隐藏） */}
      {!isLayout && (
        <FurnitureBar
          placingType={placingType}
          items={planner.items}
          onPick={planner.togglePlacing}
          onOpenSettings={() => setFurnitureSettingsOpen(true)}
        />
      )}

      {/* 布局模式：每个房间的浮动工具条 + 新增房间按钮 */}
      {isLayout && (
        <>
          {planner.space.rooms.map((r) => (
            <RoomFloat
              key={r.id}
              room={r}
              active={r.id === planner.room.id}
              canDelete={planner.space.rooms.length > 1}
              anchors={roomAnchorsRef}
              onOpenSettings={openRoomSettings}
              onRotate90={(id) => {
                const target = planner.space.rooms.find((x) => x.id === id)
                if (target) planner.rotateRoom(id, target.rotation + Math.PI / 2)
              }}
              onDelete={planner.deleteRoomById}
            />
          ))}
          <button
            className="hud-btn hud-btn-amber absolute bottom-6 right-6 z-40 rounded-full p-3.5"
            title="新增房间"
            onClick={() => setNewRoomOpen(true)}
          >
            <Plus size={20} />
          </button>
          {newRoomOpen && (
            <NewRoomWindow
              roomCount={planner.space.rooms.length}
              onClose={() => setNewRoomOpen(false)}
              onAdd={(cfg) => planner.addRoom(cfg)}
            />
          )}
          {roomSettingsOpen && (
            <RoomSettingsWindow
              room={planner.room}
              canDeleteRoom={planner.space.rooms.length > 1}
              onClose={() => setRoomSettingsId(null)}
              patchRoom={planner.patchRoom}
              patchBump={planner.patchBump}
              moveRoom={planner.moveRoom}
              rotateRoom={planner.rotateRoom}
              renameRoom={planner.renameRoom}
              deleteRoom={planner.deleteRoom}
            />
          )}
        </>
      )}

      {/* 全局设置弹窗（空间管理 + 操作说明） */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        space={planner.space}
        canDeleteSpace={planner.spaces.length > 1}
        renameSpace={planner.renameSpace}
        deleteSpace={planner.deleteSpace}
        eyeHeight={planner.eyeHeight}
        setEyeHeight={planner.setEyeHeight}
      />
      <OperationHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <FurnitureSettingsDialog
        open={furnitureSettingsOpen}
        onOpenChange={setFurnitureSettingsOpen}
        itemCount={planner.items.length}
        clearItems={planner.clearItems}
        onPick={planner.togglePlacing}
      />
    </div>
  )
}

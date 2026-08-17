import { Vector3 } from 'three'
import type { RoomSceneEngine, RoomSceneProps, SceneMode } from '@/features/planner/scene/sceneContract'
import { FURNITURE_DEFS, type FurnitureType } from './types'

export function createHudProjector() {
  const projected = new Vector3()

  return (engine: RoomSceneEngine, state: RoomSceneProps, mode: SceneMode): void => {
    const width = engine.renderer.domElement.clientWidth
    const height = engine.renderer.domElement.clientHeight
    const selectionAnchor = state.selectionAnchor?.current

    if (selectionAnchor) {
      const furniture = state.selectedId ? engine.furniture.get(state.selectedId) : undefined
      if (furniture && mode !== 'layout') {
        const furnitureHeight = FURNITURE_DEFS[furniture.userData.type as FurnitureType].h
        furniture.getWorldPosition(projected)
        projected.y = furnitureHeight / 2
        projected.project(engine.camera)
        selectionAnchor.cx = (projected.x * 0.5 + 0.5) * width
        selectionAnchor.cy = (-projected.y * 0.5 + 0.5) * height
        furniture.getWorldPosition(projected)
        projected.y = furnitureHeight + 0.3
        projected.project(engine.camera)
        selectionAnchor.x = (projected.x * 0.5 + 0.5) * width
        selectionAnchor.y = (-projected.y * 0.5 + 0.5) * height
        selectionAnchor.visible = projected.z > -1 && projected.z < 1
      } else {
        selectionAnchor.visible = false
      }
    }

    const roomAnchors = state.roomAnchors?.current
    if (!roomAnchors) return
    for (const room of state.rooms) {
      const anchor = (roomAnchors[room.id] ??= { x: 0, y: 0, visible: false })
      if (mode === 'layout') {
        projected.set(room.x, room.params.height + 0.55, room.z)
        projected.project(engine.camera)
        anchor.x = (projected.x * 0.5 + 0.5) * width
        anchor.y = (-projected.y * 0.5 + 0.5) * height
        anchor.visible = projected.z > -1 && projected.z < 1
      } else {
        anchor.visible = false
      }
    }
  }
}

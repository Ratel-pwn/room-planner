import { Plane, Raycaster, Vector2, Vector3 } from 'three'
import type {
  MutableRef,
  RoomSceneEngine,
  RoomSceneProps,
  SceneMode,
  WalkState,
} from '@/features/planner/scene/sceneContract'
import { buildRoomObstacles } from './obstacles'
import { clampToRoom, findCollision, findRoomPlacementTarget } from './collision'
import {
  commitFurnitureDrag,
  moveFurnitureDrag,
  startFurnitureDrag,
  type FurnitureDragState,
} from './furnitureDrag'
import { updateFurnitureGhost } from './furniture'
import { worldToRoomLocal } from './roomCoordinates'
import { updateLookPitch } from './walkCamera'

export interface ScenePointerController {
  onPointerDown: (event: PointerEvent) => void
  onPointerMove: (event: PointerEvent) => void
  onPointerUp: (event: PointerEvent) => void
  onDoubleClick: (event: MouseEvent) => void
}

interface CreatePointerControllerOptions {
  engine: RoomSceneEngine
  state: MutableRef<RoomSceneProps>
  mode: MutableRef<SceneMode>
  walk: MutableRef<WalkState>
}

export function createScenePointerController(options: CreatePointerControllerOptions): ScenePointerController {
  const { engine, state, mode, walk } = options
  const raycaster = new Raycaster()
  const floorPlane = new Plane(new Vector3(0, 1, 0), 0)
  const pointer = new Vector2()
  let dragging: FurnitureDragState | null = null
  let roomDrag: { id: string; dx: number; dz: number } | null = null
  let downAt: { x: number; y: number } | null = null

  const getActiveRoom = () => {
    const current = state.current
    return current.rooms.find((room) => room.id === current.activeRoomId) ?? current.rooms[0]
  }

  const setPointer = (event: { clientX: number; clientY: number }) => {
    const bounds = engine.renderer.domElement.getBoundingClientRect()
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    )
  }

  const floorHit = (): Vector3 | null => {
    raycaster.setFromCamera(pointer, engine.camera)
    const point = new Vector3()
    return raycaster.ray.intersectPlane(floorPlane, point) ? point : null
  }

  const pickFurniture = (): string | null => {
    raycaster.setFromCamera(pointer, engine.camera)
    const hits = raycaster.intersectObjects([...engine.furniture.values()], true)
    for (const hit of hits) {
      let object = hit.object
      while (object && !object.userData.furniture) object = object.parent!
      if (object) return object.userData.id as string
    }
    return null
  }

  const pickRoom = (): string | null => {
    raycaster.setFromCamera(pointer, engine.camera)
    const hits = raycaster.intersectObjects([...engine.roomGroups.values()], true)
    for (const hit of hits) {
      let object = hit.object
      while (object) {
        if (object.userData.roomId) return object.userData.roomId as string
        object = object.parent!
      }
    }
    return null
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return
    if (mode.current === 'walk' || mode.current === 'immersive') {
      walk.current.look = { x: event.clientX, y: event.clientY }
      downAt = { x: event.clientX, y: event.clientY }
      event.stopPropagation()
      return
    }

    setPointer(event)
    downAt = { x: event.clientX, y: event.clientY }
    const current = state.current
    const activeRoom = getActiveRoom()
    if (!activeRoom) return

    if (mode.current === 'layout') {
      const roomId = pickRoom()
      if (roomId) {
        current.onPickRoom(roomId)
        const room = current.rooms.find((candidate) => candidate.id === roomId)
        const point = floorHit()
        if (point && room) roomDrag = { id: roomId, dx: room.x - point.x, dz: room.z - point.z }
        engine.controls.enabled = false
        event.stopPropagation()
      }
      return
    }

    if (current.placingType) {
      const point = floorHit()
      if (point) {
        const target = findRoomPlacementTarget(current.rooms, point.x, point.z)
        if (target) {
          const position = clampToRoom(target.room.params, current.placingType, 0, target.x, target.z)
          const obstacles = target.room.id === current.activeRoomId
            ? current.obstacles
            : buildRoomObstacles(target.room.params, target.room.bumps)
          if (!findCollision(target.room.items, { type: current.placingType, rotation: 0, ...position }, 0.02, obstacles)) {
            current.onPlace(target.room.id, current.placingType, position.x, position.z)
          }
        }
      }
      event.stopPropagation()
      return
    }

    const furnitureId = pickFurniture()
    if (!furnitureId) return
    current.onSelect(furnitureId)
    const item = activeRoom.items.find((candidate) => candidate.id === furnitureId)
    const point = floorHit()
    if (item && point) {
      dragging = startFurnitureDrag(item, worldToRoomLocal(point.x, point.z, activeRoom))
      engine.controls.enabled = false
    }
    event.stopPropagation()
  }

  const onPointerMove = (event: PointerEvent) => {
    if (mode.current === 'walk' || mode.current === 'immersive') {
      const look = walk.current.look
      if (look) {
        walk.current.yaw -= (event.clientX - look.x) * 0.004
        walk.current.pitch = updateLookPitch(walk.current.pitch, event.clientY - look.y)
        walk.current.look = { x: event.clientX, y: event.clientY }
      }
      return
    }

    setPointer(event)
    const current = state.current
    if (mode.current === 'layout') {
      if (roomDrag) {
        const point = floorHit()
        if (point) current.onMoveRoom(roomDrag.id, point.x + roomDrag.dx, point.z + roomDrag.dz)
      }
      return
    }

    const activeRoom = getActiveRoom()
    if (!activeRoom) return
    if (current.placingType && engine.ghost) {
      const point = floorHit()
      if (point) {
        const target = findRoomPlacementTarget(current.rooms, point.x, point.z)
        if (!target) {
          engine.ghost.visible = false
        } else {
          engine.ghost.visible = true
          const layer = engine.furnitureLayers.get(target.room.id)
          if (layer && engine.ghost.parent !== layer) layer.add(engine.ghost)
          const position = clampToRoom(target.room.params, current.placingType, 0, target.x, target.z)
          engine.ghost.position.set(position.x, 0, position.z)
          const obstacles = target.room.id === current.activeRoomId
            ? current.obstacles
            : buildRoomObstacles(target.room.params, target.room.bumps)
          const blocked = Boolean(findCollision(
            target.room.items,
            { type: current.placingType, rotation: 0, ...position },
            0.02,
            obstacles,
          ))
          updateFurnitureGhost(engine.ghost, blocked)
        }
      }
    }

    if (!dragging) return
    const point = floorHit()
    if (!point) return
    const item = activeRoom.items.find((candidate) => candidate.id === dragging!.id)
    if (!item) return
    dragging = moveFurnitureDrag(
      dragging,
      activeRoom.items,
      activeRoom.params,
      item,
      worldToRoomLocal(point.x, point.z, activeRoom),
      current.obstacles,
    )
    const mesh = engine.furniture.get(dragging.id)
    if (mesh) mesh.position.set(dragging.x, 0, dragging.z)
    if (engine.dimensions && current.selectedId === dragging.id) {
      engine.dimensions.position.set(dragging.x, 0, dragging.z)
    }
    engine.highlight?.update()
  }

  const onPointerUp = (event: PointerEvent) => {
    if (mode.current === 'walk' || mode.current === 'immersive') {
      walk.current.look = null
      if (downAt && Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) < 4) {
        setPointer(event)
        state.current.onSelect(pickFurniture())
      }
      downAt = null
      return
    }
    if (mode.current === 'layout') {
      roomDrag = null
      engine.controls.enabled = true
      downAt = null
      return
    }

    const current = state.current
    const completedDrag = dragging
    dragging = null
    if (completedDrag) commitFurnitureDrag(completedDrag, current.onMove)
    engine.controls.enabled = mode.current === 'plan'
    if (!completedDrag && downAt && Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) < 4 && !current.placingType) {
      setPointer(event)
      if (!pickFurniture()) current.onSelect(null)
    }
    downAt = null
  }

  const onDoubleClick = (event: MouseEvent) => {
    if (mode.current !== 'layout') return
    setPointer(event)
    const roomId = pickRoom()
    if (roomId) state.current.onEnterRoom(roomId)
  }

  return { onPointerDown, onPointerMove, onPointerUp, onDoubleClick }
}

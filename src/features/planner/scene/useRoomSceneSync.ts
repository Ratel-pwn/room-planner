import { useEffect } from 'react'
import { BoxHelper, Group } from 'three'
import { buildRoom, makeDimensionSprite } from '@/three/buildRoom'
import { DoorInteraction } from '@/three/doorInteraction'
import {
  createFurnitureGhost,
  createFurnitureMesh,
  getFurnitureDimensionLabels,
} from '@/three/furniture'
import type { InteractionSystem } from '@/three/interaction'
import { createRoomLabel } from '@/three/roomLabel'
import { disposeObjectTree } from '@/three/sceneResources'
import { applySceneView } from '@/three/sceneView'
import { shouldShowRoomLabel } from '@/three/viewVisibility'
import type {
  ImmersiveState,
  MutableRef,
  RoomSceneEngine,
  RoomSceneProps,
  SceneMode,
  WalkState,
} from './sceneContract'

interface RoomSceneSyncRefs {
  stateRef: MutableRef<RoomSceneProps>
  engineRef: MutableRef<RoomSceneEngine | null>
  modeRef: MutableRef<SceneMode>
  activeRoomRef: MutableRef<string>
  walkRef: MutableRef<WalkState>
  immersiveRef: MutableRef<ImmersiveState>
  interactionSystemRef: MutableRef<InteractionSystem>
  publishInteractionPrompt: (prompt: string | null) => void
}

export function useRoomSceneSync(props: RoomSceneProps, refs: RoomSceneSyncRefs): void {
  const {
    stateRef,
    engineRef,
    modeRef,
    activeRoomRef,
    walkRef,
    immersiveRef,
    interactionSystemRef,
    publishInteractionPrompt,
  } = refs

  const structureKey = JSON.stringify(props.rooms.map((room) => [room.id, room.name, room.params, room.bumps]))
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    const interactions = interactionSystemRef.current
    const rooms = stateRef.current.rooms
    interactions.clear()
    publishInteractionPrompt(null)
    const roomIds = new Set(rooms.map((room) => room.id))

    for (const [roomId, group] of engine.roomGroups) {
      if (!roomIds.has(roomId)) {
        engine.scene.remove(group)
        disposeObjectTree(group)
        engine.roomGroups.delete(roomId)
      }
    }
    for (const [roomId, layer] of engine.furnitureLayers) {
      if (!roomIds.has(roomId)) {
        engine.scene.remove(layer)
        engine.furnitureLayers.delete(roomId)
      }
    }

    for (const room of rooms) {
      const previous = engine.roomGroups.get(room.id)
      if (previous) {
        engine.scene.remove(previous)
        disposeObjectTree(previous)
      }
      const group = buildRoom(room.params, room.bumps)
      group.userData.roomId = room.id
      group.position.set(room.x, 0, room.z)
      group.rotation.y = room.rotation
      const label = createRoomLabel(room.name)
      label.position.set(0, room.params.height + 0.35, 0)
      label.visible = shouldShowRoomLabel(stateRef.current.view.kind)
      group.add(label)
      engine.scene.add(group)
      engine.roomGroups.set(room.id, group)

      const doorPivot = group.getObjectByName('doorPivot')
      if (doorPivot instanceof Group) {
        const openAngle = room.params.windowEnd === 'negX' ? -1.6 : 1.6
        interactions.register(new DoorInteraction(`door:${room.id}`, doorPivot, openAngle))
      }

      let layer = engine.furnitureLayers.get(room.id)
      if (!layer) {
        layer = new Group()
        engine.furnitureLayers.set(room.id, layer)
        engine.scene.add(layer)
      }
      layer.position.set(room.x, 0, room.z)
      layer.rotation.y = room.rotation
      for (const item of room.items) {
        const furniture = engine.furniture.get(item.id)
        if (furniture && furniture.parent !== layer) layer.add(furniture)
      }
    }
  }, [engineRef, interactionSystemRef, publishInteractionPrompt, stateRef, structureKey])

  const positionKey = JSON.stringify(props.rooms.map((room) => [room.id, room.x, room.z, room.rotation]))
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    for (const room of stateRef.current.rooms) {
      const group = engine.roomGroups.get(room.id)
      if (group) {
        group.position.set(room.x, 0, room.z)
        group.rotation.y = room.rotation
      }
      const layer = engine.furnitureLayers.get(room.id)
      if (layer) {
        layer.position.set(room.x, 0, room.z)
        layer.rotation.y = room.rotation
      }
    }
  }, [engineRef, positionKey, stateRef])

  const itemsKey = JSON.stringify(props.rooms.map((room) => [room.id, room.items]))
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    const seen = new Set<string>()
    for (const room of stateRef.current.rooms) {
      const layer = engine.furnitureLayers.get(room.id)
      for (const item of room.items) {
        seen.add(item.id)
        let furniture = engine.furniture.get(item.id)
        if (!furniture) {
          furniture = createFurnitureMesh(item.type)
          furniture.userData.id = item.id
          engine.furniture.set(item.id, furniture)
        }
        if (layer && furniture.parent !== layer) layer.add(furniture)
        furniture.position.set(item.x, 0, item.z)
        furniture.rotation.y = item.rotation
      }
    }
    for (const [itemId, furniture] of engine.furniture) {
      if (!seen.has(itemId)) {
        furniture.parent?.remove(furniture)
        disposeObjectTree(furniture)
        engine.furniture.delete(itemId)
      }
    }
  }, [engineRef, itemsKey, stateRef])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (engine.highlight) {
      engine.scene.remove(engine.highlight)
      engine.highlight.dispose()
      engine.highlight = null
    }
    if (!props.selectedId) return
    const furniture = engine.furniture.get(props.selectedId)
    if (!furniture) return
    engine.highlight = new BoxHelper(furniture, 0xff9f1a)
    engine.scene.add(engine.highlight)
  }, [engineRef, itemsKey, props.selectedId])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (engine.dimensions) {
      engine.dimensions.parent?.remove(engine.dimensions)
      disposeObjectTree(engine.dimensions)
      engine.dimensions = null
    }
    if (!props.selectedId || props.view.kind === 'layout') return
    const selectedRoom = stateRef.current.rooms.find((room) => room.items.some((item) => item.id === props.selectedId))
    const selectedItem = selectedRoom?.items.find((item) => item.id === props.selectedId)
    const layer = selectedRoom ? engine.furnitureLayers.get(selectedRoom.id) : null
    if (!selectedItem || !layer) return

    const dimensions = new Group()
    dimensions.name = 'furniture-dimensions'
    for (const label of getFurnitureDimensionLabels(selectedItem.type)) {
      const sprite = makeDimensionSprite(label.text, 0.65)
      sprite.position.set(label.x, 0.025, label.z)
      dimensions.add(sprite)
    }
    dimensions.position.set(selectedItem.x, 0, selectedItem.z)
    dimensions.rotation.y = selectedItem.rotation
    layer.add(dimensions)
    engine.dimensions = dimensions
    return () => {
      if (engine.dimensions !== dimensions) return
      dimensions.parent?.remove(dimensions)
      disposeObjectTree(dimensions)
      engine.dimensions = null
    }
  }, [engineRef, props.selectedId, props.view.kind, stateRef])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine?.dimensions || !props.selectedId) return
    const selectedRoom = stateRef.current.rooms.find((room) => room.items.some((item) => item.id === props.selectedId))
    const selectedItem = selectedRoom?.items.find((item) => item.id === props.selectedId)
    const layer = selectedRoom ? engine.furnitureLayers.get(selectedRoom.id) : null
    if (!selectedItem || !layer) return
    if (engine.dimensions.parent !== layer) layer.add(engine.dimensions)
    engine.dimensions.position.set(selectedItem.x, 0, selectedItem.z)
    engine.dimensions.rotation.y = selectedItem.rotation
  }, [engineRef, itemsKey, props.selectedId, stateRef])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (engine.ghost) {
      engine.ghost.parent?.remove(engine.ghost)
      disposeObjectTree(engine.ghost)
      engine.ghost = null
    }
    if (!props.placingType) return
    const ghost = createFurnitureGhost(props.placingType)
    engine.ghost = ghost
    const layer = engine.furnitureLayers.get(props.activeRoomId)
    if (layer) layer.add(ghost)
    else engine.scene.add(ghost)
  }, [engineRef, props.activeRoomId, props.placingType])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine || props.view.seq === 0) return
    const roomChanged = activeRoomRef.current !== props.activeRoomId
    activeRoomRef.current = props.activeRoomId
    publishInteractionPrompt(null)
    const current = stateRef.current
    modeRef.current = applySceneView({
      engine,
      view: current.view,
      rooms: current.rooms,
      activeRoomId: current.activeRoomId,
      eyeHeight: current.eyeHeight,
      previousMode: modeRef.current,
      roomChanged,
      walk: walkRef.current,
      immersive: immersiveRef.current,
      interactions: interactionSystemRef.current,
    })
  }, [
    activeRoomRef,
    engineRef,
    immersiveRef,
    interactionSystemRef,
    modeRef,
    props.activeRoomId,
    props.view,
    publishInteractionPrompt,
    stateRef,
    walkRef,
  ])
}

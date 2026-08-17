import type { RefObject } from 'react'
import type { BoxHelper, Group, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { RoomAnchors, SelectionAnchor, ViewCommand } from '../model/scene'
import type { EyeHeightTransition } from '@/three/immersiveCamera'
import type { RoomObstacle } from '@/three/obstacles'
import type { FurnitureType, RoomConfig } from '@/three/types'

export type SceneMode = 'plan' | 'walk' | 'immersive' | 'layout'

export interface RoomSceneProps {
  rooms: RoomConfig[]
  activeRoomId: string
  obstacles: RoomObstacle[]
  selectedId: string | null
  placingType: FurnitureType | null
  view: ViewCommand
  eyeHeight: number
  selectionAnchor?: RefObject<SelectionAnchor>
  roomAnchors?: RefObject<RoomAnchors>
  onSelect: (id: string | null) => void
  onMove: (id: string, x: number, z: number) => void
  onPlace: (roomId: string, type: FurnitureType, x: number, z: number) => void
  onMoveRoom: (id: string, x: number, z: number) => void
  onPickRoom: (id: string) => void
  onEnterRoom: (id: string) => void
}

export interface WalkState {
  yaw: number
  pitch: number
  keys: Set<string>
  look: { x: number; y: number } | null
}

export interface ImmersiveState {
  heightTransition: EyeHeightTransition
  y: number
  vy: number
  grounded: boolean
  bob: number
}

export interface RoomSceneEngine {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  controls: OrbitControls
  roomGroups: Map<string, Group>
  furnitureLayers: Map<string, Group>
  furniture: Map<string, Group>
  ghost: Group | null
  highlight: BoxHelper | null
  dimensions: Group | null
}

export interface MutableRef<T> {
  current: T
}

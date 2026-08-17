import {
  Color,
  DirectionalLight,
  HemisphereLight,
  MOUSE,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { RoomSceneEngine } from '@/features/planner/scene/sceneContract'
import { disposeObjectTree } from './sceneResources'

export function createRoomSceneEngine(container: HTMLElement): RoomSceneEngine {
  const scene = new Scene()
  scene.background = new Color(0xe9ebed)

  const camera = new PerspectiveCamera(50, 1, 0.05, 300)
  camera.position.set(0, 12, 0)
  const renderer = new WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.1
  controls.enableRotate = false
  controls.screenSpacePanning = true
  controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }
  controls.minDistance = 2
  controls.maxDistance = 120
  controls.target.set(0, 0, 0)

  scene.add(new HemisphereLight(0xffffff, 0xcfc9bd, 0.9))
  const sun = new DirectionalLight(0xfff4e0, 1.4)
  sun.position.set(-8, 10, 6)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.left = -30
  sun.shadow.camera.right = 30
  sun.shadow.camera.top = 30
  sun.shadow.camera.bottom = -30
  scene.add(sun)
  const fill = new DirectionalLight(0xdfe8ff, 0.35)
  fill.position.set(6, 5, -6)
  scene.add(fill)

  return {
    scene,
    camera,
    renderer,
    controls,
    roomGroups: new Map(),
    furnitureLayers: new Map(),
    furniture: new Map(),
    ghost: null,
    highlight: null,
    dimensions: null,
  }
}

export function resizeRoomSceneEngine(engine: RoomSceneEngine, container: HTMLElement): void {
  const width = container.clientWidth
  const height = container.clientHeight
  engine.camera.aspect = width / height
  engine.camera.updateProjectionMatrix()
  engine.renderer.setSize(width, height)
}

export function disposeRoomSceneEngine(engine: RoomSceneEngine, container: HTMLElement): void {
  engine.controls.dispose()
  for (const group of engine.roomGroups.values()) disposeObjectTree(group)
  for (const group of engine.furniture.values()) disposeObjectTree(group)
  if (engine.ghost) disposeObjectTree(engine.ghost)
  if (engine.dimensions) disposeObjectTree(engine.dimensions)
  engine.highlight?.dispose()
  engine.renderer.dispose()
  engine.renderer.domElement.remove()
  if (engine.renderer.domElement.parentElement === container) container.removeChild(engine.renderer.domElement)
}

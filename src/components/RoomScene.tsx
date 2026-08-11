import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildRoom, type RoomObstacle } from '../three/buildRoom'
import { clampToRoom, findCollision, resolveDrag } from '../three/collision'
import { createFurnitureMesh } from '../three/furniture'
import { type FurnitureItem, type FurnitureType, type RoomParams } from '../three/types'

export type ViewCommand = { kind: 'persp' | 'top'; seq: number }

interface Props {
  room: RoomParams
  items: FurnitureItem[]
  obstacles: RoomObstacle[]
  selectedId: string | null
  placingType: FurnitureType | null
  view: ViewCommand
  onSelect: (id: string | null) => void
  onMove: (id: string, x: number, z: number) => void
  onPlace: (type: FurnitureType, x: number, z: number) => void
}

export function RoomScene(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef(props)
  stateRef.current = props

  const engineRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    roomGroup: THREE.Group | null
    furniture: Map<string, THREE.Group>
    ghost: THREE.Group | null
    highlight: THREE.BoxHelper | null
  } | null>(null)

  // ── 初始化场景（只一次）──
  useEffect(() => {
    const container = containerRef.current!
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xe9ebed)

    const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 200)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.maxPolarAngle = Math.PI / 2 - 0.02
    controls.minDistance = 1
    controls.maxDistance = 40

    // 灯光
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc9bd, 0.9))
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.4)
    sun.position.set(-8, 10, 6)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -8
    sun.shadow.camera.right = 8
    sun.shadow.camera.top = 8
    sun.shadow.camera.bottom = -8
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.35)
    fill.position.set(6, 5, -6)
    scene.add(fill)

    const eng = {
      scene,
      camera,
      controls,
      roomGroup: null as THREE.Group | null,
      furniture: new Map<string, THREE.Group>(),
      ghost: null as THREE.Group | null,
      highlight: null as THREE.BoxHelper | null,
    }
    engineRef.current = eng

    // ── 交互 ──
    const raycaster = new THREE.Raycaster()
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const ndc = new THREE.Vector2()
    let dragging: { id: string; dx: number; dz: number } | null = null
    let downAt: { x: number; y: number } | null = null

    const setNdc = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    }

    const floorHit = (): THREE.Vector3 | null => {
      raycaster.setFromCamera(ndc, camera)
      const pt = new THREE.Vector3()
      return raycaster.ray.intersectPlane(floorPlane, pt) ? pt : null
    }

    const clamp = (type: FurnitureType, rotation: number, x: number, z: number) =>
      clampToRoom(stateRef.current.room, type, rotation, x, z)

    const tintGhost = (g: THREE.Group, blocked: boolean) => {
      const mats = (g.userData.mats ?? []) as Array<{ m: THREE.MeshStandardMaterial; c: number }>
      for (const e of mats) e.m.color.setHex(blocked ? 0xe05555 : e.c)
    }

    const pickFurniture = (): string | null => {
      raycaster.setFromCamera(ndc, camera)
      const roots = [...eng.furniture.values()]
      const hits = raycaster.intersectObjects(roots, true)
      for (const h of hits) {
        let o: THREE.Object3D | null = h.object
        while (o && !o.userData.furniture) o = o.parent
        if (o) return o.userData.id as string
      }
      return null
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      setNdc(e)
      downAt = { x: e.clientX, y: e.clientY }
      const st = stateRef.current

      if (st.placingType) {
        const pt = floorHit()
        if (pt) {
          const c = clamp(st.placingType, 0, pt.x, pt.z)
          // 与其他家具/墙面设施碰撞时禁止放置
          if (!findCollision(st.items, { type: st.placingType, rotation: 0, x: c.x, z: c.z }, 0.02, st.obstacles)) {
            st.onPlace(st.placingType, c.x, c.z)
          }
        }
        return
      }

      const id = pickFurniture()
      if (id) {
        st.onSelect(id)
        const item = st.items.find((i) => i.id === id)!
        const pt = floorHit()
        if (pt) {
          dragging = { id, dx: item.x - pt.x, dz: item.z - pt.z }
          controls.enabled = false
        }
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      setNdc(e)
      const st = stateRef.current
      if (st.placingType && eng.ghost) {
        const pt = floorHit()
        if (pt) {
          const c = clamp(st.placingType, 0, pt.x, pt.z)
          eng.ghost.position.set(c.x, 0, c.z)
          eng.ghost.visible = true
          // 碰撞时幽灵变红，提示此处不可放置
          const blocked = !!findCollision(
            st.items,
            { type: st.placingType, rotation: 0, x: c.x, z: c.z },
            0.02,
            st.obstacles,
          )
          tintGhost(eng.ghost, blocked)
        }
      }
      if (dragging) {
        const pt = floorHit()
        if (pt) {
          const item = st.items.find((i) => i.id === dragging!.id)
          if (item) {
            // 碰撞解算：能全移则全移，否则沿墙滑动，都撞则不动
            const c = resolveDrag(st.items, st.room, item, pt.x + dragging.dx, pt.z + dragging.dz, st.obstacles)
            st.onMove(dragging.id, c.x, c.z)
          }
        }
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      const st = stateRef.current
      const wasDrag = dragging
      dragging = null
      controls.enabled = true
      // 纯点击空白处 → 取消选择
      if (!wasDrag && downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 4 && !st.placingType) {
        setNdc(e)
        if (!pickFurniture()) st.onSelect(null)
      }
      downAt = null
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    onResize()
    const ro = new ResizeObserver(onResize)
    ro.observe(container)

    // 初始相机
    const setPersp = () => {
      const { length: L, width: W, height: H } = stateRef.current.room
      camera.position.set(L * 0.62, H * 1.9, W * 2.1)
      controls.target.set(0, 0.6, 0)
      controls.update()
    }
    setPersp()
    ;(eng as unknown as { setPersp: () => void }).setPersp = setPersp

    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 房间参数变化 → 重建房间 ──
  useEffect(() => {
    const eng = engineRef.current
    if (!eng) return
    if (eng.roomGroup) {
      eng.scene.remove(eng.roomGroup)
      eng.roomGroup.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          ;(o.material as THREE.Material).dispose()
        }
      })
    }
    eng.roomGroup = buildRoom(props.room)
    eng.scene.add(eng.roomGroup)
  }, [props.room])

  // ── 家具列表同步 ──
  useEffect(() => {
    const eng = engineRef.current
    if (!eng) return
    const seen = new Set<string>()
    for (const item of props.items) {
      seen.add(item.id)
      let g = eng.furniture.get(item.id)
      if (!g) {
        g = createFurnitureMesh(item.type)
        g.userData.id = item.id
        eng.furniture.set(item.id, g)
        eng.scene.add(g)
      }
      g.position.set(item.x, 0, item.z)
      g.rotation.y = item.rotation
    }
    for (const [id, g] of eng.furniture) {
      if (!seen.has(id)) {
        eng.scene.remove(g)
        eng.furniture.delete(id)
      }
    }
  }, [props.items])

  // ── 选中高亮 ──
  useEffect(() => {
    const eng = engineRef.current
    if (!eng) return
    if (eng.highlight) {
      eng.scene.remove(eng.highlight)
      eng.highlight.dispose()
      eng.highlight = null
    }
    if (props.selectedId) {
      const g = eng.furniture.get(props.selectedId)
      if (g) {
        eng.highlight = new THREE.BoxHelper(g, 0xff9f1a)
        eng.scene.add(eng.highlight)
      }
    }
  }, [props.selectedId, props.items])

  // ── 放置模式的幽灵预览 ──
  useEffect(() => {
    const eng = engineRef.current
    if (!eng) return
    if (eng.ghost) {
      eng.scene.remove(eng.ghost)
      eng.ghost = null
    }
    if (props.placingType) {
      const g = createFurnitureMesh(props.placingType)
      const mats: Array<{ m: THREE.MeshStandardMaterial; c: number }> = []
      g.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.material = (o.material as THREE.Material).clone()
          const m = o.material as THREE.MeshStandardMaterial
          m.transparent = true
          m.opacity = 0.45
          o.castShadow = false
          mats.push({ m, c: m.color.getHex() })
        }
      })
      g.userData.mats = mats
      g.visible = false
      eng.ghost = g
      eng.scene.add(g)
    }
  }, [props.placingType])

  // ── 视角切换 ──
  useEffect(() => {
    const eng = engineRef.current
    if (!eng || props.view.seq === 0) return
    const { length: L, width: W, height: H } = props.room
    if (props.view.kind === 'top') {
      eng.camera.position.set(0, Math.max(L, W) * 1.45, 0.0001)
      eng.controls.target.set(0, 0, 0)
    } else {
      eng.camera.position.set(L * 0.62, H * 1.9, W * 2.1)
      eng.controls.target.set(0, 0.6, 0)
    }
    eng.controls.update()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.view])

  return <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
}

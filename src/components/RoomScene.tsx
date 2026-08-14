import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildRoom, type RoomObstacle } from '../three/buildRoom'
import { clampToRoom, findCollision, resolveDrag, walkCollide } from '../three/collision'
import { createFurnitureMesh } from '../three/furniture'
import { type BumpCorners, type FurnitureItem, type FurnitureType, type RoomParams } from '../three/types'

/** plan = 平面模式（拖动平移）；walk = 自由漫游（无碰撞摄像机）；immersive = 沉浸体验（模拟人进屋） */
export type ViewCommand = { kind: 'plan' | 'walk' | 'immersive'; seq: number }

/** smoothstep 缓动 */
function smooth(t: number, a: number, b: number): number {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return x * x * (3 - 2 * x)
}

interface Props {
  room: RoomParams
  bumps: BumpCorners
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

  const modeRef = useRef<'plan' | 'walk' | 'immersive'>('plan')
  const walkRef = useRef({
    yaw: 0,
    pitch: 0,
    keys: new Set<string>(),
    look: null as { x: number; y: number } | null,
  })
  // 沉浸模式状态机
  const immersiveRef = useRef({
    phase: 'entering' as 'entering' | 'free',
    t: 0,
    y: 0, // 离地高度（跳跃）
    vy: 0,
    grounded: true,
    bob: 0, // 头部摆动相位
    outX: 0, // 屋外起点 X
    inX: 0, // 屋内终点 X
    doorZ: 0,
    openAngle: 0,
  })

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
    camera.position.set(0, 12, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // 平面模式控制：左键平移、滚轮缩放、禁止旋转
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.enableRotate = false
    controls.screenSpacePanning = true
    controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
    controls.minDistance = 2
    controls.maxDistance = 50
    controls.target.set(0, 0, 0)

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

    // capture 阶段处理：命中家具/放置时阻止 OrbitControls 的平移
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      // 漫游/沉浸模式：左键拖动 = 环视
      if (modeRef.current === 'walk' || modeRef.current === 'immersive') {
        walkRef.current.look = { x: e.clientX, y: e.clientY }
        e.stopPropagation()
        return
      }
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
        e.stopPropagation()
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
        e.stopPropagation() // 拖家具时不平移平面图
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      // 漫游/沉浸模式：拖动环视
      if (modeRef.current === 'walk' || modeRef.current === 'immersive') {
        const look = walkRef.current.look
        if (look) {
          walkRef.current.yaw -= (e.clientX - look.x) * 0.004
          walkRef.current.pitch = THREE.MathUtils.clamp(
            walkRef.current.pitch - (e.clientY - look.y) * 0.004,
            -1.2,
            1.2,
          )
          walkRef.current.look = { x: e.clientX, y: e.clientY }
        }
        return
      }
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
      if (modeRef.current === 'walk' || modeRef.current === 'immersive') {
        walkRef.current.look = null
        return
      }
      const st = stateRef.current
      const wasDrag = dragging
      dragging = null
      controls.enabled = modeRef.current === 'plan'
      // 纯点击空白处 → 取消选择
      if (!wasDrag && downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 4 && !st.placingType) {
        setNdc(e)
        if (!pickFurniture()) st.onSelect(null)
      }
      downAt = null
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown, { capture: true })
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    // 漫游键盘输入
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return
      walkRef.current.keys.add(e.key.toLowerCase())
    }
    const onKeyUp = (e: KeyboardEvent) => walkRef.current.keys.delete(e.key.toLowerCase())
    const onBlur = () => walkRef.current.keys.clear()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

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

    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(clock.getDelta(), 0.05)
      const mode = modeRef.current

      if (mode === 'walk') {
        // ── 自由漫游：无碰撞摄像机，可穿墙穿物、升降 ──
        const k = walkRef.current.keys
        const speed = k.has('shift') ? 4 : 2
        const yaw = walkRef.current.yaw
        const pitch = walkRef.current.pitch
        const fx = -Math.sin(yaw)
        const fz = -Math.cos(yaw)
        const rx = Math.cos(yaw)
        const rz = -Math.sin(yaw)
        let mx = 0
        let mz = 0
        if (k.has('w') || k.has('arrowup')) { mx += fx; mz += fz }
        if (k.has('s') || k.has('arrowdown')) { mx -= fx; mz -= fz }
        if (k.has('a') || k.has('arrowleft')) { mx -= rx; mz -= rz }
        if (k.has('d') || k.has('arrowright')) { mx += rx; mz += rz }
        if (mx !== 0 || mz !== 0) {
          const len = Math.hypot(mx, mz)
          camera.position.x += (mx / len) * speed * dt
          camera.position.z += (mz / len) * speed * dt
        }
        // Space 升 / C 降
        const vy = (k.has(' ') ? 1 : 0) - (k.has('c') ? 1 : 0)
        if (vy !== 0) camera.position.y = THREE.MathUtils.clamp(camera.position.y + vy * speed * dt, 0.15, 30)
        camera.rotation.set(pitch, yaw, 0)
      } else if (mode === 'immersive') {
        // ── 沉浸体验：模拟人进屋 / 落地行走 ──
        const st = stateRef.current
        const im = immersiveRef.current

        if (im.phase === 'entering') {
          // 开门 → 走入 → 关门 的启动动画
          im.t += dt
          const pivot = eng.roomGroup?.getObjectByName('doorPivot')
          if (pivot) {
            const a = Math.max(0, Math.min(1, smooth(im.t, 0.5, 1.4) - smooth(im.t, 3.0, 3.8)))
            pivot.rotation.y = im.openAngle * a
          }
          const k = smooth(im.t, 1.2, 3.0)
          camera.position.set(im.outX + (im.inX - im.outX) * k, 1.6, im.doorZ)
          camera.rotation.set(walkRef.current.pitch, walkRef.current.yaw, 0)
          if (im.t > 3.9) im.phase = 'free'
        } else {
          // 落地移动：走 / 跑 / 跳，有碰撞
          const k = walkRef.current.keys
          const speed = k.has('shift') ? 4 : 2
          const yaw = walkRef.current.yaw
          const fx = -Math.sin(yaw)
          const fz = -Math.cos(yaw)
          const rx = Math.cos(yaw)
          const rz = -Math.sin(yaw)
          let mx = 0
          let mz = 0
          if (k.has('w') || k.has('arrowup')) { mx += fx; mz += fz }
          if (k.has('s') || k.has('arrowdown')) { mx -= fx; mz -= fz }
          if (k.has('a') || k.has('arrowleft')) { mx -= rx; mz -= rz }
          if (k.has('d') || k.has('arrowright')) { mx += rx; mz += rz }
          const moving = mx !== 0 || mz !== 0
          if (moving) {
            const len = Math.hypot(mx, mz)
            mx /= len
            mz /= len
            const r = 0.22
            const px = camera.position.x
            const pz = camera.position.z
            const tryWalk = (nx: number, nz: number): { nx: number; nz: number } | null => {
              const cx = THREE.MathUtils.clamp(nx, -st.room.length / 2 + r, st.room.length / 2 - r)
              const cz = THREE.MathUtils.clamp(nz, -st.room.width / 2 + r, st.room.width / 2 - r)
              return walkCollide(st.items, st.obstacles, cx, cz, r) ? null : { nx: cx, nz: cz }
            }
            const step =
              tryWalk(px + mx * speed * dt, pz + mz * speed * dt) ??
              tryWalk(px + mx * speed * dt, pz) ??
              tryWalk(px, pz + mz * speed * dt)
            if (step) {
              camera.position.x = step.nx
              camera.position.z = step.nz
            }
          }
          // 跳跃与重力
          if (im.grounded && k.has(' ')) {
            im.vy = 4.4
            im.grounded = false
          }
          im.vy -= 12 * dt
          im.y += im.vy * dt
          if (im.y <= 0) {
            im.y = 0
            im.vy = 0
            im.grounded = true
          }
          // 走路头部轻微起伏
          let bobY = 0
          if (moving && im.grounded) {
            im.bob += dt * speed * 2.4
            bobY = Math.abs(Math.sin(im.bob)) * (speed > 3 ? 0.045 : 0.03)
          }
          camera.position.y = 1.6 + im.y + bobY
          camera.rotation.set(walkRef.current.pitch, walkRef.current.yaw, 0)
        }
      } else {
        controls.update()
      }
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown, { capture: true })
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 房间参数/凸起变化 → 重建房间 ──
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
    eng.roomGroup = buildRoom(props.room, props.bumps)
    eng.scene.add(eng.roomGroup)
  }, [props.room, props.bumps])

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
    const { length: L, width: W, doorOffset, windowEnd } = props.room

    // 离开沉浸模式时把门关上
    const pivot = eng.roomGroup?.getObjectByName('doorPivot')
    if (pivot && props.view.kind !== 'immersive') pivot.rotation.y = 0

    const doorX = windowEnd === 'negX' ? L / 2 : -L / 2
    const out = windowEnd === 'negX' ? 1 : -1

    if (props.view.kind === 'walk') {
      // 自由漫游：无碰撞摄像机，出生在门口
      modeRef.current = 'walk'
      eng.controls.enabled = false
      eng.camera.position.set(doorX - out * 0.55, 1.6, doorOffset)
      eng.camera.rotation.order = 'YXZ'
      walkRef.current.yaw = windowEnd === 'negX' ? Math.PI / 2 : -Math.PI / 2
      walkRef.current.pitch = -0.04
      walkRef.current.keys.clear()
      eng.camera.rotation.set(walkRef.current.pitch, walkRef.current.yaw, 0)
      return
    }

    if (props.view.kind === 'immersive') {
      // 沉浸体验：从门外开始，播开门进屋动画
      modeRef.current = 'immersive'
      eng.controls.enabled = false
      const im = immersiveRef.current
      im.phase = 'entering'
      im.t = 0
      im.y = 0
      im.vy = 0
      im.grounded = true
      im.bob = 0
      im.outX = doorX + out * 1.7
      im.inX = doorX - out * 1.1
      im.doorZ = doorOffset
      im.openAngle = windowEnd === 'negX' ? -1.6 : 1.6
      eng.camera.position.set(im.outX, 1.6, doorOffset)
      eng.camera.rotation.order = 'YXZ'
      walkRef.current.yaw = windowEnd === 'negX' ? Math.PI / 2 : -Math.PI / 2
      walkRef.current.pitch = 0
      walkRef.current.keys.clear()
      eng.camera.rotation.set(0, walkRef.current.yaw, 0)
      return
    }

    // 平面模式：正俯视，拖动平移、滚轮缩放
    modeRef.current = 'plan'
    eng.controls.enabled = true
    eng.camera.rotation.order = 'XYZ'
    const fitH = Math.max(L, W) * 1.15
    eng.camera.position.set(0, fitH, 0)
    eng.controls.target.set(0, 0, 0)
    eng.controls.update()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.view])

  return <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
}

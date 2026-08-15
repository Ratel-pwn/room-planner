import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildRoom, type RoomObstacle } from '../three/buildRoom'
import { clampToRoom, findCollision, resolveDrag, rotatedRectHalf, walkCollide } from '../three/collision'
import { createFurnitureMesh } from '../three/furniture'
import { FURNITURE_DEFS, type FurnitureType, type RoomConfig } from '../three/types'

/** plan = 平面模式；walk = 自由漫游；immersive = 沉浸体验；layout = 空间布局（拖拽房间位置） */
export type ViewCommand = { kind: 'plan' | 'walk' | 'immersive' | 'layout'; seq: number }

/** 选中家具的屏幕投影锚点（每帧由 RoomScene 写入，供悬浮操作条跟随） */
export interface SelectionAnchor {
  /** 家具顶部上方的屏幕点（悬浮条定位用） */
  x: number
  y: number
  /** 家具中心的屏幕点（旋转把手算角度用） */
  cx: number
  cy: number
  visible: boolean
}

/** 布局模式下每个房间的屏幕锚点（供房间浮动工具条跟随） */
export type RoomAnchors = Record<string, { x: number; y: number; visible: boolean }>

/** smoothstep 缓动 */
function smooth(t: number, a: number, b: number): number {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return x * x * (3 - 2 * x)
}

/** 空间世界坐标 → 房间局部坐标（考虑房间旋转） */
function toLocal(wx: number, wz: number, r: RoomConfig): { x: number; z: number } {
  const dx = wx - r.x
  const dz = wz - r.z
  const c = Math.cos(r.rotation)
  const s = Math.sin(r.rotation)
  return { x: dx * c + dz * s, z: -dx * s + dz * c }
}

/** 房间局部坐标 → 空间世界坐标 */
function toWorld(lx: number, lz: number, r: RoomConfig): { x: number; z: number } {
  const c = Math.cos(r.rotation)
  const s = Math.sin(r.rotation)
  return { x: r.x + lx * c - lz * s, z: r.z + lx * s + lz * c }
}

/** 房间名牌（HUD 风格 sprite，悬浮在房间上方） */
function makeRoomLabel(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(20, 19, 17, 0.85)'
  ctx.beginPath()
  ctx.roundRect(10, 10, 236, 44, 12)
  ctx.fill()
  ctx.strokeStyle = '#e0a92e'
  ctx.lineWidth = 2.5
  ctx.stroke()
  ctx.font = '600 24px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#f2eee4'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text.slice(0, 10), 128, 33)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
  sp.scale.set(1.7, 0.43, 1)
  sp.userData.isLabel = true
  return sp
}

function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose()
      const m = o.material
      if (Array.isArray(m)) m.forEach((x) => x.dispose())
      else m.dispose()
    } else if (o instanceof THREE.Sprite) {
      o.material.map?.dispose()
      o.material.dispose()
    }
  })
}

interface Props {
  /** 当前空间的全部房间 */
  rooms: RoomConfig[]
  /** 当前编辑的房间 */
  activeRoomId: string
  /** 当前房间的碰撞体（房间局部坐标） */
  obstacles: RoomObstacle[]
  selectedId: string | null
  placingType: FurnitureType | null
  view: ViewCommand
  selectionAnchor?: React.RefObject<SelectionAnchor>
  /** 布局模式下每个房间的屏幕锚点（每帧写入） */
  roomAnchors?: React.RefObject<RoomAnchors>
  onSelect: (id: string | null) => void
  /** 移动家具（当前房间局部坐标） */
  onMove: (id: string, x: number, z: number) => void
  /** 放置家具（当前房间局部坐标） */
  onPlace: (type: FurnitureType, x: number, z: number) => void
  /** 布局模式：拖拽房间（空间坐标） */
  onMoveRoom: (id: string, x: number, z: number) => void
  /** 布局模式：单击选中房间 */
  onPickRoom: (id: string) => void
  /** 布局模式：双击进入房间 */
  onEnterRoom: (id: string) => void
}

export function RoomScene(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef(props)
  stateRef.current = props

  const modeRef = useRef<'plan' | 'walk' | 'immersive' | 'layout'>('plan')
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
    outZ: 0, // 屋外起点 Z
    inX: 0, // 屋内终点 X
    inZ: 0, // 屋内终点 Z
    doorZ: 0,
    openAngle: 0,
  })

  const engineRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    roomGroups: Map<string, THREE.Group> // 房间结构（墙/地板/门窗）
    furnitureLayers: Map<string, THREE.Group> // 每个房间的家具层（随房间移动）
    furniture: Map<string, THREE.Group> // itemId → mesh
    ghost: THREE.Group | null
    highlight: THREE.BoxHelper | null
  } | null>(null)

  // ── 初始化场景（只一次）──
  useEffect(() => {
    const container = containerRef.current!
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xe9ebed)

    const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 300)
    camera.position.set(0, 12, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // 平面/布局模式控制：左键平移、滚轮缩放、禁止旋转
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.enableRotate = false
    controls.screenSpacePanning = true
    controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
    controls.minDistance = 2
    controls.maxDistance = 120
    controls.target.set(0, 0, 0)

    // 灯光
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc9bd, 0.9))
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.4)
    sun.position.set(-8, 10, 6)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -30
    sun.shadow.camera.right = 30
    sun.shadow.camera.top = 30
    sun.shadow.camera.bottom = -30
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.35)
    fill.position.set(6, 5, -6)
    scene.add(fill)

    const eng = {
      scene,
      camera,
      controls,
      roomGroups: new Map<string, THREE.Group>(),
      furnitureLayers: new Map<string, THREE.Group>(),
      furniture: new Map<string, THREE.Group>(),
      ghost: null as THREE.Group | null,
      highlight: null as THREE.BoxHelper | null,
    }
    engineRef.current = eng

    /** 当前编辑的房间 */
    const getActiveRoom = (): RoomConfig => {
      const st = stateRef.current
      return st.rooms.find((r) => r.id === st.activeRoomId) ?? st.rooms[0]
    }

    // ── 交互 ──
    const raycaster = new THREE.Raycaster()
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const ndc = new THREE.Vector2()
    const fwdV = new THREE.Vector3() // 漫游：摄像机前向（含俯仰）
    const moveV = new THREE.Vector3() // 漫游：本帧合成移动向量
    const projV = new THREE.Vector3() // 选中家具屏幕投影临时向量
    let dragging: { id: string; dx: number; dz: number } | null = null
    let roomDrag: { id: string; dx: number; dz: number } | null = null
    let downAt: { x: number; y: number } | null = null

    const setNdc = (e: { clientX: number; clientY: number }) => {
      const r = renderer.domElement.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    }

    const floorHit = (): THREE.Vector3 | null => {
      raycaster.setFromCamera(ndc, camera)
      const pt = new THREE.Vector3()
      return raycaster.ray.intersectPlane(floorPlane, pt) ? pt : null
    }

    const clamp = (type: FurnitureType, rotation: number, x: number, z: number) =>
      clampToRoom(getActiveRoom().params, type, rotation, x, z)

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

    const pickRoom = (): string | null => {
      raycaster.setFromCamera(ndc, camera)
      const hits = raycaster.intersectObjects([...eng.roomGroups.values()], true)
      for (const h of hits) {
        let o: THREE.Object3D | null = h.object
        while (o) {
          if (o.userData.roomId) return o.userData.roomId as string
          o = o.parent
        }
      }
      return null
    }

    // capture 阶段处理：命中家具/房间/放置时阻止 OrbitControls 的平移
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      // 漫游/沉浸模式：左键拖动 = 环视；按下时记录位置，抬起时位移很小则视为点击拾取家具
      if (modeRef.current === 'walk' || modeRef.current === 'immersive') {
        walkRef.current.look = { x: e.clientX, y: e.clientY }
        downAt = { x: e.clientX, y: e.clientY }
        e.stopPropagation()
        return
      }
      setNdc(e)
      downAt = { x: e.clientX, y: e.clientY }
      const st = stateRef.current
      const ar = getActiveRoom()

      // 布局模式：拖拽房间摆位置
      if (modeRef.current === 'layout') {
        const rid = pickRoom()
        if (rid) {
          st.onPickRoom(rid)
          const room = st.rooms.find((r) => r.id === rid)
          const pt = floorHit()
          if (pt && room) roomDrag = { id: rid, dx: room.x - pt.x, dz: room.z - pt.z }
          controls.enabled = false
          e.stopPropagation()
        }
        return
      }

      if (st.placingType) {
        const pt = floorHit()
        if (pt) {
          // 世界坐标 → 当前房间局部坐标（含房间旋转）
          const l = toLocal(pt.x, pt.z, ar)
          const c = clamp(st.placingType, 0, l.x, l.z)
          // 与其他家具/墙面设施碰撞时禁止放置
          if (!findCollision(ar.items, { type: st.placingType, rotation: 0, x: c.x, z: c.z }, 0.02, st.obstacles)) {
            st.onPlace(st.placingType, c.x, c.z)
          }
        }
        e.stopPropagation()
        return
      }

      const id = pickFurniture()
      if (id) {
        st.onSelect(id)
        const item = ar.items.find((i) => i.id === id)
        const pt = floorHit()
        if (item && pt) {
          const l = toLocal(pt.x, pt.z, ar)
          dragging = { id, dx: item.x - l.x, dz: item.z - l.z }
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

      // 布局模式：拖动房间
      if (modeRef.current === 'layout') {
        if (roomDrag) {
          const pt = floorHit()
          if (pt) st.onMoveRoom(roomDrag.id, pt.x + roomDrag.dx, pt.z + roomDrag.dz)
        }
        return
      }

      const ar = getActiveRoom()
      if (st.placingType && eng.ghost) {
        const pt = floorHit()
        if (pt) {
          const l = toLocal(pt.x, pt.z, ar)
          const c = clamp(st.placingType, 0, l.x, l.z)
          eng.ghost.position.set(c.x, 0, c.z)
          eng.ghost.visible = true
          // 碰撞时幽灵变红，提示此处不可放置
          const blocked = !!findCollision(
            ar.items,
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
          const item = ar.items.find((i) => i.id === dragging!.id)
          if (item) {
            // 碰撞解算：能全移则全移，否则沿墙滑动，都撞则不动（房间局部坐标）
            const l = toLocal(pt.x, pt.z, ar)
            const c = resolveDrag(
              ar.items,
              ar.params,
              item,
              l.x + dragging.dx,
              l.z + dragging.dz,
              st.obstacles,
            )
            st.onMove(dragging.id, c.x, c.z)
          }
        }
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (modeRef.current === 'walk' || modeRef.current === 'immersive') {
        walkRef.current.look = null
        // 纯点击（位移 < 4px）：漫游/沉浸中也能选中家具，用悬浮条操作；点空白取消选中
        if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 4) {
          setNdc(e)
          stateRef.current.onSelect(pickFurniture())
        }
        downAt = null
        return
      }
      if (modeRef.current === 'layout') {
        roomDrag = null
        controls.enabled = true
        downAt = null
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

    // 布局模式：双击进入房间
    const onDblClick = (e: MouseEvent) => {
      if (modeRef.current !== 'layout') return
      setNdc(e)
      const rid = pickRoom()
      if (rid) stateRef.current.onEnterRoom(rid)
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown, { capture: true })
    renderer.domElement.addEventListener('dblclick', onDblClick)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    // 漫游键盘输入
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return
      // 阻止 Space 触发聚焦按钮 / 页面滚动
      if (e.key === ' ') e.preventDefault()
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
        // ── 自由漫游：无碰撞摄像机，沿视野方向飞行（朝哪看就往哪移动）──
        const k = walkRef.current.keys
        const speed = k.has('shift') ? 4 : 2
        const yaw = walkRef.current.yaw
        camera.rotation.set(walkRef.current.pitch, yaw, 0)
        // 前向 = 摄像机实际朝向（含俯仰，朝地看按 W 就往地下钻）
        camera.getWorldDirection(fwdV)
        // 侧向保持水平，避免视线竖直朝上/下时退化
        const rx = Math.cos(yaw)
        const rz = -Math.sin(yaw)
        moveV.set(0, 0, 0)
        if (k.has('w') || k.has('arrowup')) moveV.add(fwdV)
        if (k.has('s') || k.has('arrowdown')) moveV.sub(fwdV)
        if (k.has('d') || k.has('arrowright')) { moveV.x += rx; moveV.z += rz }
        if (k.has('a') || k.has('arrowleft')) { moveV.x -= rx; moveV.z -= rz }
        // Space 抬升 / C 下降（世界竖直方向）
        moveV.y += (k.has(' ') ? 1 : 0) - (k.has('c') ? 1 : 0)
        if (moveV.lengthSq() > 0) {
          moveV.normalize()
          camera.position.addScaledVector(moveV, speed * dt)
          camera.position.y = THREE.MathUtils.clamp(camera.position.y, -30, 60)
        }
      } else if (mode === 'immersive') {
        // ── 沉浸体验：模拟人进屋 / 落地行走 ──
        const st = stateRef.current
        const ar = getActiveRoom()
        const L = ar.params.length
        const W = ar.params.width
        const im = immersiveRef.current

        if (im.phase === 'entering') {
          // 开门 → 走入 → 关门 的启动动画
          im.t += dt
          const pivot = eng.roomGroups.get(ar.id)?.getObjectByName('doorPivot')
          if (pivot) {
            const a = Math.max(0, Math.min(1, smooth(im.t, 0.5, 1.4) - smooth(im.t, 3.0, 3.8)))
            pivot.rotation.y = im.openAngle * a
          }
          const k = smooth(im.t, 1.2, 3.0)
          camera.position.set(
            im.outX + (im.inX - im.outX) * k,
            1.6,
            im.outZ + (im.inZ - im.outZ) * k,
          )
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
            // 摄像机世界坐标 → 房间局部坐标（含旋转）做碰撞，再转回世界坐标
            const tryWalk = (nx: number, nz: number): { nx: number; nz: number } | null => {
              const l = toLocal(nx, nz, ar)
              const cx = THREE.MathUtils.clamp(l.x, -L / 2 + r, L / 2 - r)
              const cz = THREE.MathUtils.clamp(l.z, -W / 2 + r, W / 2 - r)
              if (walkCollide(ar.items, st.obstacles, cx, cz, r)) return null
              const wpt = toWorld(cx, cz, ar)
              return { nx: wpt.x, nz: wpt.z }
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
        // plan / layout：OrbitControls 平移缩放
        controls.update()
      }

      // ── 选中家具屏幕投影锚点（供悬浮操作条跟随，每帧写入 ref，不触发 React 渲染）──
      const anchor = stateRef.current.selectionAnchor?.current
      if (anchor) {
        const selId = stateRef.current.selectedId
        const g = selId ? eng.furniture.get(selId) : undefined
        if (g && mode !== 'layout') {
          const w = renderer.domElement.clientWidth
          const hgt = renderer.domElement.clientHeight
          const fh = FURNITURE_DEFS[g.userData.type as FurnitureType].h
          g.getWorldPosition(projV)
          projV.y = fh / 2
          projV.project(camera)
          anchor.cx = (projV.x * 0.5 + 0.5) * w
          anchor.cy = (-projV.y * 0.5 + 0.5) * hgt
          g.getWorldPosition(projV)
          projV.y = fh + 0.3
          projV.project(camera)
          anchor.x = (projV.x * 0.5 + 0.5) * w
          anchor.y = (-projV.y * 0.5 + 0.5) * hgt
          anchor.visible = projV.z > -1 && projV.z < 1
        } else {
          anchor.visible = false
        }
      }

      // ── 布局模式：每个房间的屏幕锚点（供房间浮动工具条跟随）──
      const rAnchors = stateRef.current.roomAnchors?.current
      if (rAnchors) {
        const w = renderer.domElement.clientWidth
        const hgt = renderer.domElement.clientHeight
        for (const r of stateRef.current.rooms) {
          const a = (rAnchors[r.id] ??= { x: 0, y: 0, visible: false })
          if (mode === 'layout') {
            projV.set(r.x, r.params.height + 0.55, r.z)
            projV.project(camera)
            a.x = (projV.x * 0.5 + 0.5) * w
            a.y = (-projV.y * 0.5 + 0.5) * hgt
            a.visible = projV.z > -1 && projV.z < 1
          } else {
            a.visible = false
          }
        }
      }

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown, { capture: true })
      renderer.domElement.removeEventListener('dblclick', onDblClick)
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

  // ── 房间结构同步（增删房间 / 参数 / 凸起 / 改名 → 重建结构，家具层保留）──
  const structKey = JSON.stringify(props.rooms.map((r) => [r.id, r.name, r.params, r.bumps]))
  useEffect(() => {
    const eng = engineRef.current
    if (!eng) return
    const ids = new Set(props.rooms.map((r) => r.id))
    // 移除已删除的房间
    for (const [id, g] of eng.roomGroups) {
      if (!ids.has(id)) {
        eng.scene.remove(g)
        disposeTree(g)
        eng.roomGroups.delete(id)
      }
    }
    for (const [id, layer] of eng.furnitureLayers) {
      if (!ids.has(id)) {
        eng.scene.remove(layer)
        eng.furnitureLayers.delete(id)
      }
    }
    // 重建结构（家具是独立层，不受重建影响）
    for (const r of props.rooms) {
      const old = eng.roomGroups.get(r.id)
      if (old) {
        eng.scene.remove(old)
        disposeTree(old)
      }
      const g = buildRoom(r.params, r.bumps)
      g.userData.roomId = r.id
      g.position.set(r.x, 0, r.z)
      g.rotation.y = r.rotation
      const label = makeRoomLabel(r.name)
      label.position.set(0, r.params.height + 0.35, 0)
      g.add(label)
      eng.scene.add(g)
      eng.roomGroups.set(r.id, g)

      let layer = eng.furnitureLayers.get(r.id)
      if (!layer) {
        layer = new THREE.Group()
        eng.furnitureLayers.set(r.id, layer)
        eng.scene.add(layer)
      }
      layer.position.set(r.x, 0, r.z)
      layer.rotation.y = r.rotation
      // 把该房间已有的家具挂回家具层
      for (const item of r.items) {
        const fg = eng.furniture.get(item.id)
        if (fg && fg.parent !== layer) layer.add(fg)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structKey])

  // ── 房间位置/朝向同步（布局模式拖拽、旋转 → 只挪组，不重建）──
  const posKey = JSON.stringify(props.rooms.map((r) => [r.id, r.x, r.z, r.rotation]))
  useEffect(() => {
    const eng = engineRef.current
    if (!eng) return
    for (const r of props.rooms) {
      const g = eng.roomGroups.get(r.id)
      if (g) {
        g.position.set(r.x, 0, r.z)
        g.rotation.y = r.rotation
      }
      const layer = eng.furnitureLayers.get(r.id)
      if (layer) {
        layer.position.set(r.x, 0, r.z)
        layer.rotation.y = r.rotation
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posKey])

  // ── 家具列表同步（全部房间）──
  const itemsKey = JSON.stringify(props.rooms.map((r) => [r.id, r.items]))
  useEffect(() => {
    const eng = engineRef.current
    if (!eng) return
    const seen = new Set<string>()
    for (const r of props.rooms) {
      const layer = eng.furnitureLayers.get(r.id)
      for (const item of r.items) {
        seen.add(item.id)
        let g = eng.furniture.get(item.id)
        if (!g) {
          g = createFurnitureMesh(item.type)
          g.userData.id = item.id
          eng.furniture.set(item.id, g)
        }
        if (layer && g.parent !== layer) layer.add(g)
        g.position.set(item.x, 0, item.z)
        g.rotation.y = item.rotation
      }
    }
    for (const [id, g] of eng.furniture) {
      if (!seen.has(id)) {
        g.parent?.remove(g)
        eng.furniture.delete(id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedId, itemsKey])

  // ── 放置模式的幽灵预览（挂在当前房间的家具层，位置用局部坐标）──
  useEffect(() => {
    const eng = engineRef.current
    if (!eng) return
    if (eng.ghost) {
      eng.ghost.parent?.remove(eng.ghost)
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
      const layer = eng.furnitureLayers.get(props.activeRoomId)
      if (layer) layer.add(g)
      else eng.scene.add(g)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.placingType, props.activeRoomId])

  // ── 视角切换 ──
  useEffect(() => {
    const eng = engineRef.current
    if (!eng || props.view.seq === 0) return
    const st = stateRef.current
    const ar = st.rooms.find((r) => r.id === st.activeRoomId) ?? st.rooms[0]
    const { length: L, width: W, doorOffset, windowEnd } = ar.params
    const ox = ar.x
    const oz = ar.z

    // 离开沉浸模式时把门关上
    const pivot = eng.roomGroups.get(ar.id)?.getObjectByName('doorPivot')
    if (pivot && props.view.kind !== 'immersive') pivot.rotation.y = 0

    // 门的局部坐标 / 门外方向（局部 +X 或 -X）
    const doorLx = windowEnd === 'negX' ? L / 2 : -L / 2
    const out = windowEnd === 'negX' ? 1 : -1
    // 面朝房间内的摄像机朝向（含房间旋转）
    const baseYaw = (windowEnd === 'negX' ? Math.PI / 2 : -Math.PI / 2) + ar.rotation

    if (props.view.kind === 'layout') {
      // 空间布局：正俯视整个空间，拖拽房间位置
      modeRef.current = 'layout'
      eng.controls.enabled = true
      eng.camera.rotation.order = 'XYZ'
      let minX = Infinity
      let maxX = -Infinity
      let minZ = Infinity
      let maxZ = -Infinity
      for (const r of st.rooms) {
        const { hw, hd } = rotatedRectHalf(r.params.length, r.params.width, r.rotation)
        minX = Math.min(minX, r.x - hw)
        maxX = Math.max(maxX, r.x + hw)
        minZ = Math.min(minZ, r.z - hd)
        maxZ = Math.max(maxZ, r.z + hd)
      }
      if (!st.rooms.length) {
        minX = maxX = minZ = maxZ = 0
      }
      const cx = (minX + maxX) / 2
      const cz = (minZ + maxZ) / 2
      const fitH = Math.max(maxX - minX, maxZ - minZ) * 1.2 + 2
      eng.camera.position.set(cx, Math.max(fitH, 4), cz)
      eng.controls.target.set(cx, 0, cz)
      eng.controls.update()
      return
    }

    if (props.view.kind === 'walk') {
      // 自由漫游：无碰撞摄像机，出生在当前房间门口
      modeRef.current = 'walk'
      eng.controls.enabled = false
      const sp = toWorld(doorLx - out * 0.55, doorOffset, ar)
      eng.camera.position.set(sp.x, 1.6, sp.z)
      eng.camera.rotation.order = 'YXZ'
      walkRef.current.yaw = baseYaw
      walkRef.current.pitch = -0.04
      walkRef.current.keys.clear()
      eng.camera.rotation.set(walkRef.current.pitch, walkRef.current.yaw, 0)
      return
    }

    if (props.view.kind === 'immersive') {
      // 沉浸体验：从当前房间门外开始，播开门进屋动画
      modeRef.current = 'immersive'
      eng.controls.enabled = false
      const im = immersiveRef.current
      im.phase = 'entering'
      im.t = 0
      im.y = 0
      im.vy = 0
      im.grounded = true
      im.bob = 0
      const outW = toWorld(doorLx + out * 1.7, doorOffset, ar)
      const inW = toWorld(doorLx - out * 1.1, doorOffset, ar)
      im.outX = outW.x
      im.outZ = outW.z
      im.inX = inW.x
      im.inZ = inW.z
      im.openAngle = windowEnd === 'negX' ? -1.6 : 1.6
      eng.camera.position.set(im.outX, 1.6, im.outZ)
      eng.camera.rotation.order = 'YXZ'
      walkRef.current.yaw = baseYaw
      walkRef.current.pitch = 0
      walkRef.current.keys.clear()
      eng.camera.rotation.set(0, walkRef.current.yaw, 0)
      return
    }

    // 平面模式：正俯视当前房间，拖动平移、滚轮缩放
    modeRef.current = 'plan'
    eng.controls.enabled = true
    eng.camera.rotation.order = 'XYZ'
    const fitH = Math.max(L, W) * 1.15
    eng.camera.position.set(ox, fitH, oz)
    eng.controls.target.set(ox, 0, oz)
    eng.controls.update()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.view])

  return <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
}

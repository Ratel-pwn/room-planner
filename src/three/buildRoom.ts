import * as THREE from 'three'
import { NO_BUMPS, type BumpCorners, type RoomParams } from './types'

const WALL_COLOR = 0xf5f4f0
const FLOOR_COLOR = 0xe6e3dc
const BASEBOARD_COLOR = 0x1c1c1e
const FRAME_GREEN = 0x3d5c4e
const CEIL_COLOR = 0xfafafa

function box(
  w: number,
  h: number,
  d: number,
  color: number,
  opts: { roughness?: number; metalness?: number } = {},
): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.9, metalness: opts.metalness ?? 0 }),
  )
  m.castShadow = false
  m.receiveShadow = true
  return m
}

/** 带一个矩形洞（窗或门）的端墙。墙位于给定 x，面向室内。 */
function wallWithOpening(
  wallLen: number, // 墙总长（房间宽度方向）
  wallH: number,
  openingW: number,
  openingBottom: number, // 洞底离地高度（门为 0）
  openingH: number,
  openingCenter: number, // 洞中心相对墙中心偏移
  thickness: number,
  color: number,
): THREE.Group {
  const g = new THREE.Group()
  const t = thickness
  const oL = openingCenter - openingW / 2 // 洞左缘（相对墙中心）
  const oR = openingCenter + openingW / 2
  const half = wallLen / 2

  // 左侧段
  const leftW = oL + half
  if (leftW > 0.001) {
    const m = box(t, wallH, leftW, color)
    m.position.set(0, wallH / 2, -half + leftW / 2)
    g.add(m)
  }
  // 右侧段
  const rightW = half - oR
  if (rightW > 0.001) {
    const m = box(t, wallH, rightW, color)
    m.position.set(0, wallH / 2, oR + rightW / 2)
    g.add(m)
  }
  // 洞下方（窗台）
  const belowH = openingBottom
  if (belowH > 0.001) {
    const m = box(t, belowH, openingW, color)
    m.position.set(0, belowH / 2, openingCenter)
    g.add(m)
  }
  // 洞上方（过梁）
  const topY = openingBottom + openingH
  const aboveH = wallH - topY
  if (aboveH > 0.001) {
    const m = box(t, aboveH, openingW, color)
    m.position.set(0, topY + aboveH / 2, openingCenter)
    g.add(m)
  }
  return g
}

function baseboard(len: number): THREE.Mesh {
  return box(len, 0.08, 0.012, BASEBOARD_COLOR, { roughness: 0.6 })
}

export function makeDimensionSprite(text: string, scale = 1): THREE.Sprite {
  const cv = document.createElement('canvas')
  cv.width = 512
  cv.height = 128
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = 'rgba(20,20,22,0.85)'
  ctx.font = 'bold 56px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 64)
  const tex = new THREE.CanvasTexture(cv)
  tex.anisotropy = 4
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
  sp.scale.set(1.6 * scale, 0.4 * scale, 1)
  sp.renderOrder = 999
  return sp
}

/** 四角方位：左下(-X,-Z)、右下(+X,-Z)、右上(+X,+Z)、左上(-X,+Z) */
const CORNER_SIGNS: Array<[number, number]> = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
]

export function buildRoom(p: RoomParams, bumps: BumpCorners = NO_BUMPS): THREE.Group {
  const room = new THREE.Group()
  room.name = 'room'
  const L = p.length
  const W = p.width
  const H = p.height
  const T = 0.12 // 墙厚

  // ── 地板 ──
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(L, 0.05, W),
    new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.95 }),
  )
  floor.position.y = -0.025
  floor.receiveShadow = true
  floor.name = 'floor'
  room.add(floor)

  // 地板网格（0.5m，等距手绘线，避免拉伸变形）
  {
    const pts: number[] = []
    for (let x = -L / 2; x <= L / 2 + 0.001; x += 0.5) pts.push(x, 0.002, -W / 2, x, 0.002, W / 2)
    for (let z = -W / 2; z <= W / 2 + 0.001; z += 0.5) pts.push(-L / 2, 0.002, z, L / 2, 0.002, z)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    const grid = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({ color: 0xc8c5bd, transparent: true, opacity: 0.5 }),
    )
    room.add(grid)
  }

  // ── 天花板 ──
  if (p.showCeiling) {
    const ceil = new THREE.Mesh(
      new THREE.BoxGeometry(L, 0.05, W),
      new THREE.MeshStandardMaterial({ color: CEIL_COLOR, roughness: 1 }),
    )
    ceil.position.y = H + 0.025
    room.add(ceil)
  }

  // ── 两面长墙（南北，Z 方向两侧）──
  for (const side of [-1, 1]) {
    const wall = box(L, H, T, WALL_COLOR)
    wall.position.set(0, H / 2, side * (W / 2 + T / 2))
    room.add(wall)
    const bb = baseboard(L)
    bb.position.set(0, 0.04, side * (W / 2 - 0.006))
    room.add(bb)
  }

  // ── 窗端墙 ──
  const winX = p.windowEnd === 'negX' ? -L / 2 : L / 2
  const winWall = wallWithOpening(W, H, p.windowWidth, p.windowSill, p.windowHeight, 0, T, WALL_COLOR)
  winWall.position.set(winX + (p.windowEnd === 'negX' ? -T / 2 : T / 2), 0, 0)
  room.add(winWall)

  // 窗框（墨绿色铝合金，与照片一致）
  const frame = new THREE.Group()
  const ft = 0.06 // 框料宽
  const fw = p.windowWidth
  const fh = p.windowHeight
  const frameParts: Array<[number, number, number, number, number]> = [
    // [w, h, d, y, z]
    [ft, fh, ft, p.windowSill + fh / 2, -fw / 2 + ft / 2],
    [ft, fh, ft, p.windowSill + fh / 2, fw / 2 - ft / 2],
    [ft, ft, fw, p.windowSill + ft / 2, 0],
    [ft, ft, fw, p.windowSill + fh - ft / 2, 0],
    // 中梃（模仿照片中的推拉窗分隔）
    [ft * 0.7, fh, ft * 0.7, p.windowSill + fh / 2, -fw / 6],
    [ft * 0.7, fh, ft * 0.7, p.windowSill + fh / 2, fw / 6],
    [ft * 0.7, ft * 0.7, fw, p.windowSill + fh * 0.55, 0],
  ]
  for (const [w, h, d, y, z] of frameParts) {
    const m = box(w, h, d, FRAME_GREEN, { roughness: 0.5, metalness: 0.4 })
    m.position.set(0, y, z)
    frame.add(m)
  }
  // 玻璃
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, fh - ft, fw - ft),
    new THREE.MeshPhysicalMaterial({
      color: 0x9fb6c4,
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      metalness: 0.1,
    }),
  )
  glass.position.set(0, p.windowSill + fh / 2, 0)
  frame.add(glass)
  frame.position.set(winX, 0, 0)
  room.add(frame)

  // 窗台板
  const sillBoard = box(0.16, 0.03, p.windowWidth, 0xefeeea)
  sillBoard.position.set(winX + (p.windowEnd === 'negX' ? 0.04 : -0.04), p.windowSill - 0.015, 0)
  room.add(sillBoard)

  // ── 门端墙（窗对面）──
  const doorX = -winX
  const doorWall = wallWithOpening(W, H, p.doorWidth, 0, 2.1, p.doorOffset, T, WALL_COLOR)
  doorWall.position.set(doorX + (p.windowEnd === 'negX' ? T / 2 : -T / 2), 0, 0)
  room.add(doorWall)
  // 门扇（装在铰链枢轴上，沉浸模式的开门动画围绕门轴旋转）
  const leafW = p.doorWidth - 0.06
  const doorPivot = new THREE.Group()
  doorPivot.name = 'doorPivot'
  doorPivot.position.set(doorX + (p.windowEnd === 'negX' ? 0.02 : -0.02), 0, p.doorOffset - leafW / 2)
  const doorLeaf = box(0.04, 2.08, leafW, 0xc9a876, { roughness: 0.7 })
  doorLeaf.position.set(0, 1.04, leafW / 2)
  doorPivot.add(doorLeaf)
  room.add(doorPivot)
  // 门套
  const jamb = box(0.1, 2.12, p.doorWidth + 0.08, 0x8a8a8c)
  jamb.position.set(doorX, 1.06, p.doorOffset)
  const jambHole = doorLeaf // 简化：门套在门扇后，视觉ok
  room.add(jamb)
  jamb.renderOrder = -1
  void jambHole

  // 两端踢脚线
  for (const ex of [-1, 1]) {
    const bb = baseboard(W)
    bb.rotation.y = Math.PI / 2
    bb.position.set(ex * (L / 2 - 0.006), 0.04, 0)
    room.add(bb)
  }

  // ── 四角结构凸起（柱/管道井）──
  bumps.forEach((b, i) => {
    if (b.w <= 0 || b.d <= 0) return
    const [sx, sz] = CORNER_SIGNS[i]
    const m = box(b.w, H, b.d, WALL_COLOR)
    m.position.set(sx * (L / 2 - b.w / 2), H / 2, sz * (W / 2 - b.d / 2))
    room.add(m)
  })

  // ── 吊灯：两条 LED 长条灯，沿房间长向 ──
  for (const lz of [-0.8, 0.8]) {
    for (const lx of [-L / 4, L / 4]) {
      const lamp = box(1.2, 0.06, 0.12, 0x222224, { roughness: 0.5 })
      lamp.position.set(lx, H - 0.18, lz)
      room.add(lamp)
      const glow = new THREE.Mesh(
        new THREE.BoxGeometry(1.14, 0.015, 0.09),
        new THREE.MeshBasicMaterial({ color: 0xfff6e0 }),
      )
      glow.position.set(lx, H - 0.215, lz)
      room.add(glow)
      // 吊杆
      for (const rx of [-0.5, 0.5]) {
        const rod = box(0.015, 0.15, 0.015, 0x555557)
        rod.position.set(lx + rx, H - 0.075, lz)
        room.add(rod)
      }
    }
  }

  // ── 墙面设备（还原照片）：空调内机、弱电箱、插座 ──
  const doorSide = p.windowEnd === 'negX' ? 1 : -1
  // 空调内机，挂在 +Z 长墙高处，靠近门端
  const ac = box(0.9, 0.3, 0.22, 0xf2f2f4, { roughness: 0.4 })
  ac.position.set(doorSide * (L / 2 - 1.0), H - 0.45, W / 2 - 0.12)
  room.add(ac)
  // 弱电箱（多媒体信息箱），同墙低位
  const weakBox = box(0.45, 0.32, 0.1, 0xf0f0f2, { roughness: 0.4 })
  weakBox.position.set(doorSide * (L / 2 - 1.6), 0.45, W / 2 - 0.06)
  room.add(weakBox)
  // 插座
  for (const sx of [-L / 4, L / 4]) {
    const socket = box(0.15, 0.09, 0.02, 0xffffff)
    socket.position.set(sx, 0.32, W / 2 - 0.012)
    room.add(socket)
  }

  // ── 尺寸标注 ──
  const dimL = makeDimensionSprite(`${L.toFixed(2)} m`)
  dimL.position.set(0, 0.02, W / 2 + 0.55)
  room.add(dimL)
  const dimW = makeDimensionSprite(`${W.toFixed(2)} m`)
  dimW.position.set(L / 2 + 0.85, 0.02, 0)
  room.add(dimW)
  const dimH = makeDimensionSprite(`高 ${H.toFixed(2)} m`, 0.8)
  dimH.position.set(-L / 2 + 0.5, H + 0.25, -W / 2 + 0.5)
  room.add(dimH)

  return room
}

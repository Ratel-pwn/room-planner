import * as THREE from 'three'
import type { FurnitureType } from './types'

const WOOD = 0xc9a06b
const WOOD_DARK = 0x8f6b42
const LEG = 0x3a3a3e
const CHAIR_SEAT = 0x5b7a8c
const SHELF_COLOR = 0xb98d5e
const OFFICE_FRAME = 0xe4e4df
const OFFICE_DIVIDER = 0xc7cdca
const CABLE_HOLE = 0x4c4c50

function mat(color: number, roughness = 0.7): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness })
}

function bx(w: number, h: number, d: number, color: number, roughness = 0.7): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, roughness))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function legs(w: number, d: number, h: number, size = 0.045, color = LEG): THREE.Group {
  const g = new THREE.Group()
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = bx(size, h, size, color, 0.5)
      leg.position.set(sx * (w / 2 - size / 2 - 0.02), h / 2, sz * (d / 2 - size / 2 - 0.02))
      g.add(leg)
    }
  return g
}

function desk(w: number, d: number): THREE.Group {
  const g = new THREE.Group()
  const top = bx(w, 0.03, d, WOOD)
  top.position.y = 0.735
  g.add(top)
  g.add(legs(w, d, 0.72))
  return g
}

/** 带中部隔板和线槽的对坐式办公桌，length 沿 X 轴。 */
function sharedWorkstation(length: number, seatsPerSide: number): THREE.Group {
  const g = new THREE.Group()
  const depth = 1.2
  const topHeight = 0.74
  const topThickness = 0.04
  const frameSize = 0.055

  const top = bx(length, topThickness, depth, 0xd4aa70, 0.58)
  top.name = 'workstation-top'
  top.position.y = topHeight - topThickness / 2
  g.add(top)

  // 两端矩形钢架：立柱 + 底部横梁。
  for (const sx of [-1, 1]) {
    const x = sx * (length / 2 - 0.045)
    for (const sz of [-1, 1]) {
      const post = bx(frameSize, 0.7, frameSize, OFFICE_FRAME, 0.38)
      post.position.set(x, 0.35, sz * (depth / 2 - 0.045))
      g.add(post)
    }
    const endRail = bx(frameSize, 0.05, depth - 0.055, OFFICE_FRAME, 0.38)
    endRail.position.set(x, 0.025, 0)
    g.add(endRail)
  }

  // 桌面下的纵向加固梁。
  for (const sz of [-1, 1]) {
    const rail = bx(length - 0.08, 0.05, frameSize, OFFICE_FRAME, 0.38)
    rail.position.set(0, 0.675, sz * (depth / 2 - 0.055))
    g.add(rail)
  }

  const divider = bx(length - 0.12, 0.24, 0.025, OFFICE_DIVIDER, 0.48)
  divider.name = 'workstation-divider'
  divider.position.set(0, 0.86, 0)
  g.add(divider)

  const cableTray = bx(length - 0.18, 0.1, 0.18, OFFICE_FRAME, 0.42)
  cableTray.name = 'workstation-cable-tray'
  cableTray.position.set(0, 0.625, 0)
  g.add(cableTray)

  // 每个工位都有一个靠近中央线槽的穿线孔。
  const stationXs = seatsPerSide === 1 ? [0] : [-length / 4, length / 4]
  for (const x of stationXs) {
    for (const z of [-0.23, 0.23]) {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.006, 24), mat(CABLE_HOLE, 0.45))
      hole.name = 'workstation-cable-hole'
      hole.position.set(x, topHeight + 0.003, z)
      hole.castShadow = true
      g.add(hole)
    }
  }

  return g
}

function roundTable(): THREE.Group {
  const g = new THREE.Group()
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.03, 40), mat(WOOD))
  top.position.y = 0.735
  top.castShadow = true
  g.add(top)
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 16), mat(LEG, 0.5))
  pole.position.y = 0.36
  g.add(pole)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.025, 32), mat(LEG, 0.5))
  base.position.y = 0.0125
  g.add(base)
  return g
}

function chair(): THREE.Group {
  const g = new THREE.Group()
  const seat = bx(0.42, 0.04, 0.42, CHAIR_SEAT)
  seat.position.y = 0.45
  g.add(seat)
  const back = bx(0.42, 0.4, 0.035, CHAIR_SEAT)
  back.position.set(0, 0.65, -0.19)
  g.add(back)
  g.add(legs(0.4, 0.4, 0.43, 0.03))
  return g
}

function bench(): THREE.Group {
  const g = new THREE.Group()
  const top = bx(1.0, 0.05, 0.35, WOOD_DARK)
  top.position.y = 0.425
  g.add(top)
  g.add(legs(0.96, 0.31, 0.4, 0.05))
  return g
}

function shelf(): THREE.Group {
  const g = new THREE.Group()
  const W = 0.9, D = 0.3, H = 1.8
  for (const sx of [-1, 1]) {
    const side = bx(0.025, H, D, SHELF_COLOR)
    side.position.set(sx * (W / 2 - 0.0125), H / 2, 0)
    g.add(side)
  }
  const levels = [0.02, 0.45, 0.9, 1.35, H - 0.025]
  for (const y of levels) {
    const board = bx(W - 0.05, 0.025, D - 0.01, SHELF_COLOR)
    board.position.set(0, y + 0.0125, 0)
    g.add(board)
  }
  const back = bx(W - 0.05, H - 0.05, 0.015, SHELF_COLOR)
  back.position.set(0, H / 2, -D / 2 + 0.02)
  g.add(back)
  return g
}

const SOFA_FABRIC = 0x8a9aad
const SOFA_DARK = 0x6d7d8f

/** 三人位沙发床 1.8×0.62×0.8（面向 +Z） */
function sofa(): THREE.Group {
  const g = new THREE.Group()
  const W = 1.8, D = 0.62
  // 座垫（三块）
  for (const i of [-1, 0, 1]) {
    const seat = bx(W / 3 - 0.03, 0.14, D - 0.16, SOFA_FABRIC, 0.95)
    seat.position.set((i * W) / 3, 0.36, 0.03)
    g.add(seat)
  }
  // 底座
  const base = bx(W, 0.22, D - 0.06, SOFA_DARK, 0.9)
  base.position.set(0, 0.18, 0)
  g.add(base)
  // 靠背
  const back = bx(W, 0.44, 0.14, SOFA_FABRIC, 0.95)
  back.position.set(0, 0.58, -D / 2 + 0.07)
  g.add(back)
  // 扶手
  for (const sx of [-1, 1]) {
    const arm = bx(0.1, 0.24, D - 0.08, SOFA_DARK, 0.9)
    arm.position.set(sx * (W / 2 - 0.05), 0.49, 0)
    g.add(arm)
  }
  // 短脚
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const foot = bx(0.04, 0.07, 0.04, LEG, 0.5)
      foot.position.set(sx * (W / 2 - 0.08), 0.035, sz * (D / 2 - 0.08))
      g.add(foot)
    }
  return g
}

/** 简易长方形茶几 1.0×0.5×0.45 */
function teaTable(): THREE.Group {
  const g = new THREE.Group()
  const top = bx(1.0, 0.035, 0.5, 0xd8d2c8, 0.6)
  top.position.y = 0.432
  g.add(top)
  g.add(legs(0.96, 0.46, 0.415, 0.035))
  return g
}

export function createFurnitureMesh(type: FurnitureType): THREE.Group {
  let inner: THREE.Group
  switch (type) {
    case 'desk120':
      inner = desk(1.2, 0.6)
      break
    case 'desk160':
      inner = desk(1.6, 0.8)
      break
    case 'roundTable':
      inner = roundTable()
      break
    case 'chair':
      inner = chair()
      break
    case 'bench':
      inner = bench()
      break
    case 'shelf':
      inner = shelf()
      break
    case 'sofa':
      inner = sofa()
      break
    case 'teaTable':
      inner = teaTable()
      break
    case 'workstation2':
      inner = sharedWorkstation(1.2, 1)
      break
    case 'workstation4':
      inner = sharedWorkstation(2.4, 2)
      break
  }
  const g = new THREE.Group()
  g.add(inner)
  g.userData.furniture = true
  g.userData.type = type
  return g
}

interface GhostMaterial {
  material: THREE.MeshStandardMaterial
  color: number
}

/** 用与正式家具相同的模型构建半透明放置预览。 */
export function createFurnitureGhost(type: FurnitureType): THREE.Group {
  const ghost = createFurnitureMesh(type)
  const materials: GhostMaterial[] = []
  ghost.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.material = (object.material as THREE.Material).clone()
    const material = object.material as THREE.MeshStandardMaterial
    material.transparent = true
    material.opacity = 0.45
    // 复杂家具由多个半透明网格组成，禁止写深度避免它们互相遮掉。
    material.depthWrite = false
    object.castShadow = false
    object.receiveShadow = false
    materials.push({ material, color: material.color.getHex() })
  })
  ghost.userData.ghostMaterials = materials
  ghost.visible = false
  return ghost
}

/** 更新放置预览的可见性和碰撞状态。 */
export function updateFurnitureGhost(ghost: THREE.Group, blocked: boolean): void {
  const materials = (ghost.userData.ghostMaterials ?? []) as GhostMaterial[]
  for (const entry of materials) entry.material.color.setHex(blocked ? 0xe05555 : entry.color)
  ghost.visible = true
}

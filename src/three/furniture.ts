import * as THREE from 'three'
import type { FurnitureType } from './types'

const WOOD = 0xc9a06b
const WOOD_DARK = 0x8f6b42
const LEG = 0x3a3a3e
const CHAIR_SEAT = 0x5b7a8c
const SHELF_COLOR = 0xb98d5e

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
  }
  const g = new THREE.Group()
  g.add(inner)
  g.userData.furniture = true
  g.userData.type = type
  return g
}

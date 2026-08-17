import { NO_BUMPS, type BumpCorners, type RoomParams } from './types'

const CORNER_SIGNS: Array<[number, number]> = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
]

export interface RoomObstacle {
  x: number
  z: number
  hx: number
  hz: number
  y0: number
  y1: number
}

export function buildRoomObstacles(p: RoomParams, bumps: BumpCorners = NO_BUMPS): RoomObstacle[] {
  const L = p.length
  const W = p.width
  const H = p.height
  const obstacles: RoomObstacle[] = []
  const winX = p.windowEnd === 'negX' ? -L / 2 : L / 2
  const doorX = -winX
  const doorSide = p.windowEnd === 'negX' ? 1 : -1
  const leafOff = p.windowEnd === 'negX' ? 0.02 : -0.02
  const sillOff = p.windowEnd === 'negX' ? 0.04 : -0.04

  for (const side of [-1, 1]) {
    obstacles.push({ x: 0, z: side * (W / 2 - 0.006), hx: L / 2, hz: 0.006, y0: 0, y1: 0.08 })
    obstacles.push({ x: side * (L / 2 - 0.006), z: 0, hx: 0.006, hz: W / 2, y0: 0, y1: 0.08 })
  }
  obstacles.push({ x: doorSide * (L / 2 - 1.6), z: W / 2 - 0.05, hx: 0.225, hz: 0.05, y0: 0.29, y1: 0.61 })
  obstacles.push({ x: doorSide * (L / 2 - 1.0), z: W / 2 - 0.11, hx: 0.45, hz: 0.11, y0: H - 0.6, y1: H - 0.3 })
  for (const sx of [-L / 4, L / 4]) {
    obstacles.push({ x: sx, z: W / 2 - 0.012, hx: 0.075, hz: 0.01, y0: 0.275, y1: 0.365 })
  }
  obstacles.push({ x: doorX + leafOff, z: p.doorOffset, hx: 0.02, hz: (p.doorWidth - 0.06) / 2, y0: 0, y1: 2.08 })
  obstacles.push({ x: doorX, z: p.doorOffset, hx: 0.05, hz: (p.doorWidth + 0.08) / 2, y0: 0, y1: 2.12 })
  obstacles.push({ x: winX + sillOff, z: 0, hx: 0.08, hz: p.windowWidth / 2, y0: p.windowSill - 0.03, y1: p.windowSill })

  bumps.forEach((bump, index) => {
    if (bump.w <= 0 || bump.d <= 0) return
    const [sx, sz] = CORNER_SIGNS[index]
    obstacles.push({
      x: sx * (L / 2 - bump.w / 2),
      z: sz * (W / 2 - bump.d / 2),
      hx: bump.w / 2,
      hz: bump.d / 2,
      y0: 0,
      y1: H,
    })
  })

  return obstacles
}

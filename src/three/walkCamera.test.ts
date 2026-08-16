import { describe, expect, it } from 'vitest'
import { getWalkOverviewPose, updateLookPitch } from './walkCamera'
import { DEFAULT_ROOM, NO_BUMPS, type RoomConfig } from './types'

const makeRoom = (overrides: Partial<RoomConfig> = {}): RoomConfig => ({
  id: 'room-1',
  name: '房间 1',
  x: 0,
  z: 0,
  rotation: 0,
  params: { ...DEFAULT_ROOM },
  bumps: NO_BUMPS,
  items: [],
  ...overrides,
})

describe('漫游默认斜向俯视机位', () => {
  it('允许看到正下方和正上方但不会翻转视野', () => {
    expect(updateLookPitch(-1.5, 100)).toBeCloseTo(-Math.PI / 2, 8)
    expect(updateLookPitch(1.5, -100)).toBeCloseTo(Math.PI / 2, 8)
    expect(updateLookPitch(0, 100)).toBeCloseTo(-0.4, 8)
  })

  it('位于默认房间斜上方并俯视房间中心', () => {
    const pose = getWalkOverviewPose(makeRoom())

    expect(pose.x).toBeGreaterThan(DEFAULT_ROOM.length / 2)
    expect(pose.z).toBeGreaterThan(DEFAULT_ROOM.width / 2)
    expect(pose.y).toBeGreaterThan(DEFAULT_ROOM.height)
    expect(pose.pitch).toBeLessThan(-0.6)
    expect(pose.pitch).toBeGreaterThan(-1.2)
    expect(pose.yaw).toBeGreaterThan(0)

    const horizontal = Math.cos(pose.pitch)
    const forward = {
      x: -Math.sin(pose.yaw) * horizontal,
      y: Math.sin(pose.pitch),
      z: -Math.cos(pose.yaw) * horizontal,
    }
    const distance = Math.hypot(pose.x, pose.y - 0.35, pose.z)
    expect(forward.x).toBeCloseTo(-pose.x / distance, 8)
    expect(forward.y).toBeCloseTo((0.35 - pose.y) / distance, 8)
    expect(forward.z).toBeCloseTo(-pose.z / distance, 8)
  })

  it('随房间尺寸放大机位距离', () => {
    const small = getWalkOverviewPose(makeRoom())
    const large = getWalkOverviewPose(
      makeRoom({ params: { ...DEFAULT_ROOM, length: 12, width: 6 } }),
    )

    expect(large.x).toBeGreaterThan(small.x)
    expect(large.z).toBeGreaterThan(small.z)
    expect(large.y).toBeGreaterThan(small.y)
  })

  it('随房间旋转水平机位偏移', () => {
    const base = getWalkOverviewPose(makeRoom())
    const rotated = getWalkOverviewPose(makeRoom({ x: 10, z: -4, rotation: Math.PI / 2 }))

    expect(rotated.x - 10).toBeCloseTo(-base.z, 8)
    expect(rotated.z + 4).toBeCloseTo(base.x, 8)
    expect(rotated.pitch).toBeCloseTo(base.pitch, 8)
  })
})

import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { DoorInteraction } from './doorInteraction'

function makeDoor(openAngle = -1.6) {
  const pivot = new THREE.Group()
  pivot.position.set(2, 0, 1)
  const leaf = new THREE.Object3D()
  leaf.position.set(0, 1.04, 0.45)
  pivot.add(leaf)
  return { pivot, door: new DoorInteraction('door:room-1', pivot, openAngle) }
}

function advance(door: DoorInteraction, seconds: number) {
  const frames = Math.ceil(seconds * 60)
  for (let i = 0; i < frames; i += 1) door.update(1 / 60)
}

describe('DoorInteraction', () => {
  it('切换后以阻尼动画收敛到开启角', () => {
    const { pivot, door } = makeDoor(-1.6)
    expect(door.getPrompt()).toBe('开门')

    door.interact()
    expect(door.getPrompt()).toBe('关门')
    door.update(1 / 60)
    expect(pivot.rotation.y).toBeLessThan(0)
    expect(pivot.rotation.y).toBeGreaterThan(-1.6)

    advance(door, 2)
    expect(pivot.rotation.y).toBeCloseTo(-1.6, 3)
  })

  it('动画中途再次交互会从当前角度平滑反向', () => {
    const { pivot, door } = makeDoor()
    door.interact()
    advance(door, 0.35)
    const openingAngle = pivot.rotation.y

    door.interact()
    expect(door.getPrompt()).toBe('开门')
    advance(door, 0.5)
    expect(Math.abs(pivot.rotation.y)).toBeLessThan(Math.abs(openingAngle))
    advance(door, 1.5)
    expect(pivot.rotation.y).toBeCloseTo(0, 3)
  })

  it('返回门扇中心世界坐标并可重置为关闭状态', () => {
    const { pivot, door } = makeDoor()
    expect(door.getPosition()).toMatchObject({ x: 2, y: 1.04, z: 1.45 })

    door.interact()
    advance(door, 0.5)
    door.reset()

    expect(pivot.rotation.y).toBe(0)
    expect(door.getPrompt()).toBe('开门')
  })
})

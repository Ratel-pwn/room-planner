import { describe, expect, it } from 'vitest'
import { buildRoomObstacles } from './buildRoom'
import { findCollision } from './collision'
import { buildOfficeLayout } from './presets'
import { DEFAULT_ROOM, type FurnitureItem } from './types'

const desk: FurnitureItem = { id: 'desk', type: 'desk120', x: 0, z: -1.5, rotation: 0 }

describe('家具间精细碰撞', () => {
  it('椅子能塞进桌底，靠背被桌沿挡住', () => {
    let stopZ = -1.6
    for (let z = -0.82; z >= -1.6; z -= 0.02) {
      if (findCollision([desk], { type: 'chair', rotation: Math.PI, x: 0, z })) {
        stopZ = z
        break
      }
    }
    // 桌面边缘在 z=-1.2，椅子应越过它（座面进入桌下），但在桌面前缘附近被靠背挡住
    expect(stopZ).toBeLessThan(-1.2)
    expect(stopZ).toBeGreaterThan(-1.5)
  })

  it('长凳（无靠背）可完全塞入桌底', () => {
    expect(findCollision([desk], { type: 'bench', rotation: 0, x: 0, z: -1.5 })).toBeNull()
  })

  it('椅子侧移会被桌腿挡住', () => {
    expect(findCollision([desk], { type: 'chair', rotation: Math.PI, x: 0.42, z: -1.5 })).toBe('desk')
  })

  it('桌子压桌子会碰撞', () => {
    expect(findCollision([desk], { type: 'desk120', rotation: 0, x: 0, z: -1.5 })).toBe('desk')
  })

  it('旋转 45° 的桌子：斜角处碰撞、远离处无误判', () => {
    const d45: FurnitureItem = { id: 'd45', type: 'desk120', x: 1.2, z: -1.5, rotation: Math.PI / 4 }
    expect(findCollision([d45], { type: 'desk120', rotation: 0, x: 0.35, z: -1.5 })).toBe('d45')
    expect(findCollision([d45], { type: 'desk120', rotation: 0, x: -0.3, z: -1.5 })).toBeNull()
  })
})

describe('墙面设施防穿模', () => {
  const obs = buildRoomObstacles(DEFAULT_ROOM)

  it('障碍物数量齐全（踢脚线×4、弱电箱、空调、插座×2、门扇、门套、窗台板）', () => {
    expect(obs.length).toBe(11)
  })

  it('实心书柜被弱电箱挡住', () => {
    expect(findCollision([], { type: 'shelf', rotation: 0, x: 2.075, z: 1.65 }, 0.02, obs)).toMatch(/^wall:/)
  })

  it('桌子可罩住弱电箱（桌腿跨立、桌面越过箱顶，不穿模）', () => {
    expect(findCollision([], { type: 'desk120', rotation: 0, x: 2.075, z: 1.5 }, 0.02, obs)).toBeNull()
  })

  it('书柜被门套挡住', () => {
    expect(findCollision([], { type: 'shelf', rotation: 0, x: 3.375, z: 0.9 }, 0.02, obs)).toMatch(/^wall:/)
  })

  it('椅子推向墙时停在踢脚线前', () => {
    let stopZ: number | null = null
    for (let z = -1.0; z >= -1.8; z -= 0.005) {
      if (findCollision([], { type: 'chair', rotation: 0, x: 0, z }, 0.02, obs)) {
        stopZ = z
        break
      }
    }
    expect(stopZ).not.toBeNull()
    expect(stopZ!).toBeGreaterThan(-1.7)
  })

  it('沙发怼到窗端墙角时被窗台板挡住', () => {
    expect(findCollision([], { type: 'sofa', rotation: Math.PI / 2, x: -3.36, z: 0 }, 0.02, obs)).toMatch(/^wall:/)
  })

  it('桌子可以贴墙摆放（桌腿越过踢脚线上方）', () => {
    expect(findCollision([], { type: 'desk120', rotation: 0, x: 1.0, z: 1.5 }, 0.02, obs)).toBeNull()
  })

  it('书柜放在空调下方不碰高位空调', () => {
    expect(findCollision([], { type: 'shelf', rotation: 0, x: 2.9, z: 1.63 }, 0.02, obs)).toBeNull()
  })
})

describe('预设布局', () => {
  it('8 人办公预设零碰撞（家具互不碰撞，也不碰墙面设施）', () => {
    const obs = buildRoomObstacles(DEFAULT_ROOM)
    const items = buildOfficeLayout()
    for (const it of items) {
      const hit = findCollision(
        items,
        { type: it.type, rotation: it.rotation, x: it.x, z: it.z, excludeId: it.id },
        0.02,
        obs,
      )
      expect(hit, `${it.type} ${it.id} 不应碰撞 ${hit}`).toBeNull()
    }
  })
})

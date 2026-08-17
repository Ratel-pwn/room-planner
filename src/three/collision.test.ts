import { describe, expect, it } from 'vitest'
import { buildRoomObstacles } from './obstacles'
import * as collision from './collision'
import { buildOfficeLayout } from './presets'
import { DEFAULT_ROOM, NO_BUMPS, type CornerBump, type FurnitureItem, type RoomConfig } from './types'

const { findCollision, walkCollide } = collision

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

describe('第一人称漫游碰撞', () => {
  const obs = buildRoomObstacles(DEFAULT_ROOM)
  const items = buildOfficeLayout()

  it('漫游出生点（门口）可站立', () => {
    expect(walkCollide(items, obs, 3.125, 0.9)).toBe(false)
  })

  it('中央通道可以通行', () => {
    for (const x of [2, 1, 0, -0.9]) {
      expect(walkCollide(items, obs, x, 0), `通道 x=${x} 应可通行`).toBe(false)
    }
  })

  it('撞上工位桌会被挡住', () => {
    expect(walkCollide(items, obs, 0.06, -1.5)).toBe(true)
  })

  it('撞上椅子会被挡住', () => {
    expect(walkCollide(items, obs, 0.06, -0.82)).toBe(true)
  })

  it('撞上沙发会被挡住', () => {
    expect(walkCollide(items, obs, -2.75, -1.46)).toBe(true)
  })

  it('撞上弱电箱（凸出墙面）会被挡住', () => {
    expect(walkCollide(items, obs, 2.075, 1.72)).toBe(true)
  })
})

describe('角落结构凸起', () => {
  // 右上角(+X,+Z)设置 0.6×0.6 凸起
  const bumps: [CornerBump, CornerBump, CornerBump, CornerBump] = [
    { w: 0, d: 0 },
    { w: 0, d: 0 },
    { w: 0.6, d: 0.6 },
    { w: 0, d: 0 },
  ]
  const obs = buildRoomObstacles(DEFAULT_ROOM, bumps)

  it('凸起计入障碍物（11 + 1）', () => {
    expect(obs.length).toBe(12)
    expect(buildRoomObstacles(DEFAULT_ROOM).length).toBe(11)
  })

  it('书柜放进凸起角落会被挡住', () => {
    // 凸起占据 x∈[3.375,3.675], z∈[1.2,1.8]
    expect(findCollision([], { type: 'shelf', rotation: 0, x: 3.2, z: 1.55 }, 0.02, obs)).toMatch(/^wall:/)
  })

  it('没有凸起的角落不受影响', () => {
    const noBump = buildRoomObstacles(DEFAULT_ROOM)
    expect(findCollision([], { type: 'shelf', rotation: 0, x: 3.2, z: 1.55 }, 0.02, noBump)).toBeNull()
  })

  it('漫游撞上凸起会被挡住', () => {
    expect(walkCollide([], obs, 3.45, 1.6)).toBe(true)
    expect(walkCollide([], obs, 2.8, 1.0)).toBe(false)
  })
})

describe('跨房间家具放置目标', () => {
  const room = (id: string, x: number, rotation = 0): RoomConfig => ({
    id,
    name: id,
    x,
    z: 0,
    rotation,
    params: { ...DEFAULT_ROOM },
    bumps: NO_BUMPS.map((bump) => ({ ...bump })) as RoomConfig['bumps'],
    items: [],
  })

  it('指针进入新房间时返回新房间的局部坐标', () => {
    const api = collision as typeof collision & {
      findRoomPlacementTarget?: (
        rooms: RoomConfig[],
        worldX: number,
        worldZ: number,
      ) => { room: RoomConfig; x: number; z: number } | null
    }
    expect(api.findRoomPlacementTarget).toBeTypeOf('function')
    if (!api.findRoomPlacementTarget) return

    const target = api.findRoomPlacementTarget([room('initial', 0), room('added', 8, Math.PI / 2)], 8.25, 0.5)
    expect(target?.room.id).toBe('added')
    // THREE.Object3D.rotation.y = +90deg maps local (x, z) to world (z, -x).
    expect(target?.x).toBeCloseTo(-0.5)
    expect(target?.z).toBeCloseTo(0.25)
  })
})

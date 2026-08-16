import { describe, expect, it } from 'vitest'
import {
  InteractionSystem,
  isInteractionKeyPress,
  type InteractionTarget,
  type InteractionVector,
} from './interaction'

function makeTarget(
  id: string,
  position: InteractionVector,
  options: { maxDistance?: number; minViewDot?: number; prompt?: string } = {},
) {
  let interactions = 0
  let updates = 0
  let resets = 0
  const target: InteractionTarget = {
    id,
    maxDistance: options.maxDistance ?? 2.5,
    minViewDot: options.minViewDot ?? 0.72,
    getPosition: () => position,
    getPrompt: () => options.prompt ?? id,
    interact: () => { interactions += 1 },
    update: () => { updates += 1 },
    reset: () => { resets += 1 },
  }
  return {
    target,
    get interactions() { return interactions },
    get updates() { return updates },
    get resets() { return resets },
  }
}

describe('InteractionSystem', () => {
  it('只把非重复的 F 键按下识别为交互', () => {
    expect(isInteractionKeyPress('f', false)).toBe(true)
    expect(isInteractionKeyPress('F', false)).toBe(true)
    expect(isInteractionKeyPress('f', true)).toBe(false)
    expect(isInteractionKeyPress('e', false)).toBe(false)
  })

  it('在距离内允许宽松的视线对准', () => {
    const system = new InteractionSystem()
    const angle = (40 * Math.PI) / 180
    const door = makeTarget('door', { x: Math.cos(angle) * 2, y: 0, z: Math.sin(angle) * 2 })
    system.register(door.target)

    const focus = system.update({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 1 / 60)

    expect(focus).toEqual({ id: 'door', prompt: 'door' })
    expect(door.updates).toBe(1)
  })

  it('拒绝超出距离或位于视线后方的目标', () => {
    const system = new InteractionSystem()
    system.register(makeTarget('far', { x: 3, y: 0, z: 0 }).target)
    system.register(makeTarget('behind', { x: -1, y: 0, z: 0 }).target)

    expect(system.update({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 1 / 60)).toBeNull()
  })

  it('从多个候选目标中稳定选择视线更匹配的目标', () => {
    const system = new InteractionSystem()
    system.register(makeTarget('near-side', { x: 0.8, y: 0, z: 0.6 }).target)
    system.register(makeTarget('center', { x: 2, y: 0, z: 0 }).target)

    expect(system.update({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 1 / 60)?.id).toBe('center')
  })

  it('只触发当前焦点且清理时重置目标', () => {
    const system = new InteractionSystem()
    const door = makeTarget('door', { x: 1, y: 0, z: 0 }, { prompt: '开门' })
    system.register(door.target)
    system.update({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 1 / 60)

    expect(system.interactFocused()).toBe(true)
    expect(door.interactions).toBe(1)

    system.reset()
    expect(door.resets).toBe(1)
    expect(system.interactFocused()).toBe(false)
  })
})

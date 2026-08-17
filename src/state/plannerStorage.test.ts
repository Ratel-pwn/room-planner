import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_EYE_HEIGHT,
  loadSaved,
  makeSpace,
  normalizeEyeHeight,
  persist,
} from './plannerStorage'

describe('global immersive eye height persistence', () => {
  const values = new Map<string, string>()

  beforeEach(() => {
    values.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    })
  })

  it('defaults missing or invalid eye heights to 1.7m', () => {
    expect(DEFAULT_EYE_HEIGHT).toBe(1.7)
    expect(normalizeEyeHeight(undefined)).toBe(1.7)
    expect(normalizeEyeHeight(Number.NaN)).toBe(1.7)
    expect(normalizeEyeHeight(0.5)).toBe(1.7)
    expect(normalizeEyeHeight(3)).toBe(1.7)
  })

  it('keeps a valid configured eye height', () => {
    expect(normalizeEyeHeight(1.85)).toBe(1.85)
  })

  it('adds the default eye height when loading a v4 save', () => {
    const space = makeSpace('Space 1')
    values.set('room-planner-v4', JSON.stringify({
      spaces: [space],
      activeSpaceId: space.id,
      activeRoomId: space.rooms[0].id,
    }))

    expect(loadSaved().eyeHeight).toBe(1.7)
  })

  it('persists eye height in the current save format', () => {
    const space = makeSpace('Space 1')
    persist({
      spaces: [space],
      activeSpaceId: space.id,
      activeRoomId: space.rooms[0].id,
      eyeHeight: 1.85,
    })

    const raw = values.get('room-planner-v5')
    expect(raw).toBeDefined()
    expect(JSON.parse(raw!).eyeHeight).toBe(1.85)
  })
})

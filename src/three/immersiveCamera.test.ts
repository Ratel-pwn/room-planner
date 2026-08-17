import { describe, expect, it } from 'vitest'
import { startEyeHeightTransition, stepEyeHeightTransition } from './immersiveCamera'

describe('immersive camera eye-height transition', () => {
  it('is ready immediately when the camera is already at eye height', () => {
    expect(startEyeHeightTransition(1.7, 1.7)).toEqual({ phase: 'ready', y: 1.7, velocityY: 0 })
  })

  it('raises a low camera at constant speed', () => {
    const initial = startEyeHeightTransition(0.7, 1.7)
    const first = stepEyeHeightTransition(initial, 0.1, 1.7)
    const second = stepEyeHeightTransition(first, 0.1, 1.7)

    expect(initial.phase).toBe('rising')
    expect(first.y - initial.y).toBeCloseTo(second.y - first.y, 8)
    expect(first.velocityY).toBeGreaterThan(0)
    expect(second.velocityY).toBe(first.velocityY)
  })

  it('uses the same fixed duration for short and long rises', () => {
    const advance = (startY: number, seconds: number) => {
      let state = startEyeHeightTransition(startY, 1.7)
      for (let elapsed = 0; elapsed < seconds; elapsed += 0.1) {
        state = stepEyeHeightTransition(state, 0.1, 1.7)
      }
      return state
    }

    expect(advance(1.6, 0.5).phase).toBe('rising')
    expect(advance(-10, 0.5).phase).toBe('rising')
    expect(advance(1.6, 0.6)).toEqual({ phase: 'ready', y: 1.7, velocityY: 0 })
    expect(advance(-10, 0.6)).toEqual({ phase: 'ready', y: 1.7, velocityY: 0 })
  })

  it('accelerates a high camera downward', () => {
    const initial = startEyeHeightTransition(5, 1.7)
    const first = stepEyeHeightTransition(initial, 0.1, 1.7)
    const second = stepEyeHeightTransition(first, 0.1, 1.7)

    expect(initial.phase).toBe('falling')
    expect(first.y - second.y).toBeGreaterThan(initial.y - first.y)
    expect(second.velocityY).toBeLessThan(first.velocityY)
  })

  it('clamps both directions exactly to eye height without overshooting', () => {
    const risen = stepEyeHeightTransition(startEyeHeightTransition(1.69, 1.7), 1, 1.7)
    const fallen = stepEyeHeightTransition(startEyeHeightTransition(1.71, 1.7), 1, 1.7)

    expect(risen).toEqual({ phase: 'ready', y: 1.7, velocityY: 0 })
    expect(fallen).toEqual({ phase: 'ready', y: 1.7, velocityY: 0 })
  })
})

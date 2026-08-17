import { describe, expect, it } from 'vitest'
import { getFurnitureBarTransform, toggleFurnitureBar } from './hudControls'

describe('furniture bar visibility', () => {
  it('toggles only the collapsed UI state', () => {
    expect(toggleFurnitureBar(false)).toBe(true)
    expect(toggleFurnitureBar(true)).toBe(false)
  })

  it('folds the same bar downward instead of replacing it', () => {
    expect(getFurnitureBarTransform(false)).toBe('translateY(0)')
    expect(getFurnitureBarTransform(true)).toBe('translateY(calc(100% - 8px))')
  })
})

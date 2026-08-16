import { describe, expect, it } from 'vitest'
import { shouldShowRoomLabel } from './viewVisibility'

describe('房间标签显隐', () => {
  it('只在布局模式隐藏房间标签', () => {
    expect(shouldShowRoomLabel('layout')).toBe(false)
    expect(shouldShowRoomLabel('plan')).toBe(true)
    expect(shouldShowRoomLabel('walk')).toBe(true)
    expect(shouldShowRoomLabel('immersive')).toBe(true)
  })
})

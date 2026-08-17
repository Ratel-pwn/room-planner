import { describe, expect, it } from 'vitest'
import { shouldHandleSceneKeyboard } from './sceneInput'

describe('scene keyboard ownership', () => {
  it('only captures navigation keys in walk and immersive modes', () => {
    expect(shouldHandleSceneKeyboard('plan', null)).toBe(false)
    expect(shouldHandleSceneKeyboard('layout', null)).toBe(false)
    expect(shouldHandleSceneKeyboard('walk', null)).toBe(true)
    expect(shouldHandleSceneKeyboard('immersive', null)).toBe(true)
  })

  it('does not capture keys from editable fields or controls', () => {
    expect(shouldHandleSceneKeyboard('walk', { tagName: 'INPUT' })).toBe(false)
    expect(shouldHandleSceneKeyboard('walk', { tagName: 'TEXTAREA' })).toBe(false)
    expect(shouldHandleSceneKeyboard('walk', { tagName: 'SELECT' })).toBe(false)
    expect(shouldHandleSceneKeyboard('walk', { tagName: 'BUTTON' })).toBe(false)
    expect(shouldHandleSceneKeyboard('walk', { tagName: 'DIV', isContentEditable: true })).toBe(false)
  })
})

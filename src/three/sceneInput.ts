import type { ViewKind } from '@/features/planner/model/scene'

export interface KeyboardTarget {
  tagName?: string
  isContentEditable?: boolean
}

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'])

export function shouldHandleSceneKeyboard(mode: ViewKind, target: KeyboardTarget | null): boolean {
  if (mode !== 'walk' && mode !== 'immersive') return false
  if (!target) return true
  if (target.isContentEditable) return false
  return !INTERACTIVE_TAGS.has(target.tagName?.toUpperCase() ?? '')
}

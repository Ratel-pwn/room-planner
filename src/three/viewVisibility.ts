import type { ViewKind } from '@/features/planner/model/scene'

export function shouldShowRoomLabel(viewKind: ViewKind): boolean {
  return viewKind !== 'layout'
}

export type SceneViewKind = 'plan' | 'walk' | 'immersive' | 'layout'

export function shouldShowRoomLabel(viewKind: SceneViewKind): boolean {
  return viewKind !== 'layout'
}

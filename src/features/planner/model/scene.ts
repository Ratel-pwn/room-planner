export type ViewKind = 'plan' | 'walk' | 'immersive' | 'layout'

export interface ViewCommand {
  kind: ViewKind
  seq: number
}

export interface SelectionAnchor {
  x: number
  y: number
  cx: number
  cy: number
  visible: boolean
}

export type RoomAnchors = Record<string, { x: number; y: number; visible: boolean }>

export interface RoomParams {
  length: number // X 方向，米
  width: number // Z 方向，米
  height: number // 层高，米
  windowEnd: 'negX' | 'posX' // 窗户在哪一端
  windowWidth: number
  windowSill: number // 窗台高
  windowHeight: number
  doorWidth: number
  doorOffset: number // 门中心相对墙中心偏移（米）
  showCeiling: boolean
}

export interface FurnitureItem {
  id: string
  type: FurnitureType
  x: number // 中心 X
  z: number // 中心 Z
  rotation: number // 弧度，绕 Y
}

export type FurnitureType =
  | 'desk120'
  | 'desk160'
  | 'roundTable'
  | 'chair'
  | 'bench'
  | 'shelf'

export interface FurnitureDef {
  type: FurnitureType
  label: string
  // 包围尺寸（米），用于碰撞与地板投影
  w: number // X
  d: number // Z
  h: number
}

export const FURNITURE_DEFS: Record<FurnitureType, FurnitureDef> = {
  desk120: { type: 'desk120', label: '书桌 1.2×0.6', w: 1.2, d: 0.6, h: 0.75 },
  desk160: { type: 'desk160', label: '大桌 1.6×0.8', w: 1.6, d: 0.8, h: 0.75 },
  roundTable: { type: 'roundTable', label: '圆桌 ⌀0.9', w: 0.9, d: 0.9, h: 0.75 },
  chair: { type: 'chair', label: '椅子', w: 0.45, d: 0.45, h: 0.82 },
  bench: { type: 'bench', label: '长凳 1.0×0.35', w: 1.0, d: 0.35, h: 0.45 },
  shelf: { type: 'shelf', label: '书柜 0.9×0.3', w: 0.9, d: 0.3, h: 1.8 },
}

export const DEFAULT_ROOM: RoomParams = {
  length: 7.35,
  width: 3.6,
  height: 2.9,
  windowEnd: 'negX',
  windowWidth: 3.0,
  windowSill: 0.8,
  windowHeight: 1.8,
  doorWidth: 0.9,
  doorOffset: 0.9,
  showCeiling: false,
}

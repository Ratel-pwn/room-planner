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
  | 'sofa'
  | 'teaTable'

export interface FurnitureDef {
  type: FurnitureType
  label: string
  /** 家具栏卡片上的短名称 */
  short: string
  // 包围尺寸（米），用于碰撞与地板投影
  w: number // X
  d: number // Z
  h: number
  price?: number // 参考单价（元）
}

export const FURNITURE_DEFS: Record<FurnitureType, FurnitureDef> = {
  desk120: { type: 'desk120', label: '工位桌 1.2×0.6 · ¥67', short: '工位桌', w: 1.2, d: 0.6, h: 0.75, price: 67 },
  desk160: { type: 'desk160', label: '大桌 1.6×0.8', short: '大桌', w: 1.6, d: 0.8, h: 0.75 },
  roundTable: { type: 'roundTable', label: '圆桌 ⌀0.9', short: '圆桌', w: 0.9, d: 0.9, h: 0.75 },
  chair: { type: 'chair', label: '弓形椅 · ¥41.5', short: '弓形椅', w: 0.45, d: 0.45, h: 0.82, price: 41.5 },
  bench: { type: 'bench', label: '长凳 1.0×0.35', short: '长凳', w: 1.0, d: 0.35, h: 0.45 },
  shelf: { type: 'shelf', label: '书柜 0.9×0.3', short: '书柜', w: 0.9, d: 0.3, h: 1.8 },
  sofa: { type: 'sofa', label: '沙发床 1.8×0.62 · ¥268', short: '沙发床', w: 1.8, d: 0.62, h: 0.8, price: 268 },
  teaTable: { type: 'teaTable', label: '茶几 1.0×0.5 · ¥27', short: '茶几', w: 1.0, d: 0.5, h: 0.45, price: 27 },
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

/** 房间角落的结构凸起（柱/管道井），w 沿 X 方向、d 沿 Z 方向，0 表示无凸起 */
export interface CornerBump {
  w: number
  d: number
}

/** 四角顺序：左下(-X,-Z)、右下(+X,-Z)、右上(+X,+Z)、左上(-X,+Z) */
export type BumpCorners = [CornerBump, CornerBump, CornerBump, CornerBump]

export const NO_BUMPS: BumpCorners = [
  { w: 0, d: 0 },
  { w: 0, d: 0 },
  { w: 0, d: 0 },
  { w: 0, d: 0 },
]

/** 一个可独立配置的房间（隶属于某个空间，x/z 是房间中心在空间内的位置，米；rotation 绕 Y 轴弧度） */
export interface RoomConfig {
  id: string
  name: string
  x: number
  z: number
  rotation: number
  params: RoomParams
  bumps: BumpCorners
  items: FurnitureItem[]
}

/** 一个空间（一套房子/一层楼），包含多个房间 */
export interface SpaceConfig {
  id: string
  name: string
  rooms: RoomConfig[]
}

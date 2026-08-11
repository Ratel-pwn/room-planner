import type { FurnitureItem } from './types'

/** 采购清单（价格来自 2026-08 淘宝/京东/苏宁公开在售商品） */
export interface ShoppingEntry {
  key: string
  name: string
  spec: string
  unitPrice: number
  qty: number
  note?: string
}

export const SHOPPING_LIST: ShoppingEntry[] = [
  {
    key: 'desk120',
    name: '钢木工位桌（简易电脑桌）',
    spec: '120×60×75cm',
    unitPrice: 67,
    qty: 8,
    note: '淘宝·江苏常州店，600+人付款',
  },
  {
    key: 'chair',
    name: '弓形办公椅（网布职员椅）',
    spec: '坐高45cm',
    unitPrice: 41.5,
    qty: 8,
    note: '淘宝·河北廊坊店，2000+人付款',
  },
  {
    key: 'sofa',
    name: '三人位沙发床（可当午休床）',
    spec: '180×62×80cm',
    unitPrice: 268,
    qty: 1,
    note: '京东·品上凯迪斯，需用券；同类款苏宁 ¥299',
  },
  {
    key: 'teaTable',
    name: '简易长方形茶几',
    spec: '100×50×45cm',
    unitPrice: 27,
    qty: 1,
    note: '淘宝·山东临沂店，1000+人付款',
  },
]

export const BUDGET = 1000

export const shoppingTotal = SHOPPING_LIST.reduce((s, e) => s + e.unitPrice * e.qty, 0)

/** 8 人技术团队预设布局（房间 7.35×3.6，窗在 -X 端，门在 +X 端） */
export function buildOfficeLayout(): FurnitureItem[] {
  const items: FurnitureItem[] = []
  let n = 0
  const id = (t: string) => `${t}-preset-${n++}`

  // A 排：靠 -Z 墙，面向墙，4 个工位（靠门端留出入通道）
  const rowA = [-1.2, 0, 1.2, 2.4]
  for (const x of rowA) {
    items.push({ id: id('desk'), type: 'desk120', x, z: -1.5, rotation: 0 })
    items.push({ id: id('chair'), type: 'chair', x, z: -0.82, rotation: Math.PI }) // 面向 -Z 墙
  }
  // B 排：靠 +Z 墙，面向墙，4 个工位（整体靠窗端错开，避开弱电箱 x≈2.1）
  const rowB = [-2.85, -1.65, -0.45, 0.75]
  for (const x of rowB) {
    items.push({ id: id('desk'), type: 'desk120', x, z: 1.5, rotation: 0 })
    items.push({ id: id('chair'), type: 'chair', x, z: 0.82, rotation: 0 }) // 面向 +Z 墙
  }
  // 窗端休闲区：沙发床贴 -Z 墙，前置茶几
  items.push({ id: id('sofa'), type: 'sofa', x: -2.72, z: -1.49, rotation: 0 })
  items.push({ id: id('tea'), type: 'teaTable', x: -2.72, z: -0.88, rotation: 0 })

  return items
}

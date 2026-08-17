export function toggleFurnitureBar(collapsed: boolean): boolean {
  return !collapsed
}

export function getFurnitureBarTransform(collapsed: boolean): string {
  return collapsed ? 'translateY(calc(100% - 8px))' : 'translateY(0)'
}

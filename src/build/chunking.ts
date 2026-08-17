function hasPackage(moduleId: string, packageName: string): boolean {
  const normalized = moduleId.replaceAll('\\', '/')
  return normalized.includes(`/node_modules/${packageName}/`)
}

export function chunkNameForModuleId(moduleId: string): string | undefined {
  const normalized = moduleId.replaceAll('\\', '/')

  if (normalized.includes('/node_modules/three/examples/')) return 'three-addons'
  if (hasPackage(normalized, 'three')) return 'three-core'

  if (
    hasPackage(normalized, 'react') ||
    hasPackage(normalized, 'react-dom') ||
    hasPackage(normalized, 'react-router') ||
    hasPackage(normalized, 'scheduler')
  ) {
    return 'react-vendor'
  }

  if (normalized.includes('/node_modules/@radix-ui/')) return 'ui-vendor'
  if (hasPackage(normalized, 'lucide-react')) return 'icons'
  return undefined
}

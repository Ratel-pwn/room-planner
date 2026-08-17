import { describe, expect, it } from 'vitest'
import { chunkNameForModuleId } from './chunking'

describe('chunkNameForModuleId', () => {
  it('separates the Three renderer, core, addons, and React shell', () => {
    expect(chunkNameForModuleId('/node_modules/three/src/renderers/WebGLRenderer.js')).toBe('three-core')
    expect(chunkNameForModuleId('/node_modules/three/src/math/Vector3.js')).toBe('three-core')
    expect(chunkNameForModuleId('/node_modules/three/examples/jsm/controls/OrbitControls.js')).toBe('three-addons')
    expect(chunkNameForModuleId('/node_modules/react-dom/client.js')).toBe('react-vendor')
  })

  it('leaves application modules in their route chunk', () => {
    expect(chunkNameForModuleId('/src/pages/PlannerPage.tsx')).toBeUndefined()
  })
})

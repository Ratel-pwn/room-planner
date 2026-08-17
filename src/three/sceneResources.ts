import { Mesh, Object3D, Sprite } from 'three'

export function disposeObjectTree(root: Object3D): void {
  root.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      for (const material of materials) material.dispose()
      return
    }
    if (object instanceof Sprite) {
      object.material.map?.dispose()
      object.material.dispose()
    }
  })
}

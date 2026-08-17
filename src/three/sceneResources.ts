import * as THREE from 'three'

export function disposeObjectTree(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      for (const material of materials) material.dispose()
      return
    }
    if (object instanceof THREE.Sprite) {
      object.material.map?.dispose()
      object.material.dispose()
    }
  })
}

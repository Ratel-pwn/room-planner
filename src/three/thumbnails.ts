import * as THREE from 'three'
import { createFurnitureMesh } from './furniture'
import { FURNITURE_DEFS, type FurnitureType } from './types'

/**
 * 用与 3D 场景相同的家具模型，离屏渲染每种家具的等轴测缩略图，
 * 供底部家具栏的卡片使用。结果以 dataURL 缓存，只生成一次。
 * WebGL 不可用时对应条目为 null，卡片回退为文字展示。
 */

export type Thumbnails = Partial<Record<FurnitureType, string | null>>

let cache: Thumbnails | null = null

const SIZE = 168

export function getFurnitureThumbnails(): Thumbnails {
  if (cache) return cache
  cache = {}
  let renderer: THREE.WebGLRenderer | null = null
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(2)
    renderer.setSize(SIZE, SIZE)

    const scene = new THREE.Scene()
    scene.add(new THREE.AmbientLight(0xffffff, 0.85))
    const key = new THREE.DirectionalLight(0xfff2dd, 1.5)
    key.position.set(2.5, 4, 1.5)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xd8e4ff, 0.6)
    rim.position.set(-2, 2, -2.5)
    scene.add(rim)

    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50)
    const dir = new THREE.Vector3(1, 0.72, 1).normalize()

    for (const type of Object.keys(FURNITURE_DEFS) as FurnitureType[]) {
      const mesh = createFurnitureMesh(type)
      scene.add(mesh)

      const box = new THREE.Box3().setFromObject(mesh)
      const center = box.getCenter(new THREE.Vector3())
      const dims = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(dims.x, dims.y, dims.z)
      const half = maxDim * 0.74
      cam.left = -half
      cam.right = half
      cam.top = half
      cam.bottom = -half
      cam.position.copy(center).addScaledVector(dir, 6)
      cam.lookAt(center)
      cam.updateProjectionMatrix()

      renderer.render(scene, cam)
      cache[type] = renderer.domElement.toDataURL('image/png')

      scene.remove(mesh)
      mesh.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          const m = o.material
          if (Array.isArray(m)) m.forEach((x) => x.dispose())
          else m.dispose()
        }
      })
    }
  } catch {
    // WebGL 不可用：保持 null，UI 回退到文字
  } finally {
    if (renderer) {
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }
  return cache
}

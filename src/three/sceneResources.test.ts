import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { disposeObjectTree } from './sceneResources'

describe('scene resource disposal', () => {
  it('disposes mesh geometry and material below a group', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial()
    const geometryDispose = vi.spyOn(geometry, 'dispose')
    const materialDispose = vi.spyOn(material, 'dispose')
    const root = new THREE.Group()
    root.add(new THREE.Mesh(geometry, material))

    disposeObjectTree(root)

    expect(geometryDispose).toHaveBeenCalledOnce()
    expect(materialDispose).toHaveBeenCalledOnce()
  })

  it('disposes sprite textures and materials', () => {
    const texture = new THREE.Texture()
    const material = new THREE.SpriteMaterial({ map: texture })
    const textureDispose = vi.spyOn(texture, 'dispose')
    const materialDispose = vi.spyOn(material, 'dispose')
    const root = new THREE.Group()
    root.add(new THREE.Sprite(material))

    disposeObjectTree(root)

    expect(textureDispose).toHaveBeenCalledOnce()
    expect(materialDispose).toHaveBeenCalledOnce()
  })
})

import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import * as furniture from './furniture'
import { FURNITURE_DEFS, type FurnitureType } from './types'

const { createFurnitureMesh } = furniture

describe('shared office workstation models', () => {
  const variants = [
    { type: 'workstation2', name: '双人位桌', w: 1.2, grommets: 2 },
    { type: 'workstation4', name: '四人位桌', w: 2.4, grommets: 4 },
  ] as const

  it.each(variants)('registers $name with the dimensions shown in the reference', ({ type, name, w }) => {
    const def = FURNITURE_DEFS[type as FurnitureType]

    expect(def).toMatchObject({ short: name, w, d: 1.2, h: 0.74 })
  })

  it.each(variants)('builds $name with its frame, divider, cable tray and cable holes', ({ type, w, grommets }) => {
    const model = createFurnitureMesh(type as FurnitureType)
    const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3())
    const holes = model.getObjectsByProperty('name', 'workstation-cable-hole')

    expect(size.x).toBeCloseTo(w, 4)
    expect(size.z).toBeCloseTo(1.2, 4)
    expect(size.y).toBeGreaterThan(0.74)
    expect(model.getObjectByName('workstation-divider')).toBeTruthy()
    expect(model.getObjectByName('workstation-cable-tray')).toBeTruthy()
    expect(holes).toHaveLength(grommets)
  })

  it.each(variants)('creates a visible-on-update ghost for $name without transparent depth occlusion', ({ type }) => {
    const api = furniture as typeof furniture & {
      createFurnitureGhost?: (type: FurnitureType) => THREE.Group
      updateFurnitureGhost?: (ghost: THREE.Group, blocked: boolean) => void
    }

    expect(api.createFurnitureGhost).toBeTypeOf('function')
    expect(api.updateFurnitureGhost).toBeTypeOf('function')
    if (!api.createFurnitureGhost || !api.updateFurnitureGhost) return

    const ghost = api.createFurnitureGhost(type as FurnitureType)
    const materials: THREE.MeshStandardMaterial[] = []
    ghost.traverse((object) => {
      if (object instanceof THREE.Mesh) materials.push(object.material as THREE.MeshStandardMaterial)
    })

    expect(ghost.visible).toBe(false)
    expect(materials.length).toBeGreaterThan(0)
    expect(materials.every((material) => material.transparent && material.opacity === 0.45)).toBe(true)
    expect(materials.every((material) => material.depthWrite === false)).toBe(true)

    api.updateFurnitureGhost(ghost, true)
    expect(ghost.visible).toBe(true)
    expect(materials.every((material) => material.color.getHex() === 0xe05555)).toBe(true)
  })
})

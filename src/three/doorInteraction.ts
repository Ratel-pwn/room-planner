import * as THREE from 'three'
import type { InteractionTarget, InteractionVector } from './interaction'

const SPRING_STIFFNESS = 54
const SPRING_DAMPING = 13

/** 将现有门枢轴适配为可聚焦、可切换并带阻尼动画的交互目标。 */
export class DoorInteraction implements InteractionTarget {
  readonly maxDistance = 2.5
  readonly minViewDot = 0.72
  readonly id: string

  private readonly leaf: THREE.Object3D
  private readonly worldPosition = new THREE.Vector3()
  private readonly pivot: THREE.Group
  private readonly openAngle: number
  private progress = 0
  private target = 0
  private velocity = 0

  constructor(
    id: string,
    pivot: THREE.Group,
    openAngle: number,
  ) {
    this.id = id
    this.pivot = pivot
    this.openAngle = openAngle
    this.leaf = pivot.children[0] ?? pivot
  }

  getPosition = (): InteractionVector => this.leaf.getWorldPosition(this.worldPosition)

  getPrompt = (): string => (this.target > 0.5 ? '关门' : '开门')

  interact = (): void => {
    this.target = this.target > 0.5 ? 0 : 1
  }

  update = (dt: number): void => {
    const step = Math.min(Math.max(dt, 0), 0.05)
    if (step === 0) return

    const acceleration = (this.target - this.progress) * SPRING_STIFFNESS - this.velocity * SPRING_DAMPING
    this.velocity += acceleration * step
    this.progress += this.velocity * step

    if (this.progress <= 0) {
      this.progress = 0
      if (this.target === 0) this.velocity = 0
    } else if (this.progress >= 1) {
      this.progress = 1
      if (this.target === 1) this.velocity = 0
    } else if (Math.abs(this.target - this.progress) < 0.0001 && Math.abs(this.velocity) < 0.0001) {
      this.progress = this.target
      this.velocity = 0
    }

    this.pivot.rotation.y = this.openAngle * this.progress
  }

  reset = (): void => {
    this.progress = 0
    this.target = 0
    this.velocity = 0
    this.pivot.rotation.y = 0
  }
}

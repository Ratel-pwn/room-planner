export interface InteractionVector {
  x: number
  y: number
  z: number
}

export interface InteractionTarget {
  id: string
  maxDistance: number
  minViewDot: number
  getPosition: () => InteractionVector
  getPrompt: () => string
  interact: () => void
  update: (dt: number) => void
  reset: () => void
}

export interface InteractionFocus {
  id: string
  prompt: string
}

export function isInteractionKeyPress(key: string, repeat: boolean): boolean {
  return key.toLowerCase() === 'f' && !repeat
}

/** 管理沉浸模式中的可交互目标、当前焦点和触发行为。 */
export class InteractionSystem {
  private readonly targets = new Map<string, InteractionTarget>()
  private focused: InteractionTarget | null = null

  register(target: InteractionTarget): () => void {
    this.targets.set(target.id, target)
    return () => {
      if (this.targets.get(target.id) === target) this.targets.delete(target.id)
      if (this.focused === target) this.focused = null
    }
  }

  clear(): void {
    this.targets.clear()
    this.focused = null
  }

  reset(): void {
    for (const target of this.targets.values()) target.reset()
    this.focused = null
  }

  update(origin: InteractionVector, forward: InteractionVector, dt: number): InteractionFocus | null {
    const forwardLength = Math.hypot(forward.x, forward.y, forward.z)
    let best: InteractionTarget | null = null
    let bestScore = -Infinity

    for (const target of this.targets.values()) {
      target.update(dt)
      if (forwardLength === 0) continue

      const position = target.getPosition()
      const dx = position.x - origin.x
      const dy = position.y - origin.y
      const dz = position.z - origin.z
      const distance = Math.hypot(dx, dy, dz)
      if (distance > target.maxDistance) continue

      const viewDot = distance === 0
        ? 1
        : (dx * forward.x + dy * forward.y + dz * forward.z) / (distance * forwardLength)
      if (viewDot < target.minViewDot) continue

      const score = viewDot + (1 - distance / target.maxDistance) * 0.2
      if (score > bestScore) {
        best = target
        bestScore = score
      }
    }

    this.focused = best
    return best ? { id: best.id, prompt: best.getPrompt() } : null
  }

  interactFocused(): boolean {
    if (!this.focused) return false
    this.focused.interact()
    return true
  }
}

export type EyeHeightTransitionPhase = 'rising' | 'falling' | 'ready'

export interface EyeHeightTransition {
  phase: EyeHeightTransitionPhase
  y: number
  velocityY: number
}

const HEIGHT_EPSILON = 0.0001
const RISE_DURATION = 0.6
const FALL_GRAVITY = 12

export function startEyeHeightTransition(currentY: number, eyeHeight: number): EyeHeightTransition {
  if (Math.abs(currentY - eyeHeight) <= HEIGHT_EPSILON) {
    return { phase: 'ready', y: eyeHeight, velocityY: 0 }
  }
  const phase = currentY < eyeHeight ? 'rising' : 'falling'
  return {
    phase,
    y: currentY,
    velocityY: phase === 'rising' ? (eyeHeight - currentY) / RISE_DURATION : 0,
  }
}

export function stepEyeHeightTransition(
  state: EyeHeightTransition,
  dt: number,
  eyeHeight: number,
): EyeHeightTransition {
  if (state.phase === 'ready') return { phase: 'ready', y: eyeHeight, velocityY: 0 }

  if (state.phase === 'rising') {
    const y = state.y + state.velocityY * dt
    return y >= eyeHeight - HEIGHT_EPSILON
      ? { phase: 'ready', y: eyeHeight, velocityY: 0 }
      : { phase: 'rising', y, velocityY: state.velocityY }
  }

  const velocityY = state.velocityY - FALL_GRAVITY * dt
  const y = state.y + velocityY * dt
  return y <= eyeHeight
    ? { phase: 'ready', y: eyeHeight, velocityY: 0 }
    : { phase: 'falling', y, velocityY }
}

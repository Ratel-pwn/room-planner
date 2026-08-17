# Camera Mode Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the camera across walk/immersive switches, replace the old immersive entry sequence with directional eye-height alignment, and add a persisted global eye-height setting defaulting to 1.7m.

**Architecture:** A pure `immersiveCamera` module owns transition initialization and frame stepping. Planner state owns the global preference and passes it to the settings dialog and scene; `RoomScene` only coordinates the transition and existing immersive locomotion.

**Tech Stack:** React 19, TypeScript, Three.js, localStorage, Vitest

## Global Constraints

- Immersive to walk preserves camera position and rotation exactly.
- Walk to immersive preserves horizontal position and rotation while aligning only camera height.
- Above eye height falls with acceleration; below eye height rises at constant speed.
- Default global eye height is `1.7m` and is persisted.
- Existing collision, locomotion, jumping, pitch limits, and door interaction rules stay unchanged.
- No browser acceptance run is required.

---

### Task 1: Pure immersive height transition

**Files:**
- Create: `src/three/immersiveCamera.ts`
- Test: `src/three/immersiveCamera.test.ts`

**Interfaces:**
- Produces: `startEyeHeightTransition(currentY, eyeHeight)` and `stepEyeHeightTransition(state, dt, eyeHeight)`.
- State phases: `rising | falling | ready`, with vertical velocity used only by falling.

- [ ] Write tests proving same-height readiness, constant-speed rising, accelerated falling, and exact target clamping.
- [ ] Run `npm test -- src/three/immersiveCamera.test.ts` and verify failure because the module does not exist.
- [ ] Implement the smallest pure state machine using a fixed rise speed and gravity.
- [ ] Re-run the targeted test and verify it passes.

### Task 2: Persist global eye height and expose the setting

**Files:**
- Modify: `src/state/plannerStorage.ts`
- Create: `src/state/plannerStorage.test.ts`
- Modify: `src/state/usePlanner.ts`
- Modify: `src/components/settings/SettingsDialog.tsx`
- Modify: `src/pages/PlannerPage.tsx`

**Interfaces:**
- Produces: `DEFAULT_EYE_HEIGHT`, `normalizeEyeHeight(value)`, persisted `eyeHeight`, and planner action `setEyeHeight(value)`.
- `SettingsDialog` consumes `eyeHeight` and `setEyeHeight`; `RoomScene` consumes `eyeHeight`.

- [ ] Write tests proving missing/invalid eye height resolves to `1.7` and valid values survive load/save normalization.
- [ ] Run the storage test and verify the new API is missing.
- [ ] Upgrade the stored state with backward-compatible v4 migration and implement the planner state/action.
- [ ] Add a numeric eye-height control to global settings and pass the value through `PlannerPage`.
- [ ] Re-run the targeted storage tests.

### Task 3: Replace the immersive entry animation

**Files:**
- Modify: `src/components/RoomScene.tsx`

**Interfaces:**
- Consumes: `eyeHeight`, `startEyeHeightTransition`, and `stepEyeHeightTransition`.
- Keeps existing free immersive movement state after height alignment completes.

- [ ] Remove the door-entry timeline, door-animation state, door spawn calculations, and fixed `1.6m` camera base.
- [ ] On walk to immersive, preserve camera horizontal position and rotation, initialize height alignment, and suppress locomotion/interactions until ready.
- [ ] On immersive to walk, switch controls without replacing camera pose.
- [ ] Use `eyeHeight + jumpOffset + bobOffset` for immersive free movement.
- [ ] Run targeted tests, then `npm test` and `npm run build`.

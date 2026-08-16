# Immersive Interaction Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable immersive-mode interaction registry and implement a focusable, `F`-controlled animated door as its first target.

**Architecture:** A Three.js-domain `InteractionSystem` owns target registration, permissive view-cone selection, current focus, and triggering. A `DoorInteraction` adapts the existing `doorPivot` and owns a damped spring animation, while `RoomScene` only wires lifecycle, camera pose, input, and a React HUD prompt.

**Tech Stack:** React 19, TypeScript 5.9, Three.js 0.185, Vitest 4, Vite 7

## Global Constraints

- Enable interactions only in immersive free movement after the existing entry sequence.
- Register only doors in this version, while keeping the target protocol reusable.
- Use a maximum distance of 2.5 metres and a permissive view cone; do not require mesh ray intersection.
- Do not modify collision, passage, movement, jumping, or any other physical logic.
- Do not perform Codex-driven page acceptance; the user will assess interaction feel.

---

### Task 1: Interaction target registry and focus selection

**Files:**
- Create: `src/three/interaction.ts`
- Create: `src/three/interaction.test.ts`

**Interfaces:**
- Produces `InteractionTarget` with `id`, `maxDistance`, `minViewDot`, `getPosition()`, `getPrompt()`, `interact()`, `update(dt)`, and `reset()`.
- Produces `InteractionSystem.register()`, `clear()`, `reset()`, `update(origin, forward, dt)`, and `interactFocused()`.

- [ ] Write failing Vitest cases for in-range permissive focus, rejection by distance/direction, deterministic best-candidate selection, single focused trigger, and reset.
- [ ] Run `npm test -- src/three/interaction.test.ts`; expect failure because `interaction.ts` does not exist.
- [ ] Implement normalized dot-product focus with score `dot + (1 - distance / maxDistance) * 0.2`, updating every registered target before selection.
- [ ] Run the focused test; expect all interaction-system tests to pass.

### Task 2: Door target and damped hinge animation

**Files:**
- Create: `src/three/doorInteraction.ts`
- Create: `src/three/doorInteraction.test.ts`

**Interfaces:**
- Consumes `InteractionTarget`.
- Produces `DoorInteraction`, constructed with a `THREE.Group` pivot and signed open angle.
- Returns prompt `开门` while targeting closed and `关门` while targeting open.

- [ ] Write failing tests using a real `THREE.Group` for toggle, convergence to the signed open angle, mid-animation reversal, prompt switching, and reset to closed.
- [ ] Run `npm test -- src/three/doorInteraction.test.ts`; expect failure because the module does not exist.
- [ ] Implement spring state `{ progress, target, velocity }` with acceleration `(target - progress) * 54 - velocity * 13`, a maximum frame step of `0.05`, boundary clamping, and `pivot.rotation.y = openAngle * progress`.
- [ ] Run the focused test; expect all door-interaction tests to pass.

### Task 3: Scene lifecycle, input, and HUD integration

**Files:**
- Create: `src/components/hud/InteractionPrompt.tsx`
- Modify: `src/components/RoomScene.tsx`
- Modify: `src/components/settings/SettingsDialog.tsx`

**Interfaces:**
- `InteractionPrompt` consumes `action: string | null` and renders an `F` keycap plus action label.
- `RoomScene` owns one `InteractionSystem`, registers each rebuilt room's `doorPivot`, and publishes prompt changes only when the action text changes.

- [ ] Add the prompt component as a pointer-events-disabled HUD pill at the lower centre of the scene.
- [ ] During room-structure rebuild, clear stale targets and register each available `doorPivot` as a `DoorInteraction` with the room's existing signed open angle.
- [ ] In the render loop, call the interaction system only when mode is `immersive` and phase is `free`; otherwise hide the prompt without updating door interaction animation.
- [ ] On non-repeated `F` keydown in immersive free phase, trigger only the current focused target and prevent default only when consumed.
- [ ] Reset target state and hide the prompt when a view transition initializes, preserving the existing automatic entry animation and all physical code.
- [ ] Add `靠近并看向门按 F 开关门` to the existing immersive controls description.
- [ ] Run `npm test`; expect all old and new tests to pass.
- [ ] Run scoped ESLint on changed files and `npm run build`; expect zero scoped lint errors and a successful production build.
- [ ] Review the diff to confirm no collision or movement functions changed.

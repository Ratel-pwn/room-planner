# HUD Help and Furniture Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move operation help beside the mode switcher, add a collapsible furniture bar, and migrate furniture-only actions into a dedicated settings dialog.

**Architecture:** `PlannerPage` owns the two dialog open states. `TopBar` and `FurnitureBar` expose intent callbacks, while focused dialog components own their presentation; a small pure HUD state helper makes collapse behavior testable without a browser runtime.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Radix Dialog, Vitest, React server rendering

## Global Constraints

- Furniture collapse is UI-only and never changes placement, selection, hotkeys, furniture, or room data.
- Operation help content moves unchanged from global settings into an independent dialog.
- Office preset, shopping list, budget, and clear-furniture behavior move unchanged from room settings into furniture settings.
- Global settings keeps space management and immersive eye height.
- Room settings keeps only room structure controls.
- No browser acceptance run is required.

---

### Task 1: Testable HUD visibility and independent dialogs

**Files:**
- Create: `src/components/hud/hudControls.ts`
- Create: `src/components/hud/hudControls.test.ts`
- Create: `src/components/settings/OperationHelpDialog.tsx`
- Create: `src/components/settings/FurnitureSettingsDialog.tsx`
- Create: `src/components/settings/HudDialogs.test.tsx`

**Interfaces:**
- Produces: `toggleFurnitureBar(collapsed: boolean): boolean`.
- Produces: dialogs with controlled `open` and `onOpenChange` props; furniture settings also consumes current item count plus the existing preset and clear callbacks.

- [ ] Write failing tests proving collapse toggles only the boolean and both independent dialog titles/content render.
- [ ] Run `npm test -- src/components/hud/hudControls.test.ts src/components/settings/HudDialogs.test.tsx` and verify missing-module failures.
- [ ] Implement the pure helper and the two focused dialogs using existing content and callbacks.
- [ ] Re-run the targeted tests and verify they pass.

### Task 2: Rewire top bar and furniture bar

**Files:**
- Modify: `src/components/hud/TopBar.tsx`
- Modify: `src/components/hud/FurnitureBar.tsx`
- Create: `src/components/hud/HudBars.test.tsx`
- Modify: `src/components/settings/SettingsDialog.tsx`

**Interfaces:**
- `TopBar` consumes `onOpenHelp` and renders the help button immediately right of the mode panel.
- `FurnitureBar` consumes `onOpenSettings`, stores local collapsed state, and preserves all existing business props unchanged.

- [ ] Write server-render tests proving the top help control, furniture settings control, and initial expanded furniture cards exist without the removed build label.
- [ ] Run the test and verify it fails against the current component API/markup.
- [ ] Add the top help callback, remove help from global settings, and implement furniture bar collapse/expand plus the top-right settings button.
- [ ] Re-run the targeted tests.

### Task 3: Migrate furniture settings and connect page state

**Files:**
- Modify: `src/components/settings/RoomSettingsWindow.tsx`
- Modify: `src/pages/PlannerPage.tsx`

**Interfaces:**
- `PlannerPage` opens `OperationHelpDialog` from `TopBar` and `FurnitureSettingsDialog` from `FurnitureBar`.
- `RoomSettingsWindow` no longer consumes `itemCount`, `clearItems`, or `applyOfficePreset`.

- [ ] Remove the migrated furniture-only sections and props from room settings.
- [ ] Add `helpOpen` and `furnitureSettingsOpen` state to the page and render the two controlled dialogs with existing planner callbacks.
- [ ] Ensure keyboard shortcut guards include both new dialogs.
- [ ] Run targeted tests, full `npm test`, and `npm run build`.

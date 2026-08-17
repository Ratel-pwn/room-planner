<div align="center">
  <img src="../assets/room-planner-logo.svg" alt="Room Planner" width="760" />
  <p><strong>Plan spaces, place furniture, and step inside your design — right in the browser.</strong></p>
  <p>A local-first 3D room planner built with React and Three.js.</p>
  <p><a href="../../README.md">中文</a> · <strong>English</strong> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.it.md">Italiano</a> · <a href="README.es.md">Español</a> · <a href="README.pt.md">Português</a> · <a href="README.ar.md">العربية</a></p>
  <p><img src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" alt="React 19" /> <img src="https://img.shields.io/badge/Three.js-r185-20232a?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js r185" /> <img src="https://img.shields.io/badge/TypeScript-5.9-20232a?style=flat-square&logo=typescript&logoColor=3178c6" alt="TypeScript 5.9" /> <img src="https://img.shields.io/badge/Vite-7-20232a?style=flat-square&logo=vite&logoColor=bd8cff" alt="Vite 7" /> <img src="https://img.shields.io/badge/Vitest-4-20232a?style=flat-square&logo=vitest&logoColor=6e9f18" alt="Vitest 4" /></p>
</div>

---

## Why Room Planner

Room Planner keeps spatial planning, precise furniture placement, and immersive validation in one workflow. Arrange rooms in Layout mode, furnish them to scale in Plan mode, then inspect circulation and proportions from a human perspective in Walk or Immersive mode.

| Layout | Plan | Walk | Immersive |
|:---:|:---:|:---:|:---:|
| Organize rooms | Place furniture precisely | Explore from an angled overview | First-person collision and interaction |

## Highlights

- **Multiple spaces and rooms** — Create, move, rotate, rename, and switch between rooms and spaces.
- **Parametric rooms** — Configure dimensions, doors, windows, ceilings, and corner obstructions.
- **True-scale furniture** — 10 furniture types with ghost previews, collision checks, cross-room placement, and edge dimensions.
- **Four view modes** — Switch smoothly between Layout, Plan, Walk, and Immersive views.
- **Immersive interaction** — Approach a door, look toward it, and press `F` for an animated open/close interaction.
- **Adjustable eye height** — A global `1.7 m` default, configurable from `1–2.5 m`.
- **Local-first data** — Plans stay in browser `localStorage`; no backend is required.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The app redirects to `/planner` automatically.

```bash
npm test        # Run Vitest
npm run build   # Type-check and build for production
npm run lint    # Run ESLint
```

## Controls

| Context | Controls |
| --- | --- |
| Layout | Drag rooms; use room controls to configure, rotate, or delete; double-click to enter |
| Plan | Drag to pan; scroll to zoom; select furniture and click the floor to place it |
| Walk | `WASD` move, `Space` rise, `C` descend, `Shift` accelerate, drag to look |
| Immersive | `WASD` move, `Shift` run, `Space` jump; press `F` near a focused door |
| Global | `Esc` cancels the current action or returns to Plan mode |

## Architecture

```text
React 19 + TypeScript
├── HUD and settings ........ Tailwind CSS + Radix UI
├── 3D scene and models ..... Three.js
├── State and persistence ... React hooks + localStorage
├── Collision and cameras ... Isolated three/ domain modules
└── Regression tests ........ Vitest
```

## Data note

The current version does not upload room or furniture data. Clearing this site's browser storage also removes saved plans.

---

<div align="center"><sub>Decide at true scale. Validate from a human point of view.</sub></div>

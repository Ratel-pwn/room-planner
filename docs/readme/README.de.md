<div align="center">
  <img src="../assets/room-planner-logo.svg" alt="Room Planner" width="760" />
  <p><strong>Räume planen, Möbel platzieren und den Entwurf direkt im Browser erleben.</strong></p>
  <p>Ein lokal arbeitender 3D-Raumplaner mit React und Three.js.</p>
  <p><a href="../../README.md">中文</a> · <a href="README.en.md">English</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <strong>Deutsch</strong> · <a href="README.fr.md">Français</a> · <a href="README.it.md">Italiano</a> · <a href="README.es.md">Español</a> · <a href="README.pt.md">Português</a> · <a href="README.ar.md">العربية</a></p>
  <p><img src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" alt="React 19" /> <img src="https://img.shields.io/badge/Three.js-r185-20232a?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js r185" /> <img src="https://img.shields.io/badge/TypeScript-5.9-20232a?style=flat-square&logo=typescript&logoColor=3178c6" alt="TypeScript 5.9" /> <img src="https://img.shields.io/badge/Vite-7-20232a?style=flat-square&logo=vite&logoColor=bd8cff" alt="Vite 7" /></p>
</div>

---

## Warum Room Planner

Room Planner verbindet Raumplanung, präzise Möbelplatzierung und immersive Prüfung in einem Arbeitsablauf. Räume werden im Layout-Modus angeordnet, im Plan-Modus maßstabsgetreu möbliert und anschließend im Walk- oder Immersive-Modus aus menschlicher Perspektive geprüft.

| Layout | Plan | Begehung | Immersiv |
|:---:|:---:|:---:|:---:|
| Räume organisieren | Möbel präzise platzieren | Freie schräge Übersicht | Kollision und Interaktion in Ich-Perspektive |

## Funktionen

- **Mehrere Bereiche und Räume** — Erstellen, verschieben, drehen, umbenennen und wechseln.
- **Parametrische Räume** — Maße, Türen, Fenster, Decken und Eckvorsprünge konfigurieren.
- **Maßstabsgetreue Möbel** — 10 Möbeltypen mit Vorschau, Kollisionsprüfung, raumübergreifender Platzierung und Maßangaben.
- **Vier Ansichtsmodi** — Layout, Plan, Begehung und Immersiv wechseln nahtlos.
- **Immersive Interaktion** — Tür ansehen, sich nähern und mit `F` animiert öffnen oder schließen.
- **Einstellbare Augenhöhe** — Globaler Standard `1,7 m`, einstellbar von `1–2,5 m`.
- **Local-first** — Pläne bleiben im `localStorage` des Browsers; kein Backend erforderlich.

## Schnellstart

```bash
npm install
npm run dev
```

Die von Vite ausgegebene lokale Adresse öffnen. Die App wechselt automatisch zu `/planner`.

```bash
npm test        # Tests ausführen
npm run build   # Typprüfung und Produktions-Build
npm run lint    # ESLint ausführen
```

## Steuerung

| Modus | Steuerung |
| --- | --- |
| Layout | Räume ziehen; über die Werkzeugleiste konfigurieren, drehen oder löschen; Doppelklick zum Betreten |
| Plan | Ziehen zum Verschieben, Mausrad zum Zoomen, Möbel wählen und auf den Boden klicken |
| Begehung | `WASD`, `Space` aufwärts, `C` abwärts, `Shift` schneller, Ziehen zum Umschauen |
| Immersiv | `WASD`, `Shift` laufen, `Space` springen; nahe einer fokussierten Tür `F` drücken |
| Allgemein | `Esc` bricht die Aktion ab oder kehrt zum Plan-Modus zurück |

## Technik

`React 19` · `TypeScript 5.9` · `Three.js r185` · `Tailwind CSS 3` · `Radix UI` · `Vite 7` · `Vitest 4`

## Datenhinweis

Die aktuelle Version lädt keine Raum- oder Möbeldaten auf einen Server. Beim Löschen des Browser-Speichers dieser Website werden auch gespeicherte Pläne entfernt.

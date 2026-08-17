<div align="center">
  <img src="../assets/room-planner-logo.svg" alt="Room Planner" width="760" />
  <p><strong>Progetta gli spazi, posiziona gli arredi ed entra nel progetto direttamente dal browser.</strong></p>
  <p>Un room planner 3D local-first realizzato con React e Three.js.</p>
  <p><a href="../../README.md">中文</a> · <a href="README.en.md">English</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <strong>Italiano</strong> · <a href="README.es.md">Español</a> · <a href="README.pt.md">Português</a> · <a href="README.ar.md">العربية</a></p>
  <p><img src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" alt="React 19" /> <img src="https://img.shields.io/badge/Three.js-r185-20232a?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js r185" /> <img src="https://img.shields.io/badge/TypeScript-5.9-20232a?style=flat-square&logo=typescript&logoColor=3178c6" alt="TypeScript 5.9" /> <img src="https://img.shields.io/badge/Vite-7-20232a?style=flat-square&logo=vite&logoColor=bd8cff" alt="Vite 7" /></p>
</div>

---

## Perché Room Planner

Room Planner unisce organizzazione degli spazi, posizionamento preciso degli arredi e verifica immersiva. Organizza le stanze in modalità Layout, arredale in scala reale in modalità Pianta e controlla percorsi e proporzioni dal punto di vista umano nelle modalità Esplorazione o Immersiva.

| Layout | Pianta | Esplorazione | Immersiva |
|:---:|:---:|:---:|:---:|
| Organizza le stanze | Posiziona gli arredi con precisione | Esplora con vista obliqua dall'alto | Collisioni e interazioni in prima persona |

## Funzionalità

- **Più spazi e stanze** — Crea, sposta, ruota, rinomina e cambia ambiente.
- **Stanze parametriche** — Configura dimensioni, porte, finestre, soffitti e ingombri negli angoli.
- **Arredi in scala reale** — 10 tipi con anteprima fantasma, collisioni, posa tra stanze e quote sui bordi.
- **Quattro modalità di vista** — Layout, Pianta, Esplorazione e Immersiva.
- **Interazione immersiva** — Avvicinati a una porta, guardala e premi `F` per aprirla o chiuderla con animazione.
- **Altezza occhi regolabile** — Valore globale predefinito `1,7 m`, configurabile da `1 a 2,5 m`.
- **Local-first** — I progetti restano nel `localStorage` del browser, senza backend.

## Avvio rapido

```bash
npm install
npm run dev
```

Apri l'indirizzo locale mostrato da Vite. L'app passa automaticamente a `/planner`.

```bash
npm test        # Esegue i test
npm run build   # Controlla i tipi e crea la build
npm run lint    # Esegue ESLint
```

## Comandi

| Modalità | Comandi |
| --- | --- |
| Layout | Trascina le stanze; configura, ruota o elimina dalla barra; doppio clic per entrare |
| Pianta | Trascina per spostare, rotella per zoomare, scegli un arredo e fai clic sul pavimento |
| Esplorazione | `WASD`, `Space` sali, `C` scendi, `Shift` accelera, trascina per guardarti intorno |
| Immersiva | `WASD`, `Shift` corri, `Space` salta; `F` vicino a una porta inquadrata |
| Generale | `Esc` annulla l'azione o torna alla modalità Pianta |

## Tecnologie

`React 19` · `TypeScript 5.9` · `Three.js r185` · `Tailwind CSS 3` · `Radix UI` · `Vite 7` · `Vitest 4`

## Dati

La versione attuale non carica sul server dati relativi a stanze o arredi. La cancellazione dei dati del sito elimina anche i progetti salvati.

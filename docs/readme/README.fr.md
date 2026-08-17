<div align="center">
  <img src="../assets/room-planner-logo.svg" alt="Room Planner" width="760" />
  <p><strong>Planifiez vos espaces, placez vos meubles et entrez dans votre projet depuis le navigateur.</strong></p>
  <p>Un planificateur de pièces 3D local-first créé avec React et Three.js.</p>
  <p><a href="../../README.md">中文</a> · <a href="README.en.md">English</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <strong>Français</strong> · <a href="README.it.md">Italiano</a> · <a href="README.es.md">Español</a> · <a href="README.pt.md">Português</a> · <a href="README.ar.md">العربية</a></p>
  <p><img src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" alt="React 19" /> <img src="https://img.shields.io/badge/Three.js-r185-20232a?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js r185" /> <img src="https://img.shields.io/badge/TypeScript-5.9-20232a?style=flat-square&logo=typescript&logoColor=3178c6" alt="TypeScript 5.9" /> <img src="https://img.shields.io/badge/Vite-7-20232a?style=flat-square&logo=vite&logoColor=bd8cff" alt="Vite 7" /></p>
</div>

---

## Pourquoi Room Planner

Room Planner réunit organisation des espaces, placement précis du mobilier et validation immersive. Organisez les pièces en mode Disposition, meublez-les à l'échelle en mode Plan, puis contrôlez les circulations et les proportions à hauteur humaine en mode Visite ou Immersion.

| Disposition | Plan | Visite | Immersion |
|:---:|:---:|:---:|:---:|
| Organiser les pièces | Placer précisément le mobilier | Explorer en vue plongeante oblique | Collisions et interactions à la première personne |

## Fonctionnalités

- **Plusieurs espaces et pièces** — Créez, déplacez, faites pivoter, renommez et changez d'espace.
- **Pièces paramétriques** — Réglez dimensions, portes, fenêtres, plafonds et obstacles d'angle.
- **Mobilier à l'échelle** — 10 types avec aperçu fantôme, collisions, placement entre pièces et cotes sur les bords.
- **Quatre modes de vue** — Disposition, Plan, Visite et Immersion.
- **Interaction immersive** — Approchez-vous d'une porte, regardez-la et appuyez sur `F` pour l'ouvrir ou la fermer avec animation.
- **Hauteur des yeux réglable** — `1,7 m` par défaut, réglable globalement de `1 à 2,5 m`.
- **Local-first** — Les plans restent dans le `localStorage` du navigateur, sans serveur.

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvrez l'adresse locale indiquée par Vite. L'application redirige automatiquement vers `/planner`.

```bash
npm test        # Lancer les tests
npm run build   # Vérifier les types et construire
npm run lint    # Lancer ESLint
```

## Commandes

| Mode | Commandes |
| --- | --- |
| Disposition | Faites glisser les pièces ; configurez, pivotez ou supprimez via la barre ; double-cliquez pour entrer |
| Plan | Faites glisser pour déplacer la vue, molette pour zoomer, choisissez un meuble puis cliquez au sol |
| Visite | `WASD`, `Space` monter, `C` descendre, `Shift` accélérer, glisser pour regarder |
| Immersion | `WASD`, `Shift` courir, `Space` sauter ; `F` près d'une porte ciblée |
| Général | `Esc` annule l'action ou revient au mode Plan |

## Technologies

`React 19` · `TypeScript 5.9` · `Three.js r185` · `Tailwind CSS 3` · `Radix UI` · `Vite 7` · `Vitest 4`

## Données

La version actuelle n'envoie aucune donnée de pièce ou de mobilier vers un serveur. Effacer le stockage du site supprime également les plans enregistrés.

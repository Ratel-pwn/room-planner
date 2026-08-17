<div align="center">
  <img src="../assets/room-planner-logo.svg" alt="Room Planner" width="760" />
  <p><strong>Planeje espaços, posicione móveis e entre no seu projeto diretamente pelo navegador.</strong></p>
  <p>Um planejador 3D local-first criado com React e Three.js.</p>
  <p><a href="../../README.md">中文</a> · <a href="README.en.md">English</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.it.md">Italiano</a> · <a href="README.es.md">Español</a> · <strong>Português</strong> · <a href="README.ar.md">العربية</a></p>
  <p><img src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" alt="React 19" /> <img src="https://img.shields.io/badge/Three.js-r185-20232a?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js r185" /> <img src="https://img.shields.io/badge/TypeScript-5.9-20232a?style=flat-square&logo=typescript&logoColor=3178c6" alt="TypeScript 5.9" /> <img src="https://img.shields.io/badge/Vite-7-20232a?style=flat-square&logo=vite&logoColor=bd8cff" alt="Vite 7" /></p>
</div>

---

## Por que usar o Room Planner

O Room Planner reúne organização espacial, posicionamento preciso de móveis e validação imersiva. Organize os cômodos no modo Layout, mobilie em escala real no modo Planta e confira circulação e proporções do ponto de vista humano nos modos Passeio ou Imersivo.

| Layout | Planta | Passeio | Imersivo |
|:---:|:---:|:---:|:---:|
| Organize cômodos | Posicione móveis com precisão | Explore em vista superior inclinada | Colisão e interação em primeira pessoa |

## Recursos

- **Vários espaços e cômodos** — Crie, mova, gire, renomeie e alterne entre ambientes.
- **Cômodos paramétricos** — Configure dimensões, portas, janelas, teto e obstáculos nos cantos.
- **Móveis em escala real** — 10 tipos com prévia fantasma, colisão, posicionamento entre cômodos e cotas laterais.
- **Quatro modos de visualização** — Layout, Planta, Passeio e Imersivo.
- **Interação imersiva** — Aproxime-se de uma porta, olhe para ela e pressione `F` para abrir ou fechar com animação.
- **Altura dos olhos ajustável** — Padrão global de `1,7 m`, configurável entre `1 e 2,5 m`.
- **Local-first** — Os projetos ficam no `localStorage` do navegador, sem necessidade de backend.

## Início rápido

```bash
npm install
npm run dev
```

Abra o endereço local exibido pelo Vite. O aplicativo redireciona automaticamente para `/planner`.

```bash
npm test        # Executar testes
npm run build   # Verificar tipos e gerar build
npm run lint    # Executar ESLint
```

## Controles

| Modo | Controles |
| --- | --- |
| Layout | Arraste cômodos; configure, gire ou exclua pela barra; clique duas vezes para entrar |
| Planta | Arraste para mover, use a roda para ampliar, escolha um móvel e clique no piso |
| Passeio | `WASD`, `Space` subir, `C` descer, `Shift` acelerar, arrastar para olhar |
| Imersivo | `WASD`, `Shift` correr, `Space` pular; `F` perto de uma porta em foco |
| Geral | `Esc` cancela a ação ou volta ao modo Planta |

## Tecnologias

`React 19` · `TypeScript 5.9` · `Three.js r185` · `Tailwind CSS 3` · `Radix UI` · `Vite 7` · `Vitest 4`

## Dados

A versão atual não envia dados de cômodos ou móveis para servidores. Limpar o armazenamento deste site também remove os projetos salvos.

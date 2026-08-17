<div align="center">
  <img src="../assets/room-planner-logo.svg" alt="Room Planner" width="760" />
  <p><strong>Planifica espacios, coloca muebles y entra en tu diseño desde el navegador.</strong></p>
  <p>Un planificador de habitaciones 3D local-first creado con React y Three.js.</p>
  <p><a href="../../README.md">中文</a> · <a href="README.en.md">English</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.it.md">Italiano</a> · <strong>Español</strong> · <a href="README.pt.md">Português</a> · <a href="README.ar.md">العربية</a></p>
  <p><img src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" alt="React 19" /> <img src="https://img.shields.io/badge/Three.js-r185-20232a?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js r185" /> <img src="https://img.shields.io/badge/TypeScript-5.9-20232a?style=flat-square&logo=typescript&logoColor=3178c6" alt="TypeScript 5.9" /> <img src="https://img.shields.io/badge/Vite-7-20232a?style=flat-square&logo=vite&logoColor=bd8cff" alt="Vite 7" /></p>
</div>

---

## Por qué Room Planner

Room Planner reúne la organización espacial, la colocación precisa de muebles y la validación inmersiva. Organiza las habitaciones en modo Distribución, amuéblalas a escala real en modo Plano y comprueba recorridos y proporciones desde una perspectiva humana en los modos Recorrido o Inmersivo.

| Distribución | Plano | Recorrido | Inmersivo |
|:---:|:---:|:---:|:---:|
| Organiza habitaciones | Coloca muebles con precisión | Explora con una vista cenital oblicua | Colisiones e interacción en primera persona |

## Funciones

- **Múltiples espacios y habitaciones** — Crea, mueve, gira, renombra y cambia de espacio.
- **Habitaciones paramétricas** — Configura dimensiones, puertas, ventanas, techos y obstáculos de esquina.
- **Muebles a escala real** — 10 tipos con previsualización fantasma, colisiones, colocación entre habitaciones y cotas laterales.
- **Cuatro modos de vista** — Distribución, Plano, Recorrido e Inmersivo.
- **Interacción inmersiva** — Acércate a una puerta, mírala y pulsa `F` para abrirla o cerrarla con animación.
- **Altura de ojos ajustable** — Valor global predeterminado de `1,7 m`, configurable entre `1 y 2,5 m`.
- **Local-first** — Los planos permanecen en el `localStorage` del navegador, sin backend.

## Inicio rápido

```bash
npm install
npm run dev
```

Abre la dirección local que muestra Vite. La aplicación redirige automáticamente a `/planner`.

```bash
npm test        # Ejecutar pruebas
npm run build   # Comprobar tipos y compilar
npm run lint    # Ejecutar ESLint
```

## Controles

| Modo | Controles |
| --- | --- |
| Distribución | Arrastra habitaciones; configura, gira o elimina desde la barra; doble clic para entrar |
| Plano | Arrastra para desplazar, rueda para ampliar, elige un mueble y haz clic en el suelo |
| Recorrido | `WASD`, `Space` subir, `C` bajar, `Shift` acelerar, arrastrar para mirar |
| Inmersivo | `WASD`, `Shift` correr, `Space` saltar; `F` cerca de una puerta enfocada |
| General | `Esc` cancela la acción o vuelve al modo Plano |

## Tecnologías

`React 19` · `TypeScript 5.9` · `Three.js r185` · `Tailwind CSS 3` · `Radix UI` · `Vite 7` · `Vitest 4`

## Datos

La versión actual no envía datos de habitaciones ni muebles a ningún servidor. Al borrar el almacenamiento del sitio también se eliminan los planos guardados.

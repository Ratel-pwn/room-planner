<div align="center">
  <img src="docs/assets/room-planner-logo.svg" alt="Room Planner" width="760" />

  <p><strong>在浏览器中规划空间、布置家具，并以第一人称走进设计。</strong></p>
  <p>一个基于 React 与 Three.js 的本地优先 3D 房间规划器。</p>

  <p>
    <a href="README.md">中文</a> ·
    <a href="docs/readme/README.en.md">English</a> ·
    <a href="docs/readme/README.ja.md">日本語</a> ·
    <a href="docs/readme/README.ko.md">한국어</a> ·
    <a href="docs/readme/README.de.md">Deutsch</a> ·
    <a href="docs/readme/README.fr.md">Français</a> ·
    <a href="docs/readme/README.it.md">Italiano</a> ·
    <a href="docs/readme/README.es.md">Español</a> ·
    <a href="docs/readme/README.pt.md">Português</a> ·
    <a href="docs/readme/README.ar.md">العربية</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" alt="React 19" />
    <img src="https://img.shields.io/badge/Three.js-r185-20232a?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js r185" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-20232a?style=flat-square&logo=typescript&logoColor=3178c6" alt="TypeScript 5.9" />
    <img src="https://img.shields.io/badge/Vite-7-20232a?style=flat-square&logo=vite&logoColor=bd8cff" alt="Vite 7" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3-20232a?style=flat-square&logo=tailwindcss&logoColor=38bdf8" alt="Tailwind CSS 3" />
    <img src="https://img.shields.io/badge/Vitest-4-20232a?style=flat-square&logo=vitest&logoColor=6e9f18" alt="Vitest 4" />
  </p>
</div>

---

## 为什么是 Room Planner

Room Planner 把空间规划、精确摆放与沉浸体验放在同一个工作流里。先在布局模式组织多个房间，再用平面模式按真实尺寸布置家具，最后切换到漫游或沉浸模式，从人的视角检查动线与尺度。

| 布局 | 平面 | 漫游 | 沉浸 |
|:---:|:---:|:---:|:---:|
| 组织空间与房间 | 精确摆放家具 | 上帝视角，自由观察 | 第一人称碰撞与交互 |

## 功能亮点

- **多空间、多房间** — 新增、移动、旋转、重命名房间，并在不同空间之间切换。
- **参数化房间** — 调整长、宽、高、门窗、吊顶与角落结构凸起。
- **真实尺度家具** — 10 类家具使用米制尺寸，支持幽灵预览、碰撞检测、跨房间摆放与边缘尺寸标注。
- **四种视图模式** — 空间布局、平面编辑、自由漫游和沉浸体验无缝切换。
- **沉浸交互** — 在宽松视线判定下靠近门并按 `F`，播放拟真的开关门动画。
- **可调眼高** — 全局沉浸眼高默认 `1.7 m`，可在 `1–2.5 m` 范围内设置。
- **本地优先** — 规划数据保存在浏览器 `localStorage`，无需后端服务。

## 快速开始

```bash
npm install
npm run dev
```

打开 Vite 输出的本地地址，应用会自动进入 `/planner`。

```bash
npm test        # 运行 Vitest 测试
npm run build   # TypeScript 检查并构建生产版本
npm run lint    # ESLint 检查
```

## 操作速览

| 场景 | 操作 |
| --- | --- |
| 布局模式 | 拖动房间；使用房间悬浮栏设置、旋转或删除；双击进入房间 |
| 平面模式 | 左键拖动画布；滚轮缩放；选择家具后点击地面摆放 |
| 漫游模式 | `WASD` 移动，`Space` 上升，`C` 下降，`Shift` 加速，拖动环视 |
| 沉浸模式 | `WASD` 移动，`Shift` 跑，`Space` 跳；靠近并看向门时按 `F` 交互 |
| 通用 | `Esc` 取消当前操作或返回平面模式 |

## 技术架构

```text
React 19 + TypeScript
├── HUD 与设置界面 ........ Tailwind CSS + Radix UI
├── 3D 场景与模型 ......... Three.js
├── 规划状态与持久化 ....... React hooks + localStorage
├── 碰撞、相机与交互 ....... 独立 three/ 领域模块
└── 回归测试 ............... Vitest
```

## 项目结构

```text
src/
├── components/       3D 场景、HUD 与设置窗口
├── pages/            规划器页面编排
├── state/            空间状态、迁移与本地持久化
└── three/            房间建模、家具、碰撞、相机与交互系统
```

## 数据说明

当前版本不会把房间或家具数据上传到服务器。清除当前站点的浏览器存储会同时清除规划数据。

---

<div align="center">
  <sub>用真实尺度做决定，用人的视角验证空间。</sub>
</div>

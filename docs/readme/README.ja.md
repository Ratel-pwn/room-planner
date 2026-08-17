<div align="center">
  <img src="../assets/room-planner-logo.svg" alt="Room Planner" width="760" />
  <p><strong>ブラウザで空間を計画し、家具を配置し、そのデザインの中を歩く。</strong></p>
  <p>React と Three.js で構築された、ローカルファーストの 3D ルームプランナーです。</p>
  <p><a href="../../README.md">中文</a> · <a href="README.en.md">English</a> · <strong>日本語</strong> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.it.md">Italiano</a> · <a href="README.es.md">Español</a> · <a href="README.pt.md">Português</a> · <a href="README.ar.md">العربية</a></p>
  <p><img src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" alt="React 19" /> <img src="https://img.shields.io/badge/Three.js-r185-20232a?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js r185" /> <img src="https://img.shields.io/badge/TypeScript-5.9-20232a?style=flat-square&logo=typescript&logoColor=3178c6" alt="TypeScript 5.9" /> <img src="https://img.shields.io/badge/Vite-7-20232a?style=flat-square&logo=vite&logoColor=bd8cff" alt="Vite 7" /></p>
</div>

---

## Room Planner について

空間構成、正確な家具配置、没入型の確認を一つのワークフローにまとめます。レイアウトモードで部屋を構成し、平面モードで実寸家具を配置した後、ウォーク／没入モードで動線とスケールを人の視点から確認できます。

| レイアウト | 平面 | ウォーク | 没入 |
|:---:|:---:|:---:|:---:|
| 部屋を構成 | 家具を正確に配置 | 斜め俯瞰で自由に観察 | 一人称の衝突・操作 |

## 主な機能

- **複数の空間と部屋** — 作成、移動、回転、名称変更、切り替えに対応。
- **パラメトリックな部屋** — 寸法、ドア、窓、天井、角の構造物を設定。
- **実寸家具** — 10 種類の家具、ゴーストプレビュー、衝突判定、部屋間配置、辺寸法表示。
- **4 つの表示モード** — レイアウト、平面、ウォーク、没入をシームレスに切り替え。
- **没入インタラクション** — ドアに近づいて視線を向け、`F` で開閉アニメーション。
- **視点の高さ** — 既定値 `1.7 m`、`1–2.5 m` の範囲で全体設定。
- **ローカルファースト** — データはブラウザの `localStorage` に保存。

## クイックスタート

```bash
npm install
npm run dev
```

Vite が表示するローカル URL を開いてください。アプリは自動的に `/planner` へ移動します。

```bash
npm test        # テスト
npm run build   # 型チェックと本番ビルド
npm run lint    # ESLint
```

## 操作

| モード | 操作 |
| --- | --- |
| レイアウト | 部屋をドラッグ。フローティングバーで設定・回転・削除。ダブルクリックで入室 |
| 平面 | ドラッグで移動、ホイールで拡大縮小。家具を選び床をクリックして配置 |
| ウォーク | `WASD` 移動、`Space` 上昇、`C` 下降、`Shift` 加速、ドラッグで視点操作 |
| 没入 | `WASD` 移動、`Shift` 走る、`Space` ジャンプ、ドア付近で `F` |
| 共通 | `Esc` で操作を取り消すか平面モードへ戻る |

## 技術構成

`React 19` · `TypeScript 5.9` · `Three.js r185` · `Tailwind CSS 3` · `Radix UI` · `Vite 7` · `Vitest 4`

## データについて

現在のバージョンは部屋や家具のデータをサーバーへ送信しません。サイトのブラウザストレージを消去すると、保存したプランも削除されます。

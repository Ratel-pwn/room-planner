<div align="center">
  <img src="../assets/room-planner-logo.svg" alt="Room Planner" width="760" />
  <p><strong>브라우저에서 공간을 설계하고, 가구를 배치하고, 직접 걸어보세요.</strong></p>
  <p>React와 Three.js로 만든 로컬 우선 3D 룸 플래너입니다.</p>
  <p><a href="../../README.md">中文</a> · <a href="README.en.md">English</a> · <a href="README.ja.md">日本語</a> · <strong>한국어</strong> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.it.md">Italiano</a> · <a href="README.es.md">Español</a> · <a href="README.pt.md">Português</a> · <a href="README.ar.md">العربية</a></p>
  <p><img src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" alt="React 19" /> <img src="https://img.shields.io/badge/Three.js-r185-20232a?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js r185" /> <img src="https://img.shields.io/badge/TypeScript-5.9-20232a?style=flat-square&logo=typescript&logoColor=3178c6" alt="TypeScript 5.9" /> <img src="https://img.shields.io/badge/Vite-7-20232a?style=flat-square&logo=vite&logoColor=bd8cff" alt="Vite 7" /></p>
</div>

---

## Room Planner 소개

공간 구성, 정확한 가구 배치, 몰입형 검토를 하나의 흐름으로 연결합니다. 레이아웃 모드에서 방을 구성하고 평면 모드에서 실제 크기로 가구를 배치한 뒤, 워크 또는 몰입 모드에서 사람의 시점으로 동선과 비율을 확인할 수 있습니다.

| 레이아웃 | 평면 | 워크 | 몰입 |
|:---:|:---:|:---:|:---:|
| 공간과 방 구성 | 가구 정밀 배치 | 사선 조감 시점 탐색 | 1인칭 충돌과 상호작용 |

## 주요 기능

- **여러 공간과 방** — 생성, 이동, 회전, 이름 변경, 전환.
- **매개변수형 방** — 크기, 문, 창, 천장, 모서리 구조물 설정.
- **실제 크기 가구** — 10종 가구, 고스트 미리보기, 충돌 검사, 방 간 배치, 변 길이 표시.
- **네 가지 보기 모드** — 레이아웃, 평면, 워크, 몰입 모드를 자연스럽게 전환.
- **몰입형 상호작용** — 문에 접근해 바라본 후 `F`를 눌러 애니메이션으로 열고 닫기.
- **눈높이 설정** — 기본 `1.7 m`, 전역 `1–2.5 m` 설정.
- **로컬 우선** — 데이터는 브라우저 `localStorage`에 저장되며 백엔드가 필요하지 않음.

## 빠른 시작

```bash
npm install
npm run dev
```

Vite가 출력한 로컬 주소를 여세요. 앱은 자동으로 `/planner`로 이동합니다.

```bash
npm test        # 테스트 실행
npm run build   # 타입 검사 및 프로덕션 빌드
npm run lint    # ESLint 실행
```

## 조작법

| 모드 | 조작 |
| --- | --- |
| 레이아웃 | 방 드래그, 도구 모음에서 설정·회전·삭제, 더블 클릭으로 입장 |
| 평면 | 드래그로 이동, 휠로 확대/축소, 가구 선택 후 바닥 클릭으로 배치 |
| 워크 | `WASD` 이동, `Space` 상승, `C` 하강, `Shift` 가속, 드래그로 시점 전환 |
| 몰입 | `WASD` 이동, `Shift` 달리기, `Space` 점프, 문 근처에서 `F` |
| 공통 | `Esc`로 현재 작업 취소 또는 평면 모드 복귀 |

## 기술 스택

`React 19` · `TypeScript 5.9` · `Three.js r185` · `Tailwind CSS 3` · `Radix UI` · `Vite 7` · `Vitest 4`

## 데이터 안내

현재 버전은 방이나 가구 데이터를 서버에 업로드하지 않습니다. 사이트의 브라우저 저장소를 지우면 저장된 플랜도 삭제됩니다.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**Cnalytics VD** — Willis 안면 비율법 기반 VD(Vertical Dimension) 평가 PWA 앱.
치과 임상에서 환자 얼굴을 촬영하고 MediaPipe Face Landmarker로 랜드마크를 검출하여 Willis 비율(동공~비하점 / 비하점~턱끝)을 계산, VD 상태를 판정한다.

## 개발 명령어

```bash
npm run dev      # 개발 서버 (Turbopack)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

테스트 프레임워크는 아직 설정되지 않음.

## 기술 스택

- **Next.js 16** + React 19, TypeScript, App Router
- **Tailwind CSS v4** + shadcn/ui (new-york 스타일, `components.json`)
- **Zustand** — 상태관리 (`src/lib/store/`)
- **React Hook Form + Zod** — 폼 검증
- **MediaPipe Face Landmarker** (`@mediapipe/tasks-vision`) — 얼굴 랜드마크 검출
- **IndexedDB** (`idb`) — 오프라인 로컬 저장 (`src/lib/db/`)
- **PWA** (`@ducanh2912/next-pwa`) — 개발 모드에서 비활성화

## 아키텍처

### 4단계 평가 워크플로우 (`/assess`)

`useAssessmentStore`가 세션 상태(currentStep 1~4)를 관리하며 각 단계별 컴포넌트가 렌더링됨:
1. **StepInitialPhoto** — 초기 사진 촬영 + Willis 비율 측정
2. **StepVDDetector** — VD Detector 장착 (교합 높이 조절)
3. **StepVerifyPhoto** — 검증 사진 촬영 + 전후 비교
4. **StepImpression** — 인상채득 + 최종 기록 저장

### Willis 비율 로직 (`src/lib/willis/`)

- `calculateRatio.ts` — 비율 계산, 동공간선 기울기 검증 (±5° 허용)
- `assessVD.ts` — 판정 (0.85 ≤ ratio ≤ 1.15 (1:1 ± 15%) → NORMAL, 그 외 → LOWER)

### MediaPipe 통합 (`src/lib/mediapipe/`)

- `landmarkIndices.ts` — Face Landmarker 핵심 인덱스 매핑 (홍채 468/473, 비하점 2, 턱끝 152 등)
- `types.ts` — 랜드마크 타입 정의

### 데이터 계층

- **Zustand stores** (`src/lib/store/`) — assessmentStore (평가 세션), patientStore (환자 정보)
- **IndexedDB** (`src/lib/db/`) — patients, assessments 스토어로 오프라인 영속 저장

### 레이아웃

- `AppShell` — `/assess` 경로에서는 네비게이션 숨김, 그 외에는 Sidebar(데스크톱) + BottomNav(모바일) 표시
- Liquid Glass 디자인 시스템 — `globals.css`에 `.glass`, `.shadow-glass` 등 유틸리티 정의
- 커스텀 색상은 oklch 기반 Cnalytics 브랜드 팔레트 (`--color-primary-50` ~ `--color-primary-900`)

### 경로 구조

- `/` — 홈 (평가 안내)
- `/assess` — 4단계 평가 워크플로우
- `/history` — 평가 이력, `/history/[id]` — 상세
- `/settings` — 설정

## 주요 규칙

- 경로 별칭: `@/*` → `./src/*`
- shadcn/ui 컴포넌트: `npx shadcn@latest add <component>`
- `lang="ko"` 설정 — 한국어 앱

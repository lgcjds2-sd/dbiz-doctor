# D-Biz Doctor

시스템 다이내믹스 기반 AI 경영진단 웹앱 (MVP)

React + TypeScript + Tailwind CSS + Supabase

## 1. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com) 에서 새 프로젝트를 생성합니다.
2. Supabase Dashboard → SQL Editor에서 `supabase/schema.sql` 내용을 실행합니다.
3. 이어서 `supabase/seed.sql` 내용을 실행합니다. (9개 진단영역 + 27개 설문문항 + 인과관계 샘플 삽입)
4. Project Settings → API 에서 `Project URL`과 `anon public key`를 확인합니다.

> MVP는 로그인 없이 anon key로 동작합니다. Supabase 신규 테이블은 기본적으로 RLS가
> 비활성 상태이므로 별도 정책 없이 CRUD가 가능합니다. 운영 배포 전에는 반드시
> Supabase Auth 연동 후 RLS 정책을 추가하세요.

## 2. 환경변수 설정

`.env.example`을 복사해 `.env` 파일을 만들고 값을 채웁니다.

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. 실행

```bash
npm install
npm run dev
```

## 4. 핵심 화면 (MVP 구현 완료)

| 경로 | 설명 |
| --- | --- |
| `/` | 랜딩 페이지, 핵심 프로세스 10단계 소개 |
| `/companies/new` | 기업등록 (STEP 1) |
| `/assessments/:id/survey` | Quick Diagnosis 설문 (STEP 2) — 27문항, Likert 5점, 진행률 표시 |
| `/assessments/:id/results` | 진단 결과 대시보드 (STEP 3~4) — 종합점수, Radar/Bar Chart, 취약/강점 TOP 3, 핵심 메시지 |
| `/assessments` | 진단이력 |
| `/admin` | 관리자 (진단영역/설문문항/기업/결과/보고서/인과관계 관리) |

## 5. AI 심층분석 파이프라인 (STEP 5~9) 배포

취약영역 TOP3와 27개 응답을 근거로 Claude가 문제구조 분석 → 심층질문 →
인과순환지도 → 레버리지 포인트 → 90일 실행계획을 한 번에 생성하는 Supabase
Edge Function이 `supabase/functions/analyze-system-dynamics`에 구현되어 있습니다.

### 배포 방법

```bash
# Supabase CLI 설치 후 (npm install -g supabase 또는 scoop/brew)
supabase login
supabase link --project-ref <your-project-ref>

# Edge Function 배포
supabase functions deploy analyze-system-dynamics

# Anthropic API 키를 시크릿으로 등록 (console.anthropic.com 에서 발급)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`는 Edge Function 런타임에 자동으로
주입되므로 별도 설정이 필요 없습니다.

배포 후 진단 결과 대시보드 → "AI 심층질문 · 문제구조 분석" 카드로 들어가
**AI 분석 실행** 버튼을 누르면 아래 5개 테이블에 결과가 저장되고, 각 화면에
자동으로 반영됩니다.

| 단계 | 화면 경로 | 테이블 |
| --- | --- | --- |
| STEP 5~6. 시스템 다이내믹스 분석 · 심층질문 | `/assessments/:id/deep-dive` | `system_dynamics_analyses`, `deep_questions` |
| STEP 7. 인과순환지도 (SVG 시각화) | `/assessments/:id/causal-loop` | `causal_loop_diagrams` |
| STEP 8. 레버리지 포인트 (Impact×Feasibility 매트릭스) | `/assessments/:id/leverage-points` | `leverage_points` |
| STEP 9. 90일 실행계획 (칸반 보드) | `/assessments/:id/action-plan` | `action_plans` |
| STEP 10. 경영진 보고서 | `/assessments/:id/report` | 위 테이블 통합 (인쇄/PDF 지원) |

업종별/공통 인과관계 지식베이스는 `causal_relationships` 테이블 및
`/admin/causal-relationships` 화면에서 관리하며, AI 분석 시 프롬프트에 참고
자료로 함께 전달됩니다.

> Edge Function을 아직 배포하지 않았거나 `ANTHROPIC_API_KEY`가 없어도 위 화면들은
> 빈 상태(EmptyState)로 정상 동작합니다 — 배포 후 버튼만 누르면 됩니다.

## 6. 폴더 구조

```
src/
  components/       공용 UI, 차트, 레이아웃 컴포넌트
  data/             셀렉트 옵션, Likert 라벨 등 정적 데이터
  lib/supabase.ts   Supabase 클라이언트
  pages/            라우트별 페이지 (admin/, stages/ 포함)
  services/         Supabase 쿼리 및 점수 계산 로직
  types/database.ts 테이블 및 향후 AI 분석 JSON 구조 타입 정의
supabase/
  schema.sql        전체 테이블 DDL
  seed.sql          9개 영역 + 27개 문항 + 인과관계 샘플
  functions/
    analyze-system-dynamics/  STEP 5~9 AI 분석 Edge Function (Deno)
```

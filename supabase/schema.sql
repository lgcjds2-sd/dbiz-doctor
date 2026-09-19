-- SD-Biz Doctor 데이터베이스 스키마
-- Supabase SQL Editor에서 순서대로 실행하세요: schema.sql -> seed.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. 핵심 테이블 (MVP)
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    company_name TEXT NOT NULL,
    industry TEXT,
    sub_industry TEXT,
    revenue_range TEXT,
    employee_range TEXT,
    growth_stage TEXT,
    main_products TEXT,
    key_challenge TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,
    assessment_type TEXT DEFAULT 'quick',
    status TEXT DEFAULT 'in_progress',
    overall_score NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER
);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL
        REFERENCES categories(id),
    code TEXT UNIQUE NOT NULL,
    question_text TEXT NOT NULL,
    diagnosis_dimension TEXT,
    question_type TEXT DEFAULT 'likert',
    weight NUMERIC(5,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER
);

CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,
    question_id INTEGER NOT NULL
        REFERENCES questions(id),
    score INTEGER CHECK (score BETWEEN 1 AND 5),
    answer_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (assessment_id, question_id)
);

CREATE TABLE IF NOT EXISTS diagnosis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,
    category_id INTEGER NOT NULL
        REFERENCES categories(id),
    category_score NUMERIC(5,2),
    normalized_score NUMERIC(5,2),
    rank INTEGER,
    severity_level TEXT,
    ai_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (assessment_id, category_id)
);

-- ============================================================
-- 2. 인과관계 지식베이스 (업종 공통/업종별 인과관계 사전)
-- ============================================================

CREATE TABLE IF NOT EXISTS causal_relationships (
    id SERIAL PRIMARY KEY,
    source_dimension TEXT NOT NULL,
    target_dimension TEXT NOT NULL,
    polarity TEXT CHECK (polarity IN ('+', '-')),
    delay_exists BOOLEAN DEFAULT FALSE,
    relationship_description TEXT,
    confidence_score NUMERIC(5,2),
    industry TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. 다음 단계 연동용 테이블 (시스템 다이내믹스 심층분석)
--    MVP 단계에서는 비어 있으며, 화면/메뉴/타입만 미리 연결한다.
-- ============================================================

-- 5. AI 시스템 다이내믹스 분석 결과 (진단 1건당 1건)
CREATE TABLE IF NOT EXISTS system_dynamics_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,
    problem_statement TEXT,
    key_variables JSONB DEFAULT '[]'::JSONB,
    causal_relationships JSONB DEFAULT '[]'::JSONB,
    reinforcing_loops JSONB DEFAULT '[]'::JSONB,
    balancing_loops JSONB DEFAULT '[]'::JSONB,
    system_archetype_candidates JSONB DEFAULT '[]'::JSONB,
    leverage_points JSONB DEFAULT '[]'::JSONB,
    management_implications TEXT,
    -- 9개 영역 각각에 대한 진단 코멘트: [{category_code, narrative}]
    category_reports JSONB DEFAULT '[]'::JSONB,
    -- 구조화된 문제구조 분석: {overview, parts:[{title, related_categories, narrative}], synthesis}
    problem_structure JSONB DEFAULT '{}'::JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (assessment_id)
);

-- 6. AI 심층질문 및 응답
CREATE TABLE IF NOT EXISTS deep_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    purpose TEXT,
    related_variable TEXT,
    answer_text TEXT,
    display_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 인과순환지도 (노드/엣지/루프를 JSON으로 저장)
CREATE TABLE IF NOT EXISTS causal_loop_diagrams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,
    nodes JSONB DEFAULT '[]'::JSONB,
    edges JSONB DEFAULT '[]'::JSONB,
    reinforcing_loops JSONB DEFAULT '[]'::JSONB,
    balancing_loops JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (assessment_id)
);

-- 8. 레버리지 포인트
CREATE TABLE IF NOT EXISTS leverage_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,
    leverage_point TEXT NOT NULL,
    related_problem TEXT,
    expected_impact TEXT,
    implementation_difficulty TEXT,
    time_to_effect TEXT,
    priority_score NUMERIC(5,2),
    recommended_action TEXT,
    -- 이 레버리지 포인트와 관련된 9개 진단영역 코드 배열, 예: ["MS","OP"]
    related_categories JSONB DEFAULT '[]'::JSONB,
    supplementary_explanation TEXT,
    display_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 90일 실행계획
CREATE TABLE IF NOT EXISTS action_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,
    leverage_point_id UUID REFERENCES leverage_points(id),
    phase TEXT CHECK (phase IN ('0-30', '31-60', '61-90')),
    action TEXT NOT NULL,
    -- 이 과제를 왜/어떤 맥락에서 수행하는지에 대한 서술형 설명
    context TEXT,
    owner TEXT,
    kpi TEXT,
    target TEXT,
    due_date DATE,
    expected_effect TEXT,
    display_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_assessments_company_id ON assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_responses_assessment_id ON responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_results_assessment_id ON diagnosis_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_deep_questions_assessment_id ON deep_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_leverage_points_assessment_id ON leverage_points(assessment_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_assessment_id ON action_plans(assessment_id);

-- ============================================================
-- 5. RLS 안내
-- ============================================================
-- MVP는 로그인 없이 anon key로 동작합니다. Supabase 신규 테이블은 기본적으로
-- RLS가 비활성 상태이므로 별도 정책 없이 anon key로 CRUD가 가능합니다.
-- 운영 배포 전에는 반드시 auth 연동 후 RLS 정책을 추가하세요.

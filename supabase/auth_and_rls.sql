-- SD-Biz Doctor: 이메일/비밀번호 로그인 + 사용자별 데이터 격리(RLS)
--
-- 이 스크립트는 schema.sql / seed.sql 실행 이후, 상업 서비스 전환 시 1회 실행합니다.
-- 실행 후 반드시 아래를 진행하세요:
--   1) 앱에서 회원가입으로 본인 계정을 생성
--   2) 아래 "관리자 지정" 섹션의 UPDATE 문으로 본인 계정을 관리자로 승격

-- ============================================================
-- 1. profiles 테이블 (auth.users와 1:1, 관리자 여부 저장)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 회원가입 시 자동으로 profiles 행 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 관리자 여부를 재사용하기 위한 헬퍼 함수
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT COALESCE((SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()), FALSE);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_self_or_admin_select" ON profiles;
CREATE POLICY "profiles_self_or_admin_select" ON profiles
    FOR SELECT USING (id = auth.uid() OR is_admin());

-- ============================================================
-- 2. 소유권 기반 RLS: companies / assessments / 하위 테이블
-- ============================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "companies_owner_or_admin" ON companies;
CREATE POLICY "companies_owner_or_admin" ON companies
    FOR ALL USING (user_id = auth.uid() OR is_admin())
    WITH CHECK (user_id = auth.uid() OR is_admin());

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assessments_owner_or_admin" ON assessments;
CREATE POLICY "assessments_owner_or_admin" ON assessments
    FOR ALL USING (
        is_admin() OR EXISTS (
            SELECT 1 FROM companies c
            WHERE c.id = assessments.company_id AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        is_admin() OR EXISTS (
            SELECT 1 FROM companies c
            WHERE c.id = assessments.company_id AND c.user_id = auth.uid()
        )
    );

-- assessment_id를 통해 소유권을 판별하는 테이블들에 공통 적용
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'responses', 'diagnosis_results', 'system_dynamics_analyses',
        'deep_questions', 'causal_loop_diagrams', 'leverage_points', 'action_plans'
    ]
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%I_owner_or_admin" ON %I', tbl, tbl);
        EXECUTE format($f$
            CREATE POLICY "%I_owner_or_admin" ON %I
                FOR ALL USING (
                    is_admin() OR EXISTS (
                        SELECT 1 FROM assessments a
                        JOIN companies c ON c.id = a.company_id
                        WHERE a.id = %I.assessment_id AND c.user_id = auth.uid()
                    )
                )
                WITH CHECK (
                    is_admin() OR EXISTS (
                        SELECT 1 FROM assessments a
                        JOIN companies c ON c.id = a.company_id
                        WHERE a.id = %I.assessment_id AND c.user_id = auth.uid()
                    )
                )
        $f$, tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- ============================================================
-- 3. 공통 참조 데이터: 조회는 모두 허용, 쓰기는 관리자만
-- ============================================================

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['categories', 'questions', 'causal_relationships']
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%I_read_all" ON %I', tbl, tbl);
        EXECUTE format('CREATE POLICY "%I_read_all" ON %I FOR SELECT USING (true)', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%I_write_admin" ON %I', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "%I_write_admin" ON %I FOR ALL USING (is_admin()) WITH CHECK (is_admin())',
            tbl, tbl
        );
    END LOOP;
END $$;

-- ============================================================
-- 4. 관리자 지정 (회원가입 후 아래 이메일을 본인 이메일로 바꿔 1회 실행)
-- ============================================================

-- UPDATE profiles SET is_admin = TRUE WHERE email = 'you@example.com';

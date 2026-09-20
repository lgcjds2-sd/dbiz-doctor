-- 경영지도사 소견/직인 기능
-- 실행 후: /admin/consultant-profile 에서 본인 이름/등록번호/직인 이미지를 등록하세요.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consultant_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seal_image TEXT;

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS consultant_opinion TEXT;

-- 본인 프로필(이름/등록번호/직인) 수정 허용
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
CREATE POLICY "profiles_self_update" ON profiles
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 보고서에 담당 경영지도사 이름/직인을 표시해야 하므로, 관리자(경영지도사) 프로필은
-- 모든 로그인 사용자가 조회할 수 있도록 완화 (이름/등록번호/직인은 원래 공개적으로
-- 사용되는 정보이므로 노출에 문제 없음).
DROP POLICY IF EXISTS "profiles_self_or_admin_select" ON profiles;
CREATE POLICY "profiles_self_or_admin_select" ON profiles
    FOR SELECT USING (id = auth.uid() OR is_admin() OR profiles.is_admin = TRUE);

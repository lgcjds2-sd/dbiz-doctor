-- 관리자가 다른 사용자의 프로필(is_admin 등)을 수정할 수 있도록 UPDATE 정책 확장.
-- 기존 "본인만 수정 가능" 정책을 "본인 또는 관리자"로 교체한다.

DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
CREATE POLICY "profiles_self_or_admin_update" ON profiles
    FOR UPDATE USING (id = auth.uid() OR is_admin())
    WITH CHECK (id = auth.uid() OR is_admin());

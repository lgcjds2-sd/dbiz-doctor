-- 회원가입 시 이름/소속/연락처 수집
-- auth.users.raw_user_meta_data(가입 시 signUp options.data로 전달됨)에서
-- 값을 읽어 profiles에 함께 저장하도록 handle_new_user 트리거를 갱신한다.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, affiliation, phone)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'affiliation',
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

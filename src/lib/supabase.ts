import { createClient } from '@supabase/supabase-js'

// 이 프로젝트의 테이블 형태는 src/types/database.ts 에 정의되어 있다.
// supabase-js의 Database 제네릭 대신 서비스 계층에서 명시적으로 타입을 캐스팅해
// 스키마 변경에 따른 제네릭 추론 문제를 피한다.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[D-Biz Doctor] Supabase 환경변수가 설정되지 않았습니다. .env.example을 참고하여 .env 파일을 생성하세요.',
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
)

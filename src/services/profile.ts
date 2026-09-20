import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

export async function getMyProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error) throw error
  return data as Profile | null
}

export async function updateMyProfile(
  patch: Partial<Pick<Profile, 'consultant_name' | 'license_number' | 'seal_image'>>,
): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다.')
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select()
    .single()
  if (error) throw error
  return data as Profile
}

/**
 * 보고서에 표시할 담당 경영지도사 정보를 조회한다.
 * 이 배포는 한 명의 경영지도사가 운영한다고 가정하고, 관리자 프로필 중
 * 하나를 대표로 사용한다.
 */
export async function getConsultantProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_admin', true)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as Profile | null
}

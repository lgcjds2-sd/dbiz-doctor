// 로그인한 사용자가 해당 assessment의 소유자(또는 관리자)인지 검증한다.
// AI 분석 Edge Function은 비용이 발생하므로, 아무나 임의의 assessmentId로
// 호출해 남의 진단을 분석/재생성하지 못하도록 반드시 이 검증을 거친다.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function verifyOwnership(
  req: Request,
  serviceClient: SupabaseClient,
  assessmentId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { ok: false, status: 401, error: '로그인이 필요합니다.' }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser()
  if (userError || !user) {
    return { ok: false, status: 401, error: '로그인이 필요합니다.' }
  }

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.is_admin) {
    return { ok: true }
  }

  const { data: assessment } = await serviceClient
    .from('assessments')
    .select('company:companies(user_id)')
    .eq('id', assessmentId)
    .maybeSingle()

  const ownerId = (assessment as any)?.company?.user_id
  if (ownerId && ownerId === user.id) {
    return { ok: true }
  }

  return { ok: false, status: 403, error: '이 진단에 접근할 권한이 없습니다.' }
}

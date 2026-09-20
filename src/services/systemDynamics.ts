// 5~9단계(시스템 다이내믹스 심층분석) 데이터 접근 계층.
// 테이블은 schema.sql에 이미 정의되어 있으며, 이후 AI 분석 파이프라인이
// 이 서비스들을 통해 결과를 저장/조회하도록 연동하면 된다. MVP 단계에서는
// 조회 함수만 제공하며 대부분 빈 배열/null을 반환한다.

import { supabase } from '@/lib/supabase'
import type {
  ActionPlan,
  CausalLoopDiagramData,
  DeepQuestion,
  LeveragePoint,
  SystemDynamicsAnalysis,
} from '@/types/database'

export async function getSystemDynamicsAnalysis(
  assessmentId: string,
): Promise<SystemDynamicsAnalysis | null> {
  const { data, error } = await supabase
    .from('system_dynamics_analyses')
    .select('*')
    .eq('assessment_id', assessmentId)
    .maybeSingle()
  if (error) throw error
  return data as SystemDynamicsAnalysis | null
}

export async function listDeepQuestions(assessmentId: string): Promise<DeepQuestion[]> {
  const { data, error } = await supabase
    .from('deep_questions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as DeepQuestion[]
}

export async function getCausalLoopDiagram(
  assessmentId: string,
): Promise<CausalLoopDiagramData | null> {
  const { data, error } = await supabase
    .from('causal_loop_diagrams')
    .select('*')
    .eq('assessment_id', assessmentId)
    .maybeSingle()
  if (error) throw error
  return data as CausalLoopDiagramData | null
}

export async function listLeveragePoints(assessmentId: string): Promise<LeveragePoint[]> {
  const { data, error } = await supabase
    .from('leverage_points')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('priority_score', { ascending: false })
  if (error) throw error
  return (data ?? []) as LeveragePoint[]
}

async function invokeAnalysisFunction(name: string, assessmentId: string): Promise<void> {
  const { error } = await supabase.functions.invoke(name, {
    body: { assessmentId },
  })
  if (error) {
    const context = (error as { context?: Response }).context
    if (context && typeof context.json === 'function') {
      const body = await context.json().catch(() => null)
      if (body?.error) throw new Error(body.error)
    }
    throw error
  }
}

export type AnalysisStage = 'structure' | 'leverage_actions'

/**
 * STEP 5~9(시스템 다이내믹스 분석/심층질문/인과순환지도/레버리지 포인트/90일 실행계획)를
 * 생성한다. 하나의 거대한 AI 호출은 Supabase Edge Function 게이트웨이 타임아웃을 초과할 수
 * 있어(대용량 보고서 콘텐츠 생성 시 관찰됨) 두 단계로 나누어 순차 호출한다:
 *   1. analyze-system-dynamics: 문제구조 분석 · 심층질문 · 인과순환지도
 *   2. generate-leverage-actions: 레버리지 포인트 · 90일 실행계획 (1의 결과를 근거로 생성)
 * onStageChange로 진행 상태를 UI에 알릴 수 있다.
 */
export async function triggerSystemDynamicsAnalysis(
  assessmentId: string,
  onStageChange?: (stage: AnalysisStage) => void,
): Promise<void> {
  onStageChange?.('structure')
  await invokeAnalysisFunction('analyze-system-dynamics', assessmentId)

  onStageChange?.('leverage_actions')
  await invokeAnalysisFunction('generate-leverage-actions', assessmentId)
}

export async function listActionPlans(assessmentId: string): Promise<ActionPlan[]> {
  const { data, error } = await supabase
    .from('action_plans')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as ActionPlan[]
}

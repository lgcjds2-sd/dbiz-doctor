import { supabase } from '@/lib/supabase'
import type { Category, DiagnosisResult, Question, Response, SeverityLevel } from '@/types/database'

export interface CategoryScore {
  category: Category
  categoryScore: number
  normalizedScore: number
  responseCount: number
}

export function severityFromScore(normalizedScore: number): SeverityLevel {
  if (normalizedScore < 40) return 'critical'
  if (normalizedScore < 60) return 'warning'
  if (normalizedScore < 80) return 'stable'
  return 'strong'
}

export const SEVERITY_LABEL: Record<SeverityLevel, string> = {
  critical: '위험',
  warning: '주의',
  stable: '안정',
  strong: '강점',
}

/** 영역별 평균점수(1~5) 및 100점 환산점수를 계산한다. */
export function calculateCategoryScores(
  categories: Category[],
  questions: Question[],
  responses: Response[],
): CategoryScore[] {
  const scoreByQuestionId = new Map(responses.map((r) => [r.question_id, r.score]))

  return categories.map((category) => {
    const categoryQuestions = questions.filter((q) => q.category_id === category.id)
    const scores = categoryQuestions
      .map((q) => scoreByQuestionId.get(q.id))
      .filter((s): s is number => typeof s === 'number')

    const categoryScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const normalizedScore = Math.round(categoryScore * 20 * 100) / 100

    return {
      category,
      categoryScore: Math.round(categoryScore * 100) / 100,
      normalizedScore,
      responseCount: scores.length,
    }
  })
}

/** 9개 영역 평균으로 종합 경영건강도 점수(100점 환산)를 계산한다. */
export function calculateOverallScore(categoryScores: CategoryScore[]): number {
  if (categoryScores.length === 0) return 0
  const sum = categoryScores.reduce((acc, c) => acc + c.normalizedScore, 0)
  return Math.round((sum / categoryScores.length) * 100) / 100
}

export function rankCategoryScores(categoryScores: CategoryScore[]): CategoryScore[] {
  return [...categoryScores].sort((a, b) => a.normalizedScore - b.normalizedScore)
}

/**
 * 계산된 영역별 점수를 diagnosis_results 테이블에 저장(upsert)하고,
 * assessments.overall_score / status를 갱신한다.
 */
export async function persistDiagnosisResults(
  assessmentId: string,
  categoryScores: CategoryScore[],
): Promise<void> {
  const ranked = rankCategoryScores(categoryScores)

  const rows = ranked.map((cs, index) => ({
    assessment_id: assessmentId,
    category_id: cs.category.id,
    category_score: cs.categoryScore,
    normalized_score: cs.normalizedScore,
    rank: index + 1,
    severity_level: severityFromScore(cs.normalizedScore),
  }))

  const { error } = await supabase
    .from('diagnosis_results')
    .upsert(rows, { onConflict: 'assessment_id,category_id' })
  if (error) throw error
}

export function buildExecutiveMessage(
  overallScore: number,
  weakest: (DiagnosisResult & { category: Category })[],
): string {
  const weakNames = weakest.map((r) => r.category.name).join(', ')
  if (overallScore >= 80) {
    return `종합 경영건강도 ${overallScore}점으로 전반적으로 안정적인 구조를 갖추고 있습니다. ${weakNames} 영역을 지속적으로 보완하여 강점을 강화하는 전략이 유효합니다.`
  }
  if (overallScore >= 60) {
    return `종합 경영건강도 ${overallScore}점으로 양호한 수준이나, ${weakNames} 영역에서 구조적 취약점이 발견되었습니다. 해당 영역의 근본 원인을 분석하는 심층진단이 필요합니다.`
  }
  if (overallScore >= 40) {
    return `종합 경영건강도 ${overallScore}점으로 주의가 필요한 단계입니다. 특히 ${weakNames} 영역은 방치할 경우 다른 영역으로 문제가 전이될 위험이 있어 우선적인 개선이 요구됩니다.`
  }
  return `종합 경영건강도 ${overallScore}점으로 위험 수준입니다. ${weakNames} 영역을 중심으로 구조적 원인을 즉시 진단하고 90일 내 실행 가능한 개선조치가 시급합니다.`
}

export async function getDiagnosisResults(
  assessmentId: string,
): Promise<(DiagnosisResult & { category: Category })[]> {
  const { data, error } = await supabase
    .from('diagnosis_results')
    .select('*, category:categories(*)')
    .eq('assessment_id', assessmentId)
    .order('rank', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as (DiagnosisResult & { category: Category })[]
}

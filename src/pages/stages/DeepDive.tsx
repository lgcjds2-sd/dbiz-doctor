import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { StageHeader } from '@/components/stage/StageHeader'
import {
  getSystemDynamicsAnalysis,
  listDeepQuestions,
  triggerSystemDynamicsAnalysis,
} from '@/services/systemDynamics'
import type { DeepQuestion, SystemDynamicsAnalysis } from '@/types/database'

const QUESTION_PURPOSES = [
  '문제의 시간적 변화 확인',
  '핵심 변수 간 인과관계 검증',
  '피드백 루프 확인',
  '시간지연 확인',
  '의도하지 않은 정책 부작용 확인',
  '시스템 원형 탐색',
]

export function DeepDive() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<SystemDynamicsAnalysis | null>(null)
  const [questions, setQuestions] = useState<DeepQuestion[]>([])

  async function load() {
    if (!assessmentId) return
    const [a, q] = await Promise.all([
      getSystemDynamicsAnalysis(assessmentId),
      listDeepQuestions(assessmentId),
    ])
    setAnalysis(a)
    setQuestions(q)
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId])

  async function handleAnalyze() {
    if (!assessmentId) return
    setAnalyzing(true)
    setError(null)
    try {
      await triggerSystemDynamicsAnalysis(assessmentId)
      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'AI 분석 실행 중 오류가 발생했습니다. Edge Function 배포와 ANTHROPIC_API_KEY 설정을 확인해 주세요.',
      )
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <StageHeader
        assessmentId={assessmentId!}
        step="STEP 5-6"
        title="시스템 다이내믹스 분석 · AI 심층질문"
        description="27개 설문응답과 취약영역 TOP 3를 기반으로 AI가 경영문제의 구조적 원인을 분석하고, 인과구조 가설을 검증할 심층질문을 생성합니다."
      />

      <div className="no-print mb-6 flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm text-slate-500">
          {analysis
            ? '분석이 완료되었습니다. 데이터를 갱신하려면 다시 실행하세요.'
            : 'Claude를 호출하여 문제구조 분석, 심층질문, 인과순환지도, 레버리지 포인트, 90일 실행계획을 한 번에 생성합니다.'}
        </p>
        <Button onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? 'AI 분석 실행 중...' : analysis ? '다시 분석하기' : 'AI 분석 실행'}
        </Button>
      </div>

      {error && (
        <p className="no-print mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-severity-critical">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">불러오는 중입니다...</p>
      ) : analysis || questions.length > 0 ? (
        <div className="space-y-6">
          {analysis?.problem_statement && (
            <Card>
              <CardHeader title="문제 정의 (Problem Statement)" />
              <p className="text-sm leading-relaxed text-navy-800">{analysis.problem_statement}</p>
            </Card>
          )}

          {analysis && analysis.key_variables.length > 0 && (
            <Card>
              <CardHeader title="핵심 변수 (Key Variables)" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {analysis.key_variables.map((v) => (
                  <div key={v.name} className="rounded-md border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-navy-900">{v.name}</p>
                    {v.description && <p className="mt-1 text-xs text-slate-500">{v.description}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {analysis && (analysis.reinforcing_loops.length > 0 || analysis.balancing_loops.length > 0) && (
            <Card>
              <CardHeader title="피드백 루프" subtitle="강화루프(R) / 균형루프(B)" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[...analysis.reinforcing_loops, ...analysis.balancing_loops].map((loop) => (
                  <div key={loop.id} className="rounded-md border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-navy-900">
                      <span className="mr-2 rounded bg-navy-900 px-1.5 py-0.5 text-xs text-white">
                        {loop.id}
                      </span>
                      {loop.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{loop.variables.join(' → ')}</p>
                    {loop.description && <p className="mt-1 text-xs text-slate-500">{loop.description}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {analysis && analysis.system_archetype_candidates.length > 0 && (
            <Card>
              <CardHeader title="시스템 원형 후보 (System Archetypes)" />
              <div className="flex flex-wrap gap-2">
                {analysis.system_archetype_candidates.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-800"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {analysis?.management_implications && (
            <Card>
              <CardHeader title="경영 시사점" />
              <p className="text-sm leading-relaxed text-navy-800">
                {analysis.management_implications}
              </p>
            </Card>
          )}

          {questions.length > 0 && (
            <Card>
              <CardHeader title="AI 심층질문" subtitle={`${questions.length}개 문항`} />
              <ol className="space-y-3">
                {questions.map((q, i) => (
                  <li key={q.id} className="rounded-md border border-slate-200 px-4 py-3">
                    <p className="text-sm font-medium text-navy-900">
                      {i + 1}. {q.question_text}
                    </p>
                    {q.purpose && <p className="mt-1 text-xs text-gold-600">목적: {q.purpose}</p>}
                  </li>
                ))}
              </ol>
            </Card>
          )}

          <div className="no-print flex justify-end gap-3">
            <Link to={`/assessments/${assessmentId}/causal-loop`}>
              <Button variant="secondary">인과순환지도 보기 →</Button>
            </Link>
            <Link to={`/assessments/${assessmentId}/leverage-points`}>
              <Button>레버리지 포인트 보기 →</Button>
            </Link>
          </div>
        </div>
      ) : (
        <EmptyState
          title="아직 생성된 심층분석 결과가 없습니다"
          description="위의 'AI 분석 실행' 버튼을 누르면 system_dynamics_analyses / deep_questions / causal_loop_diagrams / leverage_points / action_plans 테이블에 결과가 저장되고 이 화면과 다음 단계 화면에 자동으로 표시됩니다."
          action={
            <div className="grid grid-cols-2 gap-2 text-left sm:grid-cols-3">
              {QUESTION_PURPOSES.map((p) => (
                <span
                  key={p}
                  className="rounded-md bg-white px-3 py-2 text-xs font-medium text-navy-700 shadow-sm"
                >
                  {p}
                </span>
              ))}
            </div>
          }
        />
      )}
    </div>
  )
}

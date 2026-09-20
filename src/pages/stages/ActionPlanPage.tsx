import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { StageHeader } from '@/components/stage/StageHeader'
import {
  ANALYSIS_STAGE_LABELS,
  listActionPlans,
  triggerSystemDynamicsAnalysis,
  type AnalysisStage,
} from '@/services/systemDynamics'
import type { ActionPhase, ActionPlan } from '@/types/database'

const PHASES: { key: ActionPhase; label: string }[] = [
  { key: '0-30', label: '0~30일: 문제 확인 및 Quick Win' },
  { key: '31-60', label: '31~60일: 프로세스와 정책 개선' },
  { key: '61-90', label: '61~90일: 시스템 정착 및 성과관리' },
]

export function ActionPlanPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [stage, setStage] = useState<AnalysisStage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<ActionPlan[]>([])

  async function load() {
    if (!assessmentId) return
    setPlans(await listActionPlans(assessmentId))
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
      await triggerSystemDynamicsAnalysis(assessmentId, setStage)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 분석 실행 중 오류가 발생했습니다.')
    } finally {
      setAnalyzing(false)
      setStage(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <StageHeader
        assessmentId={assessmentId!}
        step="STEP 9"
        title="90일 실행계획"
        description="선정된 레버리지 포인트를 기반으로 0~30일 / 31~60일 / 61~90일 단계별 실행계획을 수립합니다."
      />

      {analyzing && (
        <p className="no-print mb-6 rounded-md bg-amber-50 px-4 py-3 text-xs text-severity-warning">
          {stage ? ANALYSIS_STAGE_LABELS[stage] : '생성 중...'} 이 페이지를 벗어나도 서버에서
          계속 처리되니, 잠시 후 다시 방문하시면 결과를 확인할 수 있습니다.
        </p>
      )}

      {error && (
        <p className="no-print mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-severity-critical">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">불러오는 중입니다...</p>
      ) : plans.length > 0 ? (
        <div className="space-y-4">
          <div className="no-print flex justify-end">
            <Button variant="secondary" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? '재생성 중...' : '다시 생성하기'}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {PHASES.map((phase) => (
              <Card key={phase.key}>
                <CardHeader title={phase.label} />
                <div className="space-y-3">
                  {plans
                    .filter((p) => p.phase === phase.key)
                    .map((p) => (
                      <div key={p.id} className="rounded-md border border-slate-200 p-3 text-sm">
                        <p className="font-medium text-navy-900">{p.action}</p>
                        {p.context && (
                          <p className="mt-1 text-xs leading-5 text-slate-500">{p.context}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">담당: {p.owner ?? '-'}</p>
                        <p className="text-xs text-slate-500">
                          KPI: {p.kpi ?? '-'} / 목표: {p.target ?? '-'}
                        </p>
                        {p.due_date && (
                          <p className="mt-1 text-xs text-slate-400">
                            기한: {new Date(p.due_date).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="아직 수립된 실행계획이 없습니다"
          description="AI 심층질문 화면에서 'AI 분석 실행'을 누르면 action_plans 테이블에 결과가 저장되고 이 화면에 단계별 칸반 보드로 표시됩니다."
          action={
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? '생성 중...' : 'AI 분석 실행'}
            </Button>
          }
        />
      )}
    </div>
  )
}

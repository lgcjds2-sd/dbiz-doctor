import { useEffect, useState } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { StageHeader } from '@/components/stage/StageHeader'
import { ImpactFeasibilityMatrix } from '@/components/charts/ImpactFeasibilityMatrix'
import {
  ANALYSIS_STAGE_LABELS,
  listLeveragePoints,
  triggerSystemDynamicsAnalysis,
  type AnalysisStage,
} from '@/services/systemDynamics'
import { useParams } from 'react-router-dom'
import type { LeveragePoint } from '@/types/database'

export function LeveragePoints() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [stage, setStage] = useState<AnalysisStage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [points, setPoints] = useState<LeveragePoint[]>([])

  async function load() {
    if (!assessmentId) return
    setPoints(await listLeveragePoints(assessmentId))
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <StageHeader
        assessmentId={assessmentId!}
        step="STEP 8"
        title="레버리지 포인트"
        description="AI가 추천하는 3~5개의 레버리지 포인트와 Impact × Feasibility 매트릭스를 통해 개선 우선순위를 도출합니다."
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
      ) : points.length > 0 ? (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Impact × Feasibility 매트릭스"
              action={
                <Button variant="secondary" onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? '재생성 중...' : '다시 생성하기'}
                </Button>
              }
            />
            <ImpactFeasibilityMatrix points={points} />
          </Card>

          <Card padded={false}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">레버리지 포인트</th>
                  <th className="px-4 py-3 font-semibold">관련 문제</th>
                  <th className="px-4 py-3 font-semibold">기대효과</th>
                  <th className="px-4 py-3 font-semibold">실행난이도</th>
                  <th className="px-4 py-3 font-semibold">효과발현시점</th>
                  <th className="px-4 py-3 font-semibold">우선순위</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {points.map((p, i) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-semibold text-slate-400">#{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-navy-900">{p.leverage_point}</td>
                    <td className="px-4 py-3 text-slate-500">{p.related_problem}</td>
                    <td className="px-4 py-3 text-slate-500">{p.expected_impact}</td>
                    <td className="px-4 py-3 text-slate-500">{p.implementation_difficulty}</td>
                    <td className="px-4 py-3 text-slate-500">{p.time_to_effect}</td>
                    <td className="px-4 py-3 font-semibold text-navy-800">{p.priority_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ) : (
        <EmptyState
          title="아직 도출된 레버리지 포인트가 없습니다"
          description="AI 심층질문 화면에서 'AI 분석 실행'을 누르면 leverage_points 테이블에 결과가 저장되고 이 화면에 Impact × Feasibility 매트릭스와 함께 표시됩니다."
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

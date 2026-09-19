import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { StageHeader } from '@/components/stage/StageHeader'
import { CausalLoopSvg } from '@/components/charts/CausalLoopSvg'
import { getCausalLoopDiagram, triggerSystemDynamicsAnalysis } from '@/services/systemDynamics'
import type { CausalLoopDiagramData } from '@/types/database'

export function CausalLoop() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [diagram, setDiagram] = useState<CausalLoopDiagramData | null>(null)

  async function load() {
    if (!assessmentId) return
    setDiagram(await getCausalLoopDiagram(assessmentId))
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
      setError(err instanceof Error ? err.message : 'AI 분석 실행 중 오류가 발생했습니다.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <StageHeader
        assessmentId={assessmentId!}
        step="STEP 7"
        title="인과순환지도 (Causal Loop Diagram)"
        description="검증된 심층진단 결과를 바탕으로 핵심 변수 간 인과관계, 극성(+/-), 시간지연, 강화루프(R)·균형루프(B)를 시각화합니다."
      />

      {error && (
        <p className="no-print mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-severity-critical">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">불러오는 중입니다...</p>
      ) : diagram && diagram.nodes.length > 0 ? (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="인과순환지도"
              action={
                <Button variant="secondary" onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? '재생성 중...' : '다시 생성하기'}
                </Button>
              }
            />
            <CausalLoopSvg nodes={diagram.nodes} edges={diagram.edges} />
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-severity-strong" /> 정(+) 관계
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-severity-critical" /> 부(-) 관계
              </span>
              <span>점선 = 시간지연(Delay)</span>
            </div>
          </Card>

          {(diagram.reinforcing_loops.length > 0 || diagram.balancing_loops.length > 0) && (
            <Card>
              <CardHeader title="루프 목록" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[...diagram.reinforcing_loops, ...diagram.balancing_loops].map((loop) => (
                  <div key={loop.id} className="rounded-md border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-navy-900">
                      <span className="mr-2 rounded bg-navy-900 px-1.5 py-0.5 text-xs text-white">
                        {loop.id}
                      </span>
                      {loop.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{loop.variables.join(' → ')}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <EmptyState
          title="아직 생성된 인과순환지도가 없습니다"
          description="AI 심층질문 화면에서 'AI 분석 실행'을 누르면 causal_loop_diagrams 테이블에 노드/엣지/루프 데이터가 저장되고 이 화면에 자동으로 시각화됩니다."
          action={
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? 'AI 분석 실행 중...' : 'AI 분석 실행'}
            </Button>
          }
        />
      )}
    </div>
  )
}

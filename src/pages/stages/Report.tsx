import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { CategoryRadarChart } from '@/components/charts/CategoryRadarChart'
import { getAssessmentWithCompany } from '@/services/assessments'
import { buildExecutiveMessage, getDiagnosisResults } from '@/services/diagnosis'
import {
  getSystemDynamicsAnalysis,
  listActionPlans,
  listLeveragePoints,
} from '@/services/systemDynamics'
import type {
  ActionPhase,
  ActionPlan,
  Assessment,
  Category,
  Company,
  DiagnosisResult,
  LeveragePoint,
  SystemDynamicsAnalysis,
} from '@/types/database'

type ResultRow = DiagnosisResult & { category: Category }

const PHASE_LABELS: Record<ActionPhase, string> = {
  '0-30': '0~30일',
  '31-60': '31~60일',
  '61-90': '61~90일',
}

export function Report() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const [loading, setLoading] = useState(true)
  const [assessment, setAssessment] = useState<(Assessment & { company: Company }) | null>(null)
  const [results, setResults] = useState<ResultRow[]>([])
  const [analysis, setAnalysis] = useState<SystemDynamicsAnalysis | null>(null)
  const [leveragePoints, setLeveragePoints] = useState<LeveragePoint[]>([])
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([])

  useEffect(() => {
    if (!assessmentId) return
    Promise.all([
      getAssessmentWithCompany(assessmentId),
      getDiagnosisResults(assessmentId),
      getSystemDynamicsAnalysis(assessmentId),
      listLeveragePoints(assessmentId),
      listActionPlans(assessmentId),
    ])
      .then(([a, r, sda, lp, ap]) => {
        setAssessment(a)
        setResults(r)
        setAnalysis(sda)
        setLeveragePoints(lp)
        setActionPlans(ap)
      })
      .finally(() => setLoading(false))
  }, [assessmentId])

  if (loading) return <div className="px-4 py-16 text-center text-sm text-slate-500">불러오는 중...</div>
  if (!assessment || results.length === 0)
    return <div className="px-4 py-16 text-center text-sm text-slate-500">보고서를 생성할 데이터가 없습니다.</div>

  const sortedByRank = [...results].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  const weakest = sortedByRank.slice(0, 3)
  const overallScore = assessment.overall_score ?? 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="no-print mb-6 flex justify-end">
        <Button onClick={() => window.print()}>인쇄 / PDF 저장</Button>
      </div>

      <Card className="!p-10">
        <div className="border-b border-navy-900 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
            Executive Diagnosis Report
          </p>
          <h1 className="mt-2 text-2xl font-bold text-navy-950">{assessment.company.company_name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {assessment.company.industry} · {assessment.company.employee_range} ·{' '}
            {assessment.company.revenue_range}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            진단일: {new Date(assessment.completed_at ?? assessment.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 border-b border-slate-200 py-8">
          <div className="col-span-1 flex flex-col items-center justify-center border-r border-slate-200">
            <p className="text-xs font-semibold text-slate-400">종합 경영건강도</p>
            <p className="mt-2 text-4xl font-bold text-navy-900">{overallScore.toFixed(1)}</p>
          </div>
          <div className="col-span-2">
            <p className="mb-2 text-xs font-semibold text-slate-400">핵심 진단 메시지</p>
            <p className="text-sm leading-relaxed text-navy-800">
              {buildExecutiveMessage(overallScore, weakest)}
            </p>
          </div>
        </div>

        <div className="border-b border-slate-200 py-8">
          <p className="mb-4 text-xs font-semibold text-slate-400">9개 영역 진단 결과</p>
          <CategoryRadarChart results={results} />
        </div>

        <div className="py-8">
          <p className="mb-4 text-xs font-semibold text-slate-400">취약영역 TOP 3</p>
          <div className="space-y-2">
            {weakest.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3"
              >
                <span className="text-sm font-medium text-navy-900">
                  {i + 1}. {r.category.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{r.normalized_score}점</span>
                  {r.severity_level && <SeverityBadge level={r.severity_level} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {analysis?.problem_statement && (
          <div className="border-t border-slate-200 py-8">
            <p className="mb-2 text-xs font-semibold text-slate-400">문제구조 분석</p>
            <p className="text-sm leading-relaxed text-navy-800">{analysis.problem_statement}</p>
            {analysis.management_implications && (
              <p className="mt-3 text-sm leading-relaxed text-navy-800">
                {analysis.management_implications}
              </p>
            )}
          </div>
        )}

        {leveragePoints.length > 0 && (
          <div className="border-t border-slate-200 py-8">
            <p className="mb-4 text-xs font-semibold text-slate-400">레버리지 포인트</p>
            <div className="space-y-2">
              {leveragePoints.map((lp, i) => (
                <div key={lp.id} className="rounded-md border border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-navy-900">
                    {i + 1}. {lp.leverage_point}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{lp.recommended_action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {actionPlans.length > 0 && (
          <div className="border-t border-slate-200 py-8">
            <p className="mb-4 text-xs font-semibold text-slate-400">90일 실행계획</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(['0-30', '31-60', '61-90'] as ActionPhase[]).map((phase) => (
                <div key={phase}>
                  <p className="mb-2 text-xs font-semibold text-gold-600">{PHASE_LABELS[phase]}</p>
                  <ul className="space-y-1.5">
                    {actionPlans
                      .filter((p) => p.phase === phase)
                      .map((p) => (
                        <li key={p.id} className="text-xs text-navy-800">
                          · {p.action}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {!analysis && (
          <div className="mt-8 rounded-md bg-slate-50 p-4 text-xs text-slate-500">
            AI 심층질문, 인과순환지도, 레버리지 포인트, 90일 실행계획 결과는 심층분석 화면에서
            'AI 분석 실행'을 누르면 이 보고서에 자동으로 추가됩니다.
          </div>
        )}
      </Card>
    </div>
  )
}

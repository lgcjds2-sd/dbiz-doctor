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
  '0-30': '0~30일 · 문제 확인 및 Quick Win',
  '31-60': '31~60일 · 프로세스와 정책 개선',
  '61-90': '61~90일 · 시스템 정착 및 성과관리',
}

function SectionTitle({ roman, title, subtitle }: { roman: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-3 border-b-2 border-navy-900 pb-2">
      <span className="text-sm font-bold text-gold-600">{roman}.</span>
      <div>
        <h2 className="text-lg font-bold text-navy-950">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  )
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
  const weakestCodes = new Set(weakest.map((r) => r.category.code))
  const overallScore = assessment.overall_score ?? 0

  const categoryReportByCode = new Map((analysis?.category_reports ?? []).map((c) => [c.category_code, c]))
  const categoryNameByCode = new Map(results.map((r) => [r.category.code, r.category]))

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="no-print mb-6 flex justify-end">
        <Button onClick={() => window.print()}>인쇄 / PDF 저장</Button>
      </div>

      <Card className="!p-10 sm:!p-14">
        {/* 표지 영역 */}
        <div className="border-b-4 border-navy-900 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
            Executive Diagnosis Report
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-navy-950">
            {assessment.company.company_name}
          </h1>
          <p className="mt-2 text-base text-slate-600">
            {assessment.company.industry} · {assessment.company.employee_range} ·{' '}
            {assessment.company.revenue_range}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            진단일: {new Date(assessment.completed_at ?? assessment.created_at).toLocaleDateString('ko-KR')}
            {'  ·  '}시스템 다이내믹스 기반 AI 경영진단
          </p>
        </div>

        {/* I. 종합 진단 요약 */}
        <section className="border-b border-slate-200 py-10">
          <SectionTitle roman="I" title="종합 진단 요약" subtitle="Executive Summary" />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-6 sm:col-span-1">
              <p className="text-xs font-semibold text-slate-400">종합 경영건강도</p>
              <p className="mt-2 text-5xl font-bold text-navy-900">{overallScore.toFixed(1)}</p>
              <p className="text-xs text-slate-400">/ 100점</p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                핵심 진단 메시지
              </p>
              <p className="text-base leading-8 text-navy-800">
                {buildExecutiveMessage(overallScore, weakest)}
              </p>
            </div>
          </div>

          {analysis?.problem_statement && (
            <div className="mt-6 rounded-lg border-l-4 border-gold-500 bg-navy-950 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-500">
                Headline
              </p>
              <p className="mt-2 text-base font-medium leading-8 text-white">
                {analysis.problem_statement}
              </p>
            </div>
          )}
        </section>

        {/* II. 9개 영역 진단 결과 */}
        <section className="print-break-before border-b border-slate-200 py-10">
          <SectionTitle roman="II" title="9개 영역 진단 결과" subtitle="Diagnostic Radar & Category Assessment" />

          <CategoryRadarChart results={results} />

          <div className="mt-8 space-y-3">
            {[...results]
              .sort((a, b) => (a.category.display_order ?? 0) - (b.category.display_order ?? 0))
              .map((r) => {
                const report = categoryReportByCode.get(r.category.code)
                const isWeak = weakestCodes.has(r.category.code)
                return (
                  <div
                    key={r.id}
                    className={`print-avoid-break rounded-lg border px-5 py-4 ${
                      isWeak ? 'border-severity-critical/30 bg-red-50/40' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-navy-900 px-2 py-0.5 text-xs font-bold text-white">
                          {r.category.code}
                        </span>
                        <span className="text-sm font-semibold text-navy-900">{r.category.name}</span>
                        {isWeak && (
                          <span className="rounded-full bg-severity-critical/10 px-2 py-0.5 text-[11px] font-semibold text-severity-critical">
                            취약영역 TOP {weakest.findIndex((w) => w.id === r.id) + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-navy-800">{r.normalized_score}점</span>
                        {r.severity_level && <SeverityBadge level={r.severity_level} />}
                      </div>
                    </div>
                    {report?.narrative && (
                      <p className="mt-3 text-[15px] leading-7 text-navy-800">{report.narrative}</p>
                    )}
                  </div>
                )
              })}
          </div>
        </section>

        {/* III. 문제구조 분석 */}
        {analysis?.problem_structure && analysis.problem_structure.parts?.length > 0 && (
          <section className="print-break-before border-b border-slate-200 py-10">
            <SectionTitle roman="III" title="문제구조 분석" subtitle="Root-Cause Structure Analysis" />

            <p className="text-[15px] leading-8 text-navy-800">{analysis.problem_structure.overview}</p>

            <div className="mt-6 space-y-6">
              {analysis.problem_structure.parts.map((part, i) => (
                <div key={part.title} className="print-avoid-break border-l-2 border-navy-200 pl-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-navy-950">
                      III-{i + 1}. {part.title}
                    </span>
                    {part.related_categories?.map((code) => (
                      <span
                        key={code}
                        className="rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-semibold text-navy-700"
                      >
                        {categoryNameByCode.get(code)?.name ?? code}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[15px] leading-7 text-navy-800">{part.narrative}</p>
                </div>
              ))}
            </div>

            {analysis.problem_structure.synthesis && (
              <div className="mt-8 rounded-lg bg-navy-50 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">
                  종합 분석 의견
                </p>
                <p className="mt-2 text-[15px] leading-7 text-navy-900">
                  {analysis.problem_structure.synthesis}
                </p>
              </div>
            )}

            {analysis.management_implications && (
              <p className="mt-6 text-[15px] leading-7 text-navy-800">
                {analysis.management_implications}
              </p>
            )}
          </section>
        )}

        {/* IV. 레버리지 포인트 */}
        {leveragePoints.length > 0 && (
          <section className="print-break-before border-b border-slate-200 py-10">
            <SectionTitle roman="IV" title="레버리지 포인트" subtitle="Priority Leverage Points" />
            <div className="space-y-5">
              {leveragePoints.map((lp, i) => (
                <div key={lp.id} className="print-avoid-break rounded-lg border border-slate-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-base font-bold text-navy-950">
                      {i + 1}. {lp.leverage_point}
                    </p>
                    <span className="shrink-0 rounded-full bg-gold-500/15 px-3 py-1 text-xs font-bold text-gold-600">
                      우선순위 {lp.priority_score}
                    </span>
                  </div>

                  {lp.related_categories?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {lp.related_categories.map((code) => (
                        <span
                          key={code}
                          className="rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-semibold text-navy-700"
                        >
                          연관 영역: {categoryNameByCode.get(code)?.name ?? code}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-3 gap-3 rounded-md bg-slate-50 p-3 text-center text-xs">
                    <div>
                      <p className="text-slate-400">실행난이도</p>
                      <p className="mt-1 font-semibold text-navy-800">{lp.implementation_difficulty}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">효과발현시점</p>
                      <p className="mt-1 font-semibold text-navy-800">{lp.time_to_effect}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">기대효과</p>
                      <p className="mt-1 font-semibold text-navy-800">{lp.expected_impact}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-[15px] leading-7 text-navy-800">
                    <span className="font-semibold">권장 조치. </span>
                    {lp.recommended_action}
                  </p>
                  {lp.supplementary_explanation && (
                    <p className="mt-2 text-[15px] leading-7 text-slate-600">
                      {lp.supplementary_explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* V. 90일 실행계획 */}
        {actionPlans.length > 0 && (
          <section className="print-break-before py-10">
            <SectionTitle roman="V" title="90일 실행계획" subtitle="90-Day Execution Roadmap" />
            <div className="space-y-8">
              {(['0-30', '31-60', '61-90'] as ActionPhase[]).map((phase) => (
                <div key={phase}>
                  <p className="mb-3 text-sm font-bold text-gold-600">{PHASE_LABELS[phase]}</p>
                  <div className="space-y-3">
                    {actionPlans
                      .filter((p) => p.phase === phase)
                      .map((p) => (
                        <div key={p.id} className="print-avoid-break rounded-lg border border-slate-200 p-4">
                          <p className="text-sm font-bold text-navy-900">{p.action}</p>
                          {p.context && (
                            <p className="mt-1.5 text-sm leading-6 text-slate-600">{p.context}</p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>
                              <span className="font-semibold text-navy-700">담당:</span> {p.owner ?? '-'}
                            </span>
                            <span>
                              <span className="font-semibold text-navy-700">KPI:</span> {p.kpi ?? '-'}
                            </span>
                            <span>
                              <span className="font-semibold text-navy-700">목표:</span> {p.target ?? '-'}
                            </span>
                            {p.due_date && (
                              <span>
                                <span className="font-semibold text-navy-700">기한:</span>{' '}
                                {new Date(p.due_date).toLocaleDateString('ko-KR')}
                              </span>
                            )}
                          </div>
                          {p.expected_effect && (
                            <p className="mt-2 text-xs text-severity-strong">
                              기대효과: {p.expected_effect}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
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

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { CategoryRadarChart } from '@/components/charts/CategoryRadarChart'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { getAssessmentWithCompany } from '@/services/assessments'
import { buildExecutiveMessage, getDiagnosisResults } from '@/services/diagnosis'
import type { Assessment, Category, Company, DiagnosisResult } from '@/types/database'

type ResultRow = DiagnosisResult & { category: Category }

const NEXT_STEPS = [
  {
    to: 'deep-dive',
    title: 'AI 심층질문 · 문제구조 분석',
    description: '취약영역을 기반으로 인과구조 가설을 세우고 심층질문을 생성합니다.',
  },
  {
    to: 'causal-loop',
    title: '인과순환지도',
    description: '검증된 인과관계를 강화루프(R)·균형루프(B)로 시각화합니다.',
  },
  {
    to: 'leverage-points',
    title: '레버리지 포인트',
    description: 'Impact × Feasibility 매트릭스로 우선순위 개선 지점을 도출합니다.',
  },
  {
    to: 'action-plan',
    title: '90일 실행계획',
    description: '레버리지 포인트를 바탕으로 단계별 실행과제를 수립합니다.',
  },
]

export function ResultsDashboard() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assessment, setAssessment] = useState<(Assessment & { company: Company }) | null>(null)
  const [results, setResults] = useState<ResultRow[]>([])

  useEffect(() => {
    if (!assessmentId) return
    let cancelled = false
    async function load() {
      try {
        const [a, r] = await Promise.all([
          getAssessmentWithCompany(assessmentId!),
          getDiagnosisResults(assessmentId!),
        ])
        if (cancelled) return
        setAssessment(a)
        setResults(r)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '결과를 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [assessmentId])

  if (loading) {
    return <div className="px-4 py-16 text-center text-sm text-slate-500">결과를 불러오는 중입니다...</div>
  }

  if (error || !assessment || results.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-sm text-severity-critical">
        {error ?? '진단 결과가 없습니다. 설문을 먼저 완료해 주세요.'}
      </div>
    )
  }

  const sortedByRank = [...results].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  const weakest = sortedByRank.slice(0, 3)
  const strongest = [...sortedByRank].reverse().slice(0, 3)
  const overallScore = assessment.overall_score ?? 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
            진단 결과 대시보드
          </p>
          <h1 className="mt-1 text-xl font-bold text-navy-900">{assessment.company.company_name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {assessment.company.industry} · {assessment.company.employee_range} ·{' '}
            {new Date(assessment.completed_at ?? assessment.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <Link
          to={`/assessments/${assessmentId}/report`}
          className="rounded-md border border-navy-800 px-4 py-2.5 text-sm font-medium text-navy-800 hover:bg-navy-50"
        >
          경영진 보고서 보기
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            종합 경영건강도
          </p>
          <p className="mt-2 text-5xl font-bold text-navy-900">{overallScore.toFixed(1)}</p>
          <p className="text-sm text-slate-400">/ 100점</p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="경영진을 위한 핵심 진단 메시지" />
          <p className="text-sm leading-relaxed text-navy-800">
            {buildExecutiveMessage(overallScore, weakest)}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="9개 영역 Radar Chart" />
          <CategoryRadarChart results={results} />
        </Card>
        <Card>
          <CardHeader title="영역별 점수 Bar Chart" />
          <CategoryBarChart results={results} />
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="취약영역 TOP 3" subtitle="구조적 개선이 시급한 영역" />
          <ul className="space-y-3">
            {weakest.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-severity-critical text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-navy-900">{r.category.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-navy-800">{r.normalized_score}점</span>
                  {r.severity_level && <SeverityBadge level={r.severity_level} />}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="강점영역 TOP 3" subtitle="경쟁우위로 활용 가능한 영역" />
          <ul className="space-y-3">
            {strongest.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-severity-strong text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-navy-900">{r.category.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-navy-800">{r.normalized_score}점</span>
                  {r.severity_level && <SeverityBadge level={r.severity_level} />}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">다음 단계: 시스템 다이내믹스 심층분석</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NEXT_STEPS.map((step) => (
            <Link key={step.to} to={`/assessments/${assessmentId}/${step.to}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <p className="text-sm font-semibold text-navy-900">{step.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{step.description}</p>
                <p className="mt-3 text-xs font-medium text-gold-600">자세히 보기 →</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

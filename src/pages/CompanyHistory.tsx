import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { CategoryTrendChart, OverallScoreTrendChart, type RoundPoint } from '@/components/charts/TrendCharts'
import { getCompany } from '@/services/companies'
import { listCompletedAssessmentsForCompany } from '@/services/assessments'
import { getDiagnosisResults } from '@/services/diagnosis'
import { listCategories } from '@/services/questions'
import type { Category, Company } from '@/types/database'

export function CompanyHistory() {
  const { companyId } = useParams<{ companyId: string }>()
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<Company | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [rounds, setRounds] = useState<RoundPoint[]>([])

  useEffect(() => {
    if (!companyId) return
    async function load() {
      const [c, cats, assessments] = await Promise.all([
        getCompany(companyId!),
        listCategories(),
        listCompletedAssessmentsForCompany(companyId!),
      ])
      setCompany(c)
      setCategories(cats)

      const resultsPerAssessment = await Promise.all(
        assessments.map((a) => getDiagnosisResults(a.id)),
      )

      const roundPoints: RoundPoint[] = assessments.map((a, i) => {
        const scoresByCode: Record<string, number> = {}
        resultsPerAssessment[i].forEach((r) => {
          scoresByCode[r.category.code] = r.normalized_score ?? 0
        })
        const date = new Date(a.completed_at ?? a.created_at).toLocaleDateString('ko-KR', {
          year: '2-digit',
          month: 'short',
          day: 'numeric',
        })
        return {
          assessmentId: a.id,
          label: `${i + 1}차 (${date})`,
          overallScore: a.overall_score ?? 0,
          scoresByCode,
        }
      })
      setRounds(roundPoints)
      setLoading(false)
    }
    load()
  }, [companyId])

  if (loading) return <div className="px-4 py-16 text-center text-sm text-slate-500">불러오는 중...</div>
  if (!company)
    return <div className="px-4 py-16 text-center text-sm text-severity-critical">기업 정보를 찾을 수 없습니다.</div>

  const sortedCategories = [...categories].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  const latest = rounds[rounds.length - 1]
  const previous = rounds.length > 1 ? rounds[rounds.length - 2] : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">진단 이력 비교</p>
        <h1 className="mt-1 text-xl font-bold text-navy-900">{company.company_name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {company.industry} · 완료된 진단 {rounds.length}회
        </p>
      </div>

      {rounds.length < 2 ? (
        <EmptyState
          title="비교할 진단 이력이 부족합니다"
          description="완료된 진단이 2회 이상 있어야 회차별 추이를 비교할 수 있습니다. 재진단을 진행한 뒤 다시 방문해 주세요."
          action={
            latest && (
              <Link
                to={`/assessments/${latest.assessmentId}/results`}
                className="text-sm font-medium text-navy-700 hover:underline"
              >
                최근 진단 결과 보기
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="종합 경영건강도 추이"
              subtitle={
                previous
                  ? `직전 대비 ${(latest.overallScore - previous.overallScore >= 0 ? '+' : '')}${(
                      latest.overallScore - previous.overallScore
                    ).toFixed(1)}점`
                  : undefined
              }
            />
            <OverallScoreTrendChart rounds={rounds} />
          </Card>

          <Card>
            <CardHeader title="영역별 점수 추이" subtitle="9개 진단영역 회차별 변화" />
            <CategoryTrendChart rounds={rounds} categories={categories} />
          </Card>

          <Card padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">진단영역</th>
                    {rounds.map((r) => (
                      <th key={r.label} className="px-4 py-3 text-right font-semibold">
                        {r.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-semibold">변화</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedCategories.map((c) => {
                    const first = rounds[0].scoresByCode[c.code] ?? 0
                    const last = rounds[rounds.length - 1].scoresByCode[c.code] ?? 0
                    const delta = last - first
                    return (
                      <tr key={c.code}>
                        <td className="px-4 py-3 font-medium text-navy-900">{c.name}</td>
                        {rounds.map((r) => (
                          <td key={r.label} className="px-4 py-3 text-right text-slate-600">
                            {(r.scoresByCode[c.code] ?? 0).toFixed(1)}
                          </td>
                        ))}
                        <td
                          className={`px-4 py-3 text-right font-semibold ${
                            delta > 0
                              ? 'text-severity-strong'
                              : delta < 0
                                ? 'text-severity-critical'
                                : 'text-slate-400'
                          }`}
                        >
                          {delta > 0 ? '+' : ''}
                          {delta.toFixed(1)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

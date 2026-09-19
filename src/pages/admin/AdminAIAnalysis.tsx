import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { listAssessments } from '@/services/assessments'
import { getSystemDynamicsAnalysis } from '@/services/systemDynamics'
import type { Assessment, Company } from '@/types/database'

export function AdminAIAnalysis() {
  const [rows, setRows] = useState<{ assessment: Assessment & { company: Company }; hasAnalysis: boolean }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const all = (await listAssessments()).filter((a) => a.status === 'completed')
      const withStatus = await Promise.all(
        all.map(async (assessment) => ({
          assessment,
          hasAnalysis: (await getSystemDynamicsAnalysis(assessment.id)) != null,
        })),
      )
      setRows(withStatus)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-sm text-slate-500">불러오는 중...</p>

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-navy-900">AI 분석결과 조회</h1>
      <p className="mb-6 text-sm text-slate-500">
        진단별 시스템 다이내믹스 분석(문제구조, 인과관계, 피드백 루프) 결과를 조회합니다. 현재
        단계에서는 데이터 구조만 연결되어 있으며 AI 파이프라인 연동 후 결과가 채워집니다.
      </p>

      {rows.length === 0 ? (
        <EmptyState title="완료된 진단이 없습니다" />
      ) : (
        <Card padded={false}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">기업명</th>
                <th className="px-4 py-3 font-semibold">진단일</th>
                <th className="px-4 py-3 font-semibold">AI 분석 상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ assessment, hasAnalysis }) => (
                <tr key={assessment.id}>
                  <td className="px-4 py-3 font-medium text-navy-900">
                    {assessment.company.company_name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(assessment.completed_at ?? assessment.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        hasAnalysis ? 'bg-emerald-50 text-severity-strong' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {hasAnalysis ? '분석 완료' : '미분석'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/assessments/${assessment.id}/deep-dive`}
                      className="text-sm font-medium text-navy-700 hover:underline"
                    >
                      상세보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

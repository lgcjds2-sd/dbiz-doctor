import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { listAssessments } from '@/services/assessments'
import type { Assessment, Company } from '@/types/database'

export function AssessmentList() {
  const [items, setItems] = useState<(Assessment & { company: Company })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAssessments()
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy-900">진단이력</h1>
        <Link to="/companies/new">
          <Button>신규 진단</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">불러오는 중입니다...</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="진단 이력이 없습니다"
          description="기업을 등록하고 첫 Quick Diagnosis를 진행해 보세요."
          action={
            <Link to="/companies/new">
              <Button>기업등록하기</Button>
            </Link>
          }
        />
      ) : (
        <Card padded={false}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">기업명</th>
                <th className="px-4 py-3 font-semibold">업종</th>
                <th className="px-4 py-3 font-semibold">상태</th>
                <th className="px-4 py-3 font-semibold">종합점수</th>
                <th className="px-4 py-3 font-semibold">등록일</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-navy-900">{item.company.company_name}</td>
                  <td className="px-4 py-3 text-slate-500">{item.company.industry}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.status === 'completed'
                          ? 'bg-emerald-50 text-severity-strong'
                          : 'bg-amber-50 text-severity-warning'
                      }`}
                    >
                      {item.status === 'completed' ? '완료' : '진행중'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.overall_score != null ? `${item.overall_score}점` : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(item.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={
                        item.status === 'completed'
                          ? `/assessments/${item.id}/results`
                          : `/assessments/${item.id}/survey`
                      }
                      className="text-sm font-medium text-navy-700 hover:underline"
                    >
                      {item.status === 'completed' ? '결과보기' : '이어하기'}
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

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { listAssessments } from '@/services/assessments'
import type { Assessment, Company } from '@/types/database'

export function AdminResults() {
  const [items, setItems] = useState<(Assessment & { company: Company })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAssessments()
      .then((all) => setItems(all.filter((a) => a.status === 'completed')))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-slate-500">불러오는 중...</p>

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-navy-900">진단결과 조회</h1>
      <p className="mb-6 text-sm text-slate-500">완료된 진단의 종합점수를 조회합니다.</p>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">완료된 진단이 없습니다.</p>
      ) : (
        <Card padded={false}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">기업명</th>
                <th className="px-4 py-3 font-semibold">완료일</th>
                <th className="px-4 py-3 font-semibold">종합점수</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-navy-900">{item.company.company_name}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.completed_at ? new Date(item.completed_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-navy-800">{item.overall_score}점</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/assessments/${item.id}/results`}
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

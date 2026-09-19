import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { listAssessments } from '@/services/assessments'
import type { Assessment, Company } from '@/types/database'

export function AdminReports() {
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
      <h1 className="mb-1 text-xl font-bold text-navy-900">진단보고서 조회</h1>
      <p className="mb-6 text-sm text-slate-500">완료된 진단의 경영진 보고서를 열람 및 인쇄할 수 있습니다.</p>

      {items.length === 0 ? (
        <EmptyState title="열람 가능한 보고서가 없습니다" description="완료된 진단이 생성되면 이곳에 표시됩니다." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Link key={item.id} to={`/assessments/${item.id}/report`}>
              <Card className="h-full hover:shadow-md">
                <p className="text-sm font-semibold text-navy-900">{item.company.company_name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.completed_at ? new Date(item.completed_at).toLocaleDateString('ko-KR') : ''} · 종합{' '}
                  {item.overall_score}점
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

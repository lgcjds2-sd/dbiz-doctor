import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { listCompanies } from '@/services/companies'
import { listAssessments } from '@/services/assessments'
import type { Assessment, Company } from '@/types/database'

export function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [assessments, setAssessments] = useState<(Assessment & { company: Company })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listCompanies(), listAssessments()])
      .then(([c, a]) => {
        setCompanies(c)
        setAssessments(a)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-slate-500">불러오는 중...</p>

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-navy-900">기업별 진단이력</h1>
      <p className="mb-6 text-sm text-slate-500">등록된 기업과 각 기업의 진단 이력을 확인합니다.</p>

      <div className="space-y-4">
        {companies.map((company) => {
          const companyAssessments = assessments.filter((a) => a.company_id === company.id)
          return (
            <Card key={company.id}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-navy-900">{company.company_name}</p>
                  <p className="text-xs text-slate-500">
                    {company.industry} · {company.revenue_range} · {company.employee_range}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  등록일 {new Date(company.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              {companyAssessments.length === 0 ? (
                <p className="text-xs text-slate-400">진단 이력이 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {companyAssessments.map((a) => (
                    <Link
                      key={a.id}
                      to={a.status === 'completed' ? `/assessments/${a.id}/results` : `/assessments/${a.id}/survey`}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-navy-700 hover:bg-slate-50"
                    >
                      {new Date(a.created_at).toLocaleDateString('ko-KR')} ·{' '}
                      {a.status === 'completed' ? `${a.overall_score}점` : '진행중'}
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

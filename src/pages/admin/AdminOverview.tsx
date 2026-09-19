import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'

const cards = [
  { to: '/admin/categories', title: '진단영역 관리', desc: '9개 진단영역의 이름/설명/순서를 관리합니다.' },
  { to: '/admin/questions', title: '설문문항 관리', desc: '27개 문항 추가, 수정, 업종별 활성화를 관리합니다.' },
  { to: '/admin/companies', title: '기업별 진단이력', desc: '등록된 기업과 진단 이력을 조회합니다.' },
  { to: '/admin/results', title: '진단결과 조회', desc: '완료된 진단의 영역별 점수를 조회합니다.' },
  { to: '/admin/reports', title: '진단보고서 조회', desc: '경영진 보고서를 열람/인쇄합니다.' },
  { to: '/admin/ai-analysis', title: 'AI 분석결과 조회', desc: '시스템 다이내믹스 분석 결과(다음 단계)를 조회합니다.' },
  { to: '/admin/causal-relationships', title: '인과관계 데이터 관리', desc: '업종별 인과관계 지식베이스를 관리합니다.' },
]

export function AdminOverview() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-navy-900">관리자 대시보드</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <p className="text-sm font-semibold text-navy-900">{c.title}</p>
              <p className="mt-1 text-xs text-slate-500">{c.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

import { NavLink, Outlet } from 'react-router-dom'

const groups = [
  {
    title: '설문 관리',
    items: [
      { to: '/admin/categories', label: '진단영역 관리' },
      { to: '/admin/questions', label: '설문문항 관리' },
    ],
  },
  {
    title: '진단 데이터',
    items: [
      { to: '/admin/companies', label: '기업별 진단이력' },
      { to: '/admin/results', label: '진단결과 조회' },
      { to: '/admin/reports', label: '진단보고서 조회' },
    ],
  },
  {
    title: '시스템 다이내믹스 (다음 단계)',
    items: [
      { to: '/admin/ai-analysis', label: 'AI 분석결과 조회' },
      { to: '/admin/causal-relationships', label: '인과관계 데이터 관리' },
    ],
  },
  {
    title: '계정',
    items: [
      { to: '/admin/users', label: '회원 관리' },
      { to: '/admin/consultant-profile', label: '경영지도사 정보 설정' },
    ],
  },
]

export function AdminLayout() {
  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6">
      <aside className="w-56 shrink-0">
        <p className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">관리자</p>
        <nav className="mt-3 space-y-6">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {group.title}
              </p>
              <div className="mt-1 space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-2 text-sm font-medium ${
                        isActive
                          ? 'bg-navy-800 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}

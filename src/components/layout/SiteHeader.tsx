import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: '홈', end: true },
  { to: '/companies/new', label: '기업등록' },
  { to: '/assessments', label: '진단이력' },
  { to: '/admin', label: '관리자' },
]

export function SiteHeader() {
  return (
    <header className="no-print border-b border-navy-900/10 bg-navy-950">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-gold-500 text-sm font-bold text-navy-950">
            D
          </span>
          <span className="text-sm font-semibold tracking-wide text-white">
            D-Biz Doctor
            <span className="ml-2 hidden text-xs font-normal text-slate-400 sm:inline">
              AI 경영진단 시스템
            </span>
          </span>
        </NavLink>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

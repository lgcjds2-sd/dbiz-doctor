import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { EmptyState } from '@/components/ui/EmptyState'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { session, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="px-4 py-16 text-center text-sm text-slate-500">불러오는 중...</div>
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="관리자 권한이 필요합니다"
          description="이 페이지는 관리자 계정만 접근할 수 있습니다."
        />
      </div>
    )
  }

  return <>{children}</>
}

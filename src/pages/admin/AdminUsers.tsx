import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { listAllProfiles, setUserAdmin } from '@/services/profile'
import { listCompanies } from '@/services/companies'
import type { Company, Profile } from '@/types/database'

export function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listAllProfiles(), listCompanies()])
      .then(([p, c]) => {
        setProfiles(p)
        setCompanies(c)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleToggleAdmin(profile: Profile) {
    setUpdatingId(profile.id)
    try {
      await setUserAdmin(profile.id, !profile.is_admin)
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, is_admin: !p.is_admin } : p)),
      )
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">불러오는 중...</p>

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-navy-900">회원 관리</h1>
      <p className="mb-6 text-sm text-slate-500">가입한 전체 회원 목록과 등록 기업 수를 확인합니다.</p>

      <Card padded={false}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">이름</th>
              <th className="px-4 py-3 font-semibold">소속</th>
              <th className="px-4 py-3 font-semibold">연락처</th>
              <th className="px-4 py-3 font-semibold">이메일</th>
              <th className="px-4 py-3 font-semibold">가입일</th>
              <th className="px-4 py-3 font-semibold">등록 기업 수</th>
              <th className="px-4 py-3 font-semibold">권한</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {profiles.map((p) => {
              const companyCount = companies.filter((c) => c.user_id === p.id).length
              const isSelf = p.id === currentUser?.id
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-navy-900">
                    {p.name || '-'}
                    {isSelf && <span className="ml-2 text-xs text-slate-400">(나)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.affiliation || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{p.phone || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{p.email}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(p.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{companyCount}개</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.is_admin ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.is_admin ? '관리자' : '일반회원'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isSelf && (
                      <button
                        onClick={() => handleToggleAdmin(p)}
                        disabled={updatingId === p.id}
                        className="text-xs font-medium text-navy-700 hover:underline disabled:opacity-50"
                      >
                        {updatingId === p.id
                          ? '변경 중...'
                          : p.is_admin
                            ? '관리자 해제'
                            : '관리자로 지정'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

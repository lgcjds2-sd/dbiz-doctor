import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { Field, TextInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/companies/new'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setError(error === 'Invalid login credentials' ? '이메일 또는 비밀번호가 올바르지 않습니다.' : error)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Card>
        <CardHeader title="로그인" subtitle="회원가입 시 등록한 이메일과 비밀번호를 입력해 주세요." />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="이메일" required>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
            />
          </Field>
          <Field label="비밀번호" required>
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-severity-critical">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? '로그인 중...' : '로그인'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="font-medium text-navy-700 hover:underline">
            회원가입
          </Link>
        </p>
      </Card>
    </div>
  )
}

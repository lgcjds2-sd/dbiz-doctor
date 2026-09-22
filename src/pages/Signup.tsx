import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { Field, TextInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

export function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error, needsEmailConfirmation } = await signUp(email, password, {
      name,
      affiliation,
      phone,
    })
    setSubmitting(false)
    if (error) {
      setError(error.includes('already registered') ? '이미 가입된 이메일입니다.' : error)
      return
    }
    if (needsEmailConfirmation) {
      setNeedsConfirmation(true)
      return
    }
    navigate('/companies/new', { replace: true })
  }

  if (needsConfirmation) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <Card>
          <CardHeader title="이메일을 확인해 주세요" />
          <p className="text-sm leading-relaxed text-slate-600">
            <strong>{email}</strong>로 인증 메일을 보냈습니다. 메일함에서 링크를 클릭해
            가입을 완료한 뒤 로그인해 주세요.
          </p>
          <Link to="/login" className="mt-4 inline-block text-sm font-medium text-navy-700 hover:underline">
            로그인 페이지로 이동
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Card>
        <CardHeader title="회원가입" subtitle="정보를 입력하고 경영진단을 시작하세요." />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="이름" required>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              required
              autoFocus
            />
          </Field>
          <Field label="소속(회사명)" required>
            <TextInput
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="예: (주)디비즈"
              required
            />
          </Field>
          <Field label="연락처" required>
            <TextInput
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              required
            />
          </Field>
          <Field label="이메일" required hint="로그인 시 아이디로 사용됩니다">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </Field>
          <Field label="비밀번호" required hint="6자 이상">
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>
          <Field label="비밀번호 확인" required>
            <TextInput
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-severity-critical">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? '가입 중...' : '회원가입'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-medium text-navy-700 hover:underline">
            로그인
          </Link>
        </p>
      </Card>
    </div>
  )
}

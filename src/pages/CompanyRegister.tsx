import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { Field, Select, TextArea, TextInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { createCompany } from '@/services/companies'
import { createAssessment } from '@/services/assessments'
import {
  EMPLOYEE_RANGE_OPTIONS,
  GROWTH_STAGE_OPTIONS,
  INDUSTRY_OPTIONS,
  REVENUE_RANGE_OPTIONS,
} from '@/data/options'

const initialForm = {
  company_name: '',
  industry: INDUSTRY_OPTIONS[0],
  sub_industry: '',
  revenue_range: REVENUE_RANGE_OPTIONS[0],
  employee_range: EMPLOYEE_RANGE_OPTIONS[0],
  growth_stage: GROWTH_STAGE_OPTIONS[0],
  main_products: '',
  key_challenge: '',
}

export function CompanyRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.company_name.trim()) {
      setError('기업명을 입력해 주세요.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const company = await createCompany(form)
      const assessment = await createAssessment(company.id)
      navigate(`/assessments/${assessment.id}/survey`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '기업 등록 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">STEP 1</p>
        <h1 className="mt-1 text-xl font-bold text-navy-900">기업등록</h1>
        <p className="mt-1 text-sm text-slate-500">
          경영진단을 시작하기 위해 기업의 기본 정보를 입력해 주세요.
        </p>
      </div>

      <Card>
        <CardHeader title="기업 기본정보" />
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="기업명" required>
            <TextInput
              value={form.company_name}
              onChange={(e) => update('company_name', e.target.value)}
              placeholder="예: (주)디비즈"
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="업종" required>
              <Select value={form.industry} onChange={(e) => update('industry', e.target.value)}>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="세부업종">
              <TextInput
                value={form.sub_industry}
                onChange={(e) => update('sub_industry', e.target.value)}
                placeholder="예: 정밀 화학소재 제조"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="최근 연매출 구간" required>
              <Select
                value={form.revenue_range}
                onChange={(e) => update('revenue_range', e.target.value)}
              >
                {REVENUE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="종업원 수" required>
              <Select
                value={form.employee_range}
                onChange={(e) => update('employee_range', e.target.value)}
              >
                {EMPLOYEE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="기업 성장단계" required>
              <Select
                value={form.growth_stage}
                onChange={(e) => update('growth_stage', e.target.value)}
              >
                {GROWTH_STAGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="주요 제품 또는 서비스">
            <TextArea
              value={form.main_products}
              onChange={(e) => update('main_products', e.target.value)}
              rows={2}
              placeholder="주력 제품/서비스를 간략히 설명해 주세요."
            />
          </Field>

          <Field label="현재 가장 중요한 경영문제">
            <TextArea
              value={form.key_challenge}
              onChange={(e) => update('key_challenge', e.target.value)}
              rows={3}
              placeholder="현재 회사가 직면한 가장 시급한 경영문제를 서술해 주세요."
            />
          </Field>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-severity-critical">{error}</p>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? '등록 중...' : '등록하고 진단 시작'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

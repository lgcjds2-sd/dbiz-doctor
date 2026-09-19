import { useEffect, useState } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, Select, TextArea, TextInput } from '@/components/ui/Field'
import {
  createCausalRelationship,
  deleteCausalRelationship,
  listCausalRelationships,
} from '@/services/causalRelationships'
import type { CausalRelationship } from '@/types/database'

const emptyDraft = {
  source_dimension: '',
  target_dimension: '',
  polarity: '+' as '+' | '-',
  delay_exists: false,
  relationship_description: '',
  confidence_score: 0.7,
  industry: '',
}

export function AdminCausalRelationships() {
  const [items, setItems] = useState<CausalRelationship[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState(emptyDraft)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    listCausalRelationships()
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!draft.source_dimension.trim() || !draft.target_dimension.trim()) return
    setCreating(true)
    try {
      const created = await createCausalRelationship({
        ...draft,
        industry: draft.industry || null,
      })
      setItems((prev) => [created, ...prev])
      setDraft(emptyDraft)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: number) {
    await deleteCausalRelationship(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  if (loading) return <p className="text-sm text-slate-500">불러오는 중...</p>

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-navy-900">인과관계 데이터 관리</h1>
      <p className="mb-6 text-sm text-slate-500">
        AI 시스템 다이내믹스 분석에 활용되는 업종별/공통 인과관계 지식베이스를 관리합니다.
        진단 차원 코드(diagnosis_dimension)를 source/target으로 사용합니다.
      </p>

      <Card className="mb-6">
        <CardHeader title="신규 인과관계 추가" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Source Dimension">
            <TextInput
              value={draft.source_dimension}
              onChange={(e) => setDraft((d) => ({ ...d, source_dimension: e.target.value }))}
              placeholder="예: sales_dependency"
            />
          </Field>
          <Field label="Target Dimension">
            <TextInput
              value={draft.target_dimension}
              onChange={(e) => setDraft((d) => ({ ...d, target_dimension: e.target.value }))}
              placeholder="예: profitability_management"
            />
          </Field>
          <Field label="극성 (Polarity)">
            <Select
              value={draft.polarity}
              onChange={(e) => setDraft((d) => ({ ...d, polarity: e.target.value as '+' | '-' }))}
            >
              <option value="+">+ (같은 방향)</option>
              <option value="-">- (반대 방향)</option>
            </Select>
          </Field>
          <Field label="시간지연 존재 여부">
            <Select
              value={draft.delay_exists ? 'true' : 'false'}
              onChange={(e) => setDraft((d) => ({ ...d, delay_exists: e.target.value === 'true' }))}
            >
              <option value="false">없음</option>
              <option value="true">있음</option>
            </Select>
          </Field>
          <Field label="신뢰도 (0~1)">
            <TextInput
              type="number"
              step="0.05"
              min={0}
              max={1}
              value={draft.confidence_score}
              onChange={(e) => setDraft((d) => ({ ...d, confidence_score: Number(e.target.value) }))}
            />
          </Field>
          <Field label="업종 (선택)">
            <TextInput
              value={draft.industry}
              onChange={(e) => setDraft((d) => ({ ...d, industry: e.target.value }))}
              placeholder="비워두면 업종 공통"
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="관계 설명">
            <TextArea
              rows={2}
              value={draft.relationship_description}
              onChange={(e) => setDraft((d) => ({ ...d, relationship_description: e.target.value }))}
            />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button disabled={creating} onClick={handleCreate}>
            {creating ? '추가 중...' : '인과관계 추가'}
          </Button>
        </div>
      </Card>

      <Card padded={false}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">극성</th>
              <th className="px-4 py-3 font-semibold">Target</th>
              <th className="px-4 py-3 font-semibold">지연</th>
              <th className="px-4 py-3 font-semibold">신뢰도</th>
              <th className="px-4 py-3 font-semibold">설명</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((rel) => (
              <tr key={rel.id}>
                <td className="px-4 py-3 font-mono text-xs text-navy-800">{rel.source_dimension}</td>
                <td className="px-4 py-3 text-center font-bold">
                  {rel.polarity === '+' ? (
                    <span className="text-severity-strong">+</span>
                  ) : (
                    <span className="text-severity-critical">-</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-navy-800">{rel.target_dimension}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{rel.delay_exists ? 'Delay' : '-'}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{rel.confidence_score}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{rel.relationship_description}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(rel.id)}
                    className="text-xs font-medium text-severity-critical hover:underline"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

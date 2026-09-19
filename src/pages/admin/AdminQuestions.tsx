import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, Select, TextArea, TextInput } from '@/components/ui/Field'
import {
  createQuestion,
  deleteQuestion,
  listAllQuestions,
  listCategories,
  updateQuestion,
} from '@/services/questions'
import type { Category, Question } from '@/types/database'

const emptyDraft = {
  category_id: 0,
  code: '',
  question_text: '',
  diagnosis_dimension: '',
}

export function AdminQuestions() {
  const [categories, setCategories] = useState<Category[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState(emptyDraft)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listCategories(), listAllQuestions()])
      .then(([cats, qs]) => {
        setCategories(cats)
        setQuestions(qs)
        if (cats.length > 0) setDraft((d) => ({ ...d, category_id: cats[0].id }))
      })
      .finally(() => setLoading(false))
  }, [])

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  async function handleCreate() {
    if (!draft.code.trim() || !draft.question_text.trim()) {
      setError('문항 코드와 질문 내용을 입력해 주세요.')
      return
    }
    setCreating(true)
    setError(null)
    try {
      const maxOrder = questions.reduce((m, q) => Math.max(m, q.display_order ?? 0), 0)
      const created = await createQuestion({
        ...draft,
        display_order: maxOrder + 1,
        is_active: true,
      })
      setQuestions((prev) => [...prev, created])
      setDraft((d) => ({ ...emptyDraft, category_id: d.category_id }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '문항 생성에 실패했습니다.')
    } finally {
      setCreating(false)
    }
  }

  async function toggleActive(q: Question) {
    const updated = await updateQuestion(q.id, { is_active: !q.is_active })
    setQuestions((prev) => prev.map((item) => (item.id === q.id ? updated : item)))
  }

  async function handleDelete(id: number) {
    await deleteQuestion(id)
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  if (loading) return <p className="text-sm text-slate-500">불러오는 중...</p>

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-navy-900">설문문항 관리</h1>
      <p className="mb-6 text-sm text-slate-500">
        전체 설문문항을 조회하고, 업종별/신규 문항을 추가하거나 비활성화할 수 있습니다.
      </p>

      <Card className="mb-6">
        <CardHeader title="신규 문항 추가" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Field label="진단영역">
            <Select
              value={draft.category_id}
              onChange={(e) => setDraft((d) => ({ ...d, category_id: Number(e.target.value) }))}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="문항 코드">
            <TextInput
              value={draft.code}
              onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
              placeholder="예: ST4"
            />
          </Field>
          <Field label="진단 차원(dimension)">
            <TextInput
              value={draft.diagnosis_dimension}
              onChange={(e) => setDraft((d) => ({ ...d, diagnosis_dimension: e.target.value }))}
              placeholder="예: strategy_clarity"
            />
          </Field>
          <div className="flex items-end">
            <Button className="w-full" disabled={creating} onClick={handleCreate}>
              {creating ? '추가 중...' : '문항 추가'}
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <Field label="질문 내용">
            <TextArea
              rows={2}
              value={draft.question_text}
              onChange={(e) => setDraft((d) => ({ ...d, question_text: e.target.value }))}
            />
          </Field>
        </div>
        {error && <p className="mt-3 text-sm text-severity-critical">{error}</p>}
      </Card>

      <div className="space-y-6">
        {categories.map((category) => {
          const items = questions
            .filter((q) => q.category_id === category.id)
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          if (items.length === 0) return null
          return (
            <Card key={category.id} padded={false}>
              <div className="border-b border-slate-200 px-5 py-3">
                <span className="text-sm font-semibold text-navy-900">
                  {category.code} · {category.name}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((q) => (
                  <div key={q.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="w-14 shrink-0 text-xs font-semibold text-slate-400">{q.code}</span>
                    <p className="flex-1 text-sm text-navy-800">{q.question_text}</p>
                    <span className="text-xs text-slate-400">{categoryById.get(q.category_id)?.name}</span>
                    <button
                      onClick={() => toggleActive(q)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        q.is_active ? 'bg-emerald-50 text-severity-strong' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {q.is_active ? '활성' : '비활성'}
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="text-xs font-medium text-severity-critical hover:underline"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

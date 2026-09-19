import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TextArea, TextInput } from '@/components/ui/Field'
import { listCategories, updateCategory } from '@/services/questions'
import type { Category } from '@/types/database'

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }, [])

  function updateLocal(id: number, patch: Partial<Category>) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  async function save(category: Category) {
    setSavingId(category.id)
    try {
      await updateCategory(category.id, {
        name: category.name,
        description: category.description,
        display_order: category.display_order,
      })
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">불러오는 중...</p>

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-navy-900">진단영역 관리</h1>
      <p className="mb-6 text-sm text-slate-500">9개 진단영역의 이름과 설명을 수정할 수 있습니다.</p>

      <div className="space-y-4">
        {categories.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start gap-4">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">
                {c.code}
              </span>
              <div className="flex-1 space-y-3">
                <TextInput
                  value={c.name}
                  onChange={(e) => updateLocal(c.id, { name: e.target.value })}
                />
                <TextArea
                  value={c.description ?? ''}
                  rows={2}
                  onChange={(e) => updateLocal(c.id, { description: e.target.value })}
                />
              </div>
              <Button variant="secondary" disabled={savingId === c.id} onClick={() => save(c)}>
                {savingId === c.id ? '저장 중...' : '저장'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

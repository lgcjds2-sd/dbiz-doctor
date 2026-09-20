import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { TextArea, TextInput } from '@/components/ui/Field'
import { StageHeader } from '@/components/stage/StageHeader'
import {
  ANALYSIS_STAGE_LABELS,
  createActionPlan,
  deleteActionPlan,
  listActionPlans,
  triggerSystemDynamicsAnalysis,
  updateActionPlan,
  type AnalysisStage,
} from '@/services/systemDynamics'
import type { ActionPhase, ActionPlan } from '@/types/database'

const PHASES: { key: ActionPhase; label: string }[] = [
  { key: '0-30', label: '0~30일: 문제 확인 및 Quick Win' },
  { key: '31-60', label: '31~60일: 프로세스와 정책 개선' },
  { key: '61-90', label: '61~90일: 시스템 정착 및 성과관리' },
]

type Draft = {
  action: string
  context: string
  owner: string
  kpi: string
  target: string
  due_date: string
  expected_effect: string
}

function toDraft(p: ActionPlan): Draft {
  return {
    action: p.action ?? '',
    context: p.context ?? '',
    owner: p.owner ?? '',
    kpi: p.kpi ?? '',
    target: p.target ?? '',
    due_date: p.due_date ?? '',
    expected_effect: p.expected_effect ?? '',
  }
}

function ActionPlanCard({
  plan,
  startEditing,
  onSaved,
  onDeleted,
}: {
  plan: ActionPlan
  startEditing?: boolean
  onSaved: (updated: ActionPlan) => void
  onDeleted: (id: string) => void
}) {
  const [editing, setEditing] = useState(!!startEditing)
  const [draft, setDraft] = useState<Draft>(toDraft(plan))
  const [saving, setSaving] = useState(false)

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await updateActionPlan(plan.id, {
        ...draft,
        due_date: draft.due_date || null,
      })
      onSaved(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraft(toDraft(plan))
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm('이 실행과제를 삭제할까요?')) return
    await deleteActionPlan(plan.id)
    onDeleted(plan.id)
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-md border border-navy-300 bg-navy-50/40 p-3 text-sm">
        <TextInput
          value={draft.action}
          onChange={(e) => update('action', e.target.value)}
          placeholder="실행과제명"
          className="font-medium"
        />
        <TextArea
          value={draft.context}
          onChange={(e) => update('context', e.target.value)}
          rows={2}
          placeholder="맥락 설명 (왜 이 시점에 이 과제를 하는지)"
          className="text-xs"
        />
        <div className="grid grid-cols-2 gap-2">
          <TextInput
            value={draft.owner}
            onChange={(e) => update('owner', e.target.value)}
            placeholder="담당"
            className="text-xs"
          />
          <TextInput
            type="date"
            value={draft.due_date}
            onChange={(e) => update('due_date', e.target.value)}
            className="text-xs"
          />
          <TextInput
            value={draft.kpi}
            onChange={(e) => update('kpi', e.target.value)}
            placeholder="KPI"
            className="text-xs"
          />
          <TextInput
            value={draft.target}
            onChange={(e) => update('target', e.target.value)}
            placeholder="목표"
            className="text-xs"
          />
        </div>
        <TextInput
          value={draft.expected_effect}
          onChange={(e) => update('expected_effect', e.target.value)}
          placeholder="기대효과"
          className="text-xs"
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleCancel} disabled={saving}>
            취소
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !draft.action.trim()}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group rounded-md border border-slate-200 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-navy-900">{plan.action}</p>
        <div className="flex shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-navy-600 hover:underline"
          >
            수정
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs font-medium text-severity-critical hover:underline"
          >
            삭제
          </button>
        </div>
      </div>
      {plan.context && <p className="mt-1 text-xs leading-5 text-slate-500">{plan.context}</p>}
      <p className="mt-1 text-xs text-slate-500">담당: {plan.owner || '-'}</p>
      <p className="text-xs text-slate-500">
        KPI: {plan.kpi || '-'} / 목표: {plan.target || '-'}
      </p>
      {plan.due_date && (
        <p className="mt-1 text-xs text-slate-400">
          기한: {new Date(plan.due_date).toLocaleDateString('ko-KR')}
        </p>
      )}
      {plan.expected_effect && (
        <p className="mt-1 text-xs text-severity-strong">기대효과: {plan.expected_effect}</p>
      )}
    </div>
  )
}

export function ActionPlanPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [stage, setStage] = useState<AnalysisStage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<ActionPlan[]>([])
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null)

  async function load() {
    if (!assessmentId) return
    setPlans(await listActionPlans(assessmentId))
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId])

  async function handleAnalyze() {
    if (!assessmentId) return
    setAnalyzing(true)
    setError(null)
    try {
      await triggerSystemDynamicsAnalysis(assessmentId, setStage)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 분석 실행 중 오류가 발생했습니다.')
    } finally {
      setAnalyzing(false)
      setStage(null)
    }
  }

  function handleSaved(updated: ActionPlan) {
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  function handleDeleted(id: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleAddTask(phase: ActionPhase) {
    if (!assessmentId) return
    const maxOrder = plans.reduce((m, p) => Math.max(m, p.display_order ?? 0), 0)
    const created = await createActionPlan({
      assessment_id: assessmentId,
      phase,
      display_order: maxOrder + 1,
    })
    setPlans((prev) => [...prev, created])
    setNewlyAddedId(created.id)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <StageHeader
        assessmentId={assessmentId!}
        step="STEP 9"
        title="90일 실행계획"
        description="선정된 레버리지 포인트를 기반으로 0~30일 / 31~60일 / 61~90일 단계별 실행계획을 수립합니다. 각 과제는 직접 수정·추가·삭제할 수 있습니다."
      />

      {analyzing && (
        <p className="no-print mb-6 rounded-md bg-amber-50 px-4 py-3 text-xs text-severity-warning">
          {stage ? ANALYSIS_STAGE_LABELS[stage] : '생성 중...'} 이 페이지를 벗어나도 서버에서
          계속 처리되니, 잠시 후 다시 방문하시면 결과를 확인할 수 있습니다.
        </p>
      )}

      {error && (
        <p className="no-print mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-severity-critical">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">불러오는 중입니다...</p>
      ) : plans.length > 0 ? (
        <div className="space-y-4">
          <div className="no-print flex justify-end">
            <Button variant="secondary" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? '재생성 중...' : 'AI로 다시 생성하기'}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {PHASES.map((phase) => (
              <Card key={phase.key}>
                <CardHeader title={phase.label} />
                <div className="space-y-3">
                  {plans
                    .filter((p) => p.phase === phase.key)
                    .map((p) => (
                      <ActionPlanCard
                        key={p.id}
                        plan={p}
                        startEditing={p.id === newlyAddedId}
                        onSaved={handleSaved}
                        onDeleted={handleDeleted}
                      />
                    ))}
                  <button
                    type="button"
                    onClick={() => handleAddTask(phase.key)}
                    className="no-print w-full rounded-md border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 hover:border-navy-400 hover:text-navy-700"
                  >
                    + 과제 추가
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="아직 수립된 실행계획이 없습니다"
          description="AI 심층질문 화면에서 'AI 분석 실행'을 누르면 action_plans 테이블에 결과가 저장되고 이 화면에 단계별 칸반 보드로 표시됩니다."
          action={
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? '생성 중...' : 'AI 분석 실행'}
            </Button>
          }
        />
      )}
    </div>
  )
}

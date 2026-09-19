import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { LIKERT_LABELS } from '@/data/options'
import { listCategories, listActiveQuestions } from '@/services/questions'
import {
  completeAssessment,
  getResponsesForAssessment,
  saveResponse,
} from '@/services/assessments'
import { calculateCategoryScores, calculateOverallScore, persistDiagnosisResults } from '@/services/diagnosis'
import type { Category, Question } from '@/types/database'

export function Diagnosis() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!assessmentId) return
    let cancelled = false
    async function load() {
      try {
        const [cats, qs, responses] = await Promise.all([
          listCategories(),
          listActiveQuestions(),
          getResponsesForAssessment(assessmentId!),
        ])
        if (cancelled) return
        setCategories(cats)
        setQuestions(qs)
        const existing: Record<number, number> = {}
        responses.forEach((r) => {
          if (r.score != null) existing[r.question_id] = r.score
        })
        setAnswers(existing)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '설문을 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [assessmentId])

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const currentQuestion = questions[currentIndex]
  const currentCategory = currentQuestion ? categoryById.get(currentQuestion.category_id) : undefined
  const answeredCount = Object.keys(answers).length
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0
  const isLastQuestion = currentIndex === questions.length - 1
  const canGoNext = currentQuestion ? answers[currentQuestion.id] != null : false

  async function selectScore(score: number) {
    if (!currentQuestion || !assessmentId) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: score }))
    try {
      await saveResponse(assessmentId, currentQuestion.id, score)
    } catch (err) {
      setError(err instanceof Error ? err.message : '응답 저장에 실패했습니다.')
    }
  }

  async function handleFinish() {
    if (!assessmentId) return
    setSubmitting(true)
    setError(null)
    try {
      const responses = await getResponsesForAssessment(assessmentId)
      const categoryScores = calculateCategoryScores(categories, questions, responses)
      const overallScore = calculateOverallScore(categoryScores)
      await persistDiagnosisResults(assessmentId, categoryScores)
      await completeAssessment(assessmentId, overallScore)
      navigate(`/assessments/${assessmentId}/results`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '결과 계산 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="px-4 py-16 text-center text-sm text-slate-500">설문을 불러오는 중입니다...</div>
  }

  if (!currentQuestion) {
    return (
      <div className="px-4 py-16 text-center text-sm text-slate-500">
        활성화된 설문문항이 없습니다. 관리자에서 설문문항을 등록해 주세요.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">STEP 2</p>
        <h1 className="mt-1 text-xl font-bold text-navy-900">Quick Diagnosis 설문</h1>
      </div>

      <ProgressBar value={progress} label={`진행률 (${answeredCount}/${questions.length})`} />

      <Card className="mt-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="rounded bg-navy-900 px-2 py-1 text-xs font-semibold text-white">
            {currentCategory?.name ?? ''}
          </span>
          <span className="text-xs font-medium text-slate-400">
            문항 {currentIndex + 1} / {questions.length}
          </span>
        </div>

        <p className="text-base font-medium leading-relaxed text-navy-900">
          {currentQuestion.question_text}
        </p>

        <div className="mt-6 space-y-2">
          {[1, 2, 3, 4, 5].map((score) => {
            const selected = answers[currentQuestion.id] === score
            return (
              <button
                key={score}
                type="button"
                onClick={() => selectScore(score)}
                className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                  selected
                    ? 'border-navy-700 bg-navy-50 font-semibold text-navy-900'
                    : 'border-slate-200 hover:border-navy-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    selected
                      ? 'border-navy-700 bg-navy-700 text-white'
                      : 'border-slate-300 text-slate-400'
                  }`}
                >
                  {score}
                </span>
                {LIKERT_LABELS[score]}
              </button>
            )
          })}
        </div>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-severity-critical">{error}</p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          >
            이전 문항
          </Button>

          {isLastQuestion ? (
            <Button
              type="button"
              disabled={!canGoNext || answeredCount < questions.length || submitting}
              onClick={handleFinish}
            >
              {submitting ? '결과 계산 중...' : '설문 완료 및 결과 보기'}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!canGoNext}
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            >
              다음 문항
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

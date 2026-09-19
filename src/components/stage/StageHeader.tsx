import { Link } from 'react-router-dom'

export function StageHeader({
  assessmentId,
  step,
  title,
  description,
}: {
  assessmentId: string
  step: string
  title: string
  description: string
}) {
  return (
    <div className="mb-6">
      <Link
        to={`/assessments/${assessmentId}/results`}
        className="text-xs font-medium text-slate-400 hover:text-navy-700"
      >
        ← 진단 결과로 돌아가기
      </Link>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gold-600">{step}</p>
      <h1 className="mt-1 text-xl font-bold text-navy-900">{title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
    </div>
  )
}

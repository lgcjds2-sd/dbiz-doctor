import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const PROCESS_STEPS = [
  '기업등록',
  'Quick Diagnosis 설문',
  '영역별 점수 계산',
  '취약영역 TOP 3 선정',
  '문제구조 분석',
  'AI 심층질문',
  '인과순환지도',
  '레버리지 포인트',
  '90일 실행계획',
  '경영진 진단보고서',
]

export function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="rounded-xl bg-navy-950 px-8 py-16 text-center text-white sm:px-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-500">
          System Dynamics-Based AI Diagnosis
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          D-Biz Doctor 중소기업 경영진단
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
          9개 진단영역, 27개 문항으로 경영건강도를 진단하고 시스템 다이내믹스 분석을 통해
          구조적 원인과 레버리지 포인트, 90일 실행계획까지 도출합니다.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/companies/new">
            <Button variant="primary" className="bg-gold-500 text-navy-950 hover:bg-gold-600">
              진단 시작하기
            </Button>
          </Link>
          <Link to="/assessments">
            <Button variant="secondary" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              진단이력 보기
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mt-8">
        <h2 className="text-sm font-semibold text-navy-900">핵심 프로세스</h2>
        <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {PROCESS_STEPS.map((step, index) => (
            <li
              key={step}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-center"
            >
              <span className="block text-xs font-semibold text-gold-600">STEP {index + 1}</span>
              <span className="mt-1 block text-xs font-medium text-navy-800">{step}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}

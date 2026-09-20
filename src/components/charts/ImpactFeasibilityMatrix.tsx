import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { LeveragePoint } from '@/types/database'

const DIFFICULTY_TO_FEASIBILITY: Record<string, number> = {
  낮음: 85,
  중간: 55,
  높음: 25,
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-navy-900">
        #{p.label} {p.name}
      </p>
      <p className="mt-1 text-slate-500">기대효과: {p.impact}점</p>
      <p className="text-slate-500">실행 용이성: {p.feasibilityDisplay}점</p>
    </div>
  )
}

export function ImpactFeasibilityMatrix({ points }: { points: LeveragePoint[] }) {
  // 실행난이도가 같은 포인트는 x좌표가 겹치므로, 점과 라벨이 서로 가리지 않도록
  // 항목마다 약간의 지터(jitter)를 부여한다.
  const seen = new Map<string, number>()
  const data = points.map((p, i) => {
    const feasibility = DIFFICULTY_TO_FEASIBILITY[p.implementation_difficulty ?? '중간'] ?? 50
    const count = seen.get(String(feasibility)) ?? 0
    seen.set(String(feasibility), count + 1)
    const jitter = (count % 2 === 0 ? 1 : -1) * Math.ceil(count / 2) * 6
    return {
      label: i + 1,
      name: p.leverage_point,
      impact: p.priority_score ?? 50,
      feasibility: feasibility + jitter,
      feasibilityDisplay: feasibility,
    }
  })

  return (
    <div>
      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 0 }}>
          <CartesianGrid stroke="#e2e8f0" />

          {/* 사분면 구분선 */}
          <ReferenceLine x={50} stroke="#cbd5e1" strokeDasharray="4 4" />
          <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="4 4" />

          {/* 사분면 라벨 (근사 위치) */}
          <text x="78%" y="12%" textAnchor="middle" fontSize={11} fontWeight={700} fill="#2f7a52">
            Quick Win
          </text>
          <text x="22%" y="12%" textAnchor="middle" fontSize={11} fontWeight={700} fill="#9c7a48">
            전략 과제
          </text>
          <text x="78%" y="92%" textAnchor="middle" fontSize={11} fill="#94a3b8">
            개선 검토
          </text>
          <text x="22%" y="92%" textAnchor="middle" fontSize={11} fill="#94a3b8">
            장기 보류
          </text>

          <XAxis
            type="number"
            dataKey="feasibility"
            name="실행 용이성"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            label={{ value: '실행 용이성 (Feasibility) →', position: 'insideBottom', offset: -8, fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="impact"
            name="기대효과"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            label={{ value: '기대효과 (Impact) →', angle: -90, position: 'insideLeft', fontSize: 11 }}
          />
          <ZAxis range={[200, 200]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
          <Scatter
            data={data}
            fill="#1f3760"
            label={{ dataKey: 'label', position: 'top', fill: '#16294a', fontSize: 12, fontWeight: 700 }}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {data.map((d) => (
          <span key={d.label}>
            <span className="font-semibold text-navy-800">#{d.label}</span> {d.name}
          </span>
        ))}
      </div>
    </div>
  )
}

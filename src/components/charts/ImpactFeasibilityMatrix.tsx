import {
  CartesianGrid,
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

export function ImpactFeasibilityMatrix({ points }: { points: LeveragePoint[] }) {
  const data = points.map((p) => ({
    name: p.leverage_point,
    impact: p.priority_score ?? 50,
    feasibility: DIFFICULTY_TO_FEASIBILITY[p.implementation_difficulty ?? '중간'] ?? 50,
  }))

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 0 }}>
        <CartesianGrid stroke="#e2e8f0" />
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
        <ZAxis range={[160, 160]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(value, key) => [
            `${value}`,
            key === 'impact' ? '기대효과' : key === 'feasibility' ? '실행 용이성' : `${key}`,
          ]}
          labelFormatter={() => ''}
          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#cbd5e1' }}
        />
        <Scatter data={data} fill="#1f3760" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

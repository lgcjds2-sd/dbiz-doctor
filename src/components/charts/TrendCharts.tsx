import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Category } from '@/types/database'

export interface RoundPoint {
  assessmentId: string
  label: string
  overallScore: number
  scoresByCode: Record<string, number>
}

const CATEGORY_COLORS = [
  '#1f3760', // navy
  '#b8925a', // gold
  '#2f7a52', // strong
  '#b3413c', // critical
  '#3d5f96', // stable
  '#9c7a48', // gold-600
  '#5b21b6', // violet
  '#0f766e', // teal
  '#a16207', // amber-800
]

export function OverallScoreTrendChart({ rounds }: { rounds: RoundPoint[] }) {
  const data = rounds.map((r) => ({ label: r.label, 종합점수: r.overallScore }))
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#cbd5e1' }} />
        <Line
          type="monotone"
          dataKey="종합점수"
          stroke="#1f3760"
          strokeWidth={3}
          dot={{ r: 4, fill: '#1f3760' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CategoryTrendChart({
  rounds,
  categories,
}: {
  rounds: RoundPoint[]
  categories: Category[]
}) {
  const sorted = [...categories].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  const data = rounds.map((r) => {
    const row: Record<string, string | number> = { label: r.label }
    sorted.forEach((c) => {
      row[c.name] = r.scoresByCode[c.code] ?? 0
    })
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#cbd5e1' }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {sorted.map((c, i) => (
          <Line
            key={c.code}
            type="monotone"
            dataKey={c.name}
            stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

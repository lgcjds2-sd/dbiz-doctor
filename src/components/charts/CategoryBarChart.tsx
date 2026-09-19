import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Category, DiagnosisResult, SeverityLevel } from '@/types/database'

const SEVERITY_COLOR: Record<SeverityLevel, string> = {
  critical: '#b3413c',
  warning: '#c08a2e',
  stable: '#3d5f96',
  strong: '#2f7a52',
}

export function CategoryBarChart({
  results,
}: {
  results: (DiagnosisResult & { category: Category })[]
}) {
  const data = [...results]
    .sort((a, b) => (a.category.display_order ?? 0) - (b.category.display_order ?? 0))
    .map((r) => ({
      name: r.category.name,
      score: r.normalized_score ?? 0,
      severity: r.severity_level ?? 'stable',
    }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip
          formatter={(value) => [`${value}점`, '환산점수']}
          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#cbd5e1' }}
        />
        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={SEVERITY_COLOR[entry.severity as SeverityLevel]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

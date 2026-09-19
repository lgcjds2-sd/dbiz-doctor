import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import type { Category, DiagnosisResult } from '@/types/database'

export function CategoryRadarChart({
  results,
}: {
  results: (DiagnosisResult & { category: Category })[]
}) {
  const data = [...results]
    .sort((a, b) => (a.category.display_order ?? 0) - (b.category.display_order ?? 0))
    .map((r) => ({
      name: r.category.name,
      score: r.normalized_score ?? 0,
    }))

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="#cbd5e1" />
        <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <Radar
          name="영역 점수"
          dataKey="score"
          stroke="#1f3760"
          fill="#1f3760"
          fillOpacity={0.35}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

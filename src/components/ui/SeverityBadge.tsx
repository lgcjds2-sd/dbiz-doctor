import type { SeverityLevel } from '@/types/database'
import { SEVERITY_LABEL } from '@/services/diagnosis'

const colorClasses: Record<SeverityLevel, string> = {
  critical: 'bg-red-50 text-severity-critical border-red-200',
  warning: 'bg-amber-50 text-severity-warning border-amber-200',
  stable: 'bg-blue-50 text-severity-stable border-blue-200',
  strong: 'bg-emerald-50 text-severity-strong border-emerald-200',
}

export function SeverityBadge({ level }: { level: SeverityLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorClasses[level]}`}
    >
      {SEVERITY_LABEL[level]}
    </span>
  )
}

import { cn, PRIORITY_LABELS } from '@/lib/utils'
import type { Priority } from '@/types/app'

const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const PRIORITY_DOT: Record<Priority, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

interface PriorityBadgeProps {
  priority: Priority
  showLabel?: boolean
  className?: string
}

export function PriorityBadge({ priority, showLabel = true, className }: PriorityBadgeProps) {
  if (!showLabel) {
    return (
      <span
        className={cn('inline-block w-2.5 h-2.5 rounded-full flex-shrink-0', PRIORITY_DOT[priority], className)}
        title={PRIORITY_LABELS[priority]}
      />
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', PRIORITY_STYLES[priority], className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_DOT[priority])} />
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, formatDate, isOverdue } from '@/lib/utils'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Task } from '@/types/app'
import { CalendarDays, MessageSquare } from 'lucide-react'

interface TaskCardProps {
  task: Task
  onOpen: (task: Task) => void
  isDragOverlay?: boolean
}

export function TaskCard({ task, onOpen, isDragOverlay }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task, columnId: task.column_id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onOpen(task)}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-3 cursor-pointer select-none',
        'hover:shadow-md hover:border-indigo-200 transition-all',
        isDragging && 'opacity-40 shadow-none',
        isDragOverlay && 'shadow-xl rotate-1 opacity-100',
      )}
    >
      {/* Priority dot + title */}
      <div className="flex items-start gap-2 mb-2">
        <PriorityBadge priority={task.priority} showLabel={false} className="mt-1" />
        <p className="text-sm font-medium text-gray-900 leading-snug flex-1">{task.title}</p>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-medium">
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer: assignee + due date */}
      <div className="flex items-center justify-between gap-2 mt-1">
        {task.assignee ? (
          <Avatar className="w-5 h-5 flex-shrink-0">
            <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700 font-semibold">
              {initials(task.assignee.full_name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2 ml-auto">
          {task.due_date && (
            <span className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue(task.due_date) ? 'text-red-600 font-medium' : 'text-gray-400'
            )}>
              <CalendarDays className="w-3 h-3" />
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

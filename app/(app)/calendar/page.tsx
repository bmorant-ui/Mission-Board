'use client'
import { useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, parseISO, isValid } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { useGrants } from '@/lib/queries/grants'
import { useProjects } from '@/lib/queries/projects'
import { useAllTasksDue } from '@/lib/queries/tasks'
import type { CalendarEvent } from '@/types/app'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
})

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#dc2626',
  high:   '#f97316',
  medium: '#6366f1',
  low:    '#6b7280',
}

export default function CalendarPage() {
  const { data: grants,   isLoading: grantsLoading   } = useGrants()
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const { data: dueTasks, isLoading: tasksLoading    } = useAllTasksDue()

  const loading = grantsLoading || projectsLoading || tasksLoading

  const events = useMemo((): CalendarEvent[] => {
    const result: CalendarEvent[] = []

    // Task due dates
    dueTasks?.forEach(task => {
      const d = parseISO(task.due_date!)
      if (!isValid(d)) return
      const proj = Array.isArray(task.project) ? task.project[0] : task.project as { id: string; name: string; color: string } | null
      result.push({
        id: `task-${task.id}`,
        title: `✅ ${task.title}${proj ? ` · ${proj.name}` : ''}`,
        start: d,
        end: d,
        type: 'task',
        color: PRIORITY_COLORS[task.priority] ?? '#6366f1',
      })
    })

    // Grant deadlines
    grants?.forEach(grant => {
      if (grant.deadline) {
        const d = parseISO(grant.deadline)
        if (isValid(d)) {
          result.push({
            id: `grant-deadline-${grant.id}`,
            title: `📋 ${grant.title} (deadline)`,
            start: d,
            end: d,
            type: 'grant_deadline',
            resource: grant,
            color: '#ef4444',
          })
        }
      }
      if (grant.report_due) {
        const d = parseISO(grant.report_due)
        if (isValid(d)) {
          result.push({
            id: `grant-report-${grant.id}`,
            title: `📊 ${grant.title} (report due)`,
            start: d,
            end: d,
            type: 'grant_report',
            resource: grant,
            color: '#f97316',
          })
        }
      }
    })

    // Project end dates
    projects?.forEach(project => {
      if (project.end_date) {
        const d = parseISO(project.end_date)
        if (isValid(d)) {
          result.push({
            id: `project-end-${project.id}`,
            title: `🏁 ${project.name} ends`,
            start: d,
            end: d,
            type: 'task',
            color: project.color,
          })
        }
      }
    })

    return result
  }, [grants, projects, dueTasks])

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Task due dates, grant deadlines, and project milestones</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />Task (medium)</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />Task (high)</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />Task (urgent) / Grant deadline</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-500 inline-block" />Task (low)</span>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 min-h-[500px] calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: 500 }}
          eventPropGetter={event => ({
            style: {
              backgroundColor: event.color ?? '#6366f1',
              borderColor: 'transparent',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 500,
              borderRadius: '4px',
            },
          })}
          views={['month', 'week', 'agenda']}
          defaultView="month"
          tooltipAccessor={event => event.title}
        />
      </div>

      <style jsx global>{`
        .calendar-container .rbc-toolbar button {
          font-size: 0.875rem;
          padding: 6px 12px;
          border-radius: 6px;
          border-color: #e5e7eb;
          color: #374151;
        }
        .calendar-container .rbc-toolbar button.rbc-active {
          background-color: #6366f1;
          border-color: #6366f1;
          color: white;
        }
        .calendar-container .rbc-toolbar button:hover {
          background-color: #f3f4f6;
        }
        .calendar-container .rbc-today {
          background-color: #eef2ff;
        }
        .calendar-container .rbc-header {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px 4px;
        }
      `}</style>
    </div>
  )
}

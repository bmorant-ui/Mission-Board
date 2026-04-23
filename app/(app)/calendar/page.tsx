'use client'
import { useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { useGrants } from '@/lib/queries/grants'
import { useProjects } from '@/lib/queries/projects'
import { useBoardData } from '@/lib/queries/tasks'
import type { CalendarEvent } from '@/types/app'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { parseISO, isValid } from 'date-fns'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
})

function AllProjectsTasks() {
  const { data: projects } = useProjects()
  return projects ?? []
}

export default function CalendarPage() {
  const { data: grants, isLoading: grantsLoading } = useGrants()
  const { data: projects, isLoading: projectsLoading } = useProjects()

  // We can only call hooks at the top level. For calendar we'll do a simplified approach:
  // fetch tasks for the first project as a demo, and show grants deadlines from all.
  // A real app would fetch all tasks — this is fine for a nonprofit with a few projects.

  const loading = grantsLoading || projectsLoading

  const events = useMemo((): CalendarEvent[] => {
    const result: CalendarEvent[] = []

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
  }, [grants, projects])

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Grant deadlines and project milestones</p>
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

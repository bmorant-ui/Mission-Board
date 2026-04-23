'use client'
import { use } from 'react'
import { useProjectMembers } from '@/lib/queries/projects'
import { useVolunteerAssignments } from '@/lib/queries/volunteers'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { cn, VOLUNTEER_STATUS_COLORS } from '@/lib/utils'

export default function TeamPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const { data: members, isLoading: loadingMembers } = useProjectMembers(projectId)
  const { data: assignments, isLoading: loadingAssignments } = useVolunteerAssignments(undefined, projectId)

  const loading = loadingMembers || loadingAssignments

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Team members */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h2>
        {!members || members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No team members"
            description="Team members are added when they join this project."
            className="py-8"
          />
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
                    {initials(member.profile?.full_name ?? 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{member.profile?.full_name}</p>
                  <p className="text-xs text-gray-400">{member.profile?.full_name}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">{member.role}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Volunteers */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Volunteers</h2>
        {!assignments || assignments.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No volunteers assigned"
            description="Go to Volunteers to assign volunteers to this project."
            className="py-8"
          />
        ) : (
          <div className="space-y-2">
            {assignments.map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-violet-100 text-violet-700 text-sm font-semibold">
                    {initials(a.volunteer?.full_name ?? 'V')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{a.volunteer?.full_name}</p>
                  <p className="text-xs text-gray-400">{a.role_title ?? 'Volunteer'}{a.hours_per_week ? ` · ${a.hours_per_week}h/week` : ''}</p>
                </div>
                {a.volunteer?.status && (
                  <Badge className={cn('text-xs font-medium border-0', VOLUNTEER_STATUS_COLORS[a.volunteer.status])}>
                    {a.volunteer.status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

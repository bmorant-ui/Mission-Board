'use client'
import Link from 'next/link'
import { useProjects } from '@/lib/queries/projects'
import { useGrants } from '@/lib/queries/grants'
import { useVolunteers } from '@/lib/queries/volunteers'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderOpen, DollarSign, Users, ArrowRight, AlertCircle, Plus } from 'lucide-react'
import { formatDate, formatCurrency, daysUntil, GRANT_STATUS_COLORS, cn } from '@/lib/utils'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export default function DashboardPage() {
  const { profile } = useCurrentUser()
  const { data: projects, isLoading: loadingProjects } = useProjects()
  const { data: grants, isLoading: loadingGrants } = useGrants()
  const { data: volunteers } = useVolunteers()

  const loading = loadingProjects || loadingGrants

  if (loading) return <LoadingSpinner />

  const urgentGrants = grants?.filter(g => {
    const days = daysUntil(g.deadline)
    return days !== null && days <= 14 && days >= 0 && g.status !== 'awarded' && g.status !== 'rejected' && g.status !== 'closed'
  }) ?? []

  const activeVolunteers = volunteers?.filter(v => v.status === 'active').length ?? 0
  const totalAwarded = grants?.filter(g => g.status === 'awarded').reduce((s, g) => s + (g.amount_awarded ?? 0), 0) ?? 0

  const greeting = profile
    ? `Welcome back, ${profile.full_name.split(' ')[0]}!`
    : 'Welcome to MissionBoard'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{greeting}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening across your organization</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Active Projects',
            value: projects?.length ?? 0,
            icon: FolderOpen,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            href: '/projects',
          },
          {
            label: 'Grants Tracked',
            value: grants?.length ?? 0,
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-50',
            href: '/grants',
          },
          {
            label: 'Active Volunteers',
            value: activeVolunteers,
            icon: Users,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            href: '/volunteers',
          },
          {
            label: 'Total Awarded',
            value: formatCurrency(totalAwarded),
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            href: '/grants',
          },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 h-full">
                <CardContent className="p-4">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', stat.bg)}>
                    <Icon className={cn('w-5 h-5', stat.color)} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Urgent grants */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                {urgentGrants.length > 0 && <AlertCircle className="w-4 h-4 text-orange-500" />}
                Upcoming Deadlines
              </CardTitle>
              <Link href="/grants" className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {urgentGrants.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400">No deadlines in the next 14 days 🎉</p>
              </div>
            ) : (
              <div className="space-y-2">
                {urgentGrants.map(grant => {
                  const days = daysUntil(grant.deadline)
                  return (
                    <div key={grant.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{grant.title}</p>
                        <p className="text-xs text-gray-400">{grant.funder_name}</p>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <span className={cn(
                          'text-xs font-semibold',
                          days !== null && days <= 7 ? 'text-red-600' : 'text-orange-500'
                        )}>
                          {days === 0 ? 'Today!' : `${days}d left`}
                        </span>
                        <p className="text-xs text-gray-400">{formatDate(grant.deadline)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent projects */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Projects</CardTitle>
              <Link href="/projects" className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!projects || projects.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No projects yet"
                description="Create your first project to get started."
                className="py-6"
                action={
                  <Link href="/projects" className={cn(buttonVariants({ size: 'sm' }), 'bg-indigo-600 hover:bg-indigo-700')}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    New project
                  </Link>
                }
              />
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 5).map(project => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}/board`}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                      <p className="text-sm font-medium text-gray-900">{project.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {project.end_date && (
                        <span className="text-xs text-gray-400">{formatDate(project.end_date)}</span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent grants */}
        <Card className="border-gray-200 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Grant Pipeline</CardTitle>
              <Link href="/grants" className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!grants || grants.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="No grants tracked"
                description="Add your first grant to start tracking the pipeline."
                className="py-6"
                action={
                  <Link href="/grants" className={cn(buttonVariants({ size: 'sm' }), 'bg-indigo-600 hover:bg-indigo-700')}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add grant
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {(['research', 'drafting', 'submitted', 'awarded', 'rejected', 'closed'] as const).map(status => {
                  const count = grants.filter(g => g.status === status).length
                  return (
                    <div key={status} className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xl font-bold text-gray-900">{count}</p>
                      <Badge className={cn('text-xs mt-1 border-0 font-medium', GRANT_STATUS_COLORS[status])}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

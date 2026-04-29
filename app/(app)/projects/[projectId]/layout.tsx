'use client'
import { use } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProject } from '@/lib/queries/projects'
import { cn } from '@/lib/utils'
import { LayoutGrid, DollarSign, Users } from 'lucide-react'

const TABS = [
  { label: 'Board', href: 'board', icon: LayoutGrid },
  { label: 'Budget', href: 'budget', icon: DollarSign },
  { label: 'Team', href: 'team', icon: Users },
]

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  const pathname = usePathname()
  const { data: project } = useProject(projectId)

  return (
    <div className="flex flex-col h-full">
      {/* Project header + tabs */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          {project && (
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
          )}
          <h1 className="text-lg font-bold text-gray-900">{project?.name ?? '...'}</h1>
          {project?.description && (
            <span className="text-sm text-gray-400 hidden sm:inline">— {project.description}</span>
          )}
        </div>
        <nav className="flex gap-0">
          {TABS.map(tab => {
            const href = `/projects/${projectId}/${tab.href}`
            const active = pathname === href
            const Icon = tab.icon
            return (
              <Link
                key={tab.href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  active
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Mobile swipe hint — only on board tab */}
      {pathname.endsWith('/board') && (
        <div className="sm:hidden bg-indigo-50 border-b border-indigo-100 px-4 py-1.5 text-xs text-indigo-600 text-center flex-shrink-0">
          ← Swipe to see all columns →
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

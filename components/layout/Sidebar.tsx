'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useProjects } from '@/lib/queries/projects'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  FolderOpen,
  DollarSign,
  Users,
  Calendar,
  LogOut,
  ChevronRight,
  Settings,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/grants', label: 'Grants', icon: DollarSign },
  { href: '/volunteers', label: 'Volunteers', icon: Users },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: projects } = useProjects()
  const { profile } = useCurrentUser()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    toast.success('Signed out')
  }

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <aside className="flex flex-col w-60 border-r border-gray-200 bg-white h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-200 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900 text-sm">MissionBoard</span>
      </div>

      <ScrollArea className="flex-1 py-3">
        {/* Main nav */}
        <nav className="px-2 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Separator className="my-3 mx-2" />

        {/* Projects */}
        <div className="px-2">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</span>
            <Link
              href="/projects"
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-0.5">
            {projects?.slice(0, 8).map(project => {
              const isActive = pathname.startsWith(`/projects/${project.id}`)
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}/board`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors group',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate flex-1">{project.name}</span>
                  <ChevronRight className={cn(
                    'w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                    isActive && 'opacity-100'
                  )} />
                </Link>
              )
            })}
            {(!projects || projects.length === 0) && (
              <p className="px-3 py-2 text-xs text-gray-400 italic">No projects yet</p>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Settings (admin only) */}
      {profile?.role === 'admin' && (
        <>
          <Separator className="my-1 mx-2" />
          <nav className="px-2 pb-2">
            <Link
              href="/settings/team"
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith('/settings')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              Settings
            </Link>
          </nav>
        </>
      )}

      {/* User footer */}
      <div className="border-t border-gray-200 p-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
              {profile ? initials(profile.full_name || 'U') : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-gray-400 capitalize">{profile?.role || 'member'}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-gray-400 hover:text-gray-600 flex-shrink-0"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}

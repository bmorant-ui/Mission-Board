'use client'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/grants': 'Grants',
  '/volunteers': 'Volunteers',
  '/calendar': 'Calendar',
}

function getBreadcrumb(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
  if (pathname.startsWith('/projects/') && pathname.endsWith('/board')) return 'Board'
  if (pathname.startsWith('/projects/') && pathname.endsWith('/budget')) return 'Budget'
  if (pathname.startsWith('/projects/') && pathname.endsWith('/team')) return 'Team'
  if (pathname.startsWith('/grants/')) return 'Grant Detail'
  if (pathname.startsWith('/volunteers/')) return 'Volunteer Profile'
  return 'MissionBoard'
}

export function TopBar() {
  const pathname = usePathname()

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-3 flex-shrink-0">
      {/* Mobile sidebar trigger */}
      <Sheet>
        <SheetTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'md:hidden w-8 h-8 text-gray-500')}>
          <Menu className="w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-60">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <span className="text-sm font-medium text-gray-500">{getBreadcrumb(pathname)}</span>
    </header>
  )
}

'use client'
import { useState } from 'react'
import { Bell, CheckCheck, ClipboardList, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from '@/lib/queries/notifications'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { profile } = useCurrentUser()
  const { data: notifications } = useNotifications()
  const unreadCount = useUnreadCount()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  // Subscribe to real-time notifications
  useRealtimeNotifications(profile?.id)

  function handleOpen() {
    setOpen(prev => !prev)
  }

  async function handleMarkRead(id: string, read: boolean) {
    if (!read) await markRead.mutateAsync(id)
  }

  const icons: Record<string, React.ReactNode> = {
    task_assigned: <ClipboardList className="w-4 h-4 text-indigo-500" />,
    project_added: <FolderOpen className="w-4 h-4 text-violet-500" />,
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative w-8 h-8 text-gray-500 hover:text-gray-700"
        onClick={handleOpen}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-10 z-50 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {!notifications || notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleMarkRead(n.id, n.read)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                      !n.read && 'bg-indigo-50/50'
                    )}
                  >
                    <div className="mt-0.5 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {icons[n.type] ?? <Bell className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm text-gray-900', !n.read && 'font-semibold')}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

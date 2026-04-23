'use client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useAllProfiles, useUpdateProfileRole } from '@/lib/queries/profiles'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Shield, Users } from 'lucide-react'

const ROLES = [
  { value: 'admin',   label: 'Admin',   description: 'Full access' },
  { value: 'manager', label: 'Manager', description: 'Manage projects & grants' },
  { value: 'member',  label: 'Member',  description: 'Standard access' },
  { value: 'viewer',  label: 'Viewer',  description: 'Read-only' },
]

const ROLE_COLORS: Record<string, string> = {
  admin:   'bg-red-100 text-red-700',
  manager: 'bg-amber-100 text-amber-700',
  member:  'bg-indigo-100 text-indigo-700',
  viewer:  'bg-gray-100 text-gray-600',
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function TeamSettingsPage() {
  const { profile: currentUser, loading: userLoading } = useCurrentUser()
  const { data: profiles, isLoading } = useAllProfiles()
  const updateRole = useUpdateProfileRole()

  if (userLoading || isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
        <Shield className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500 font-medium">Admin access required</p>
        <p className="text-sm text-gray-400">Only admins can manage team roles.</p>
      </div>
    )
  }

  async function handleRoleChange(userId: string, role: string) {
    try {
      await updateRole.mutateAsync({ id: userId, role })
      toast.success('Role updated')
    } catch {
      toast.error('Failed to update role')
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Team Members
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage roles for everyone who has signed up to MissionBoard.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {profiles?.map(profile => {
          const isCurrentUser = profile.id === currentUser?.id
          return (
            <div key={profile.id} className="flex items-center gap-4 px-5 py-4">
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
                  {initials(profile.full_name || 'U')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile.full_name || 'Unnamed user'}
                  </p>
                  {isCurrentUser && (
                    <span className="text-xs text-gray-400 font-normal">(you)</span>
                  )}
                </div>
                {(profile as { email?: string }).email && (
                  <p className="text-xs text-gray-400 truncate">
                    {(profile as { email?: string }).email}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge className={`text-xs capitalize hidden sm:inline-flex ${ROLE_COLORS[profile.role] || ROLE_COLORS.member}`}>
                  {profile.role}
                </Badge>

                <Select
                  value={profile.role}
                  onValueChange={(val) => {
                    if (val) handleRoleChange(profile.id, val)
                  }}
                  disabled={isCurrentUser || updateRole.isPending}
                >
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        <div>
                          <span className="font-medium">{r.label}</span>
                          <span className="text-xs text-gray-400 ml-1.5">{r.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        })}

        {profiles?.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            No team members yet.
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Your own role cannot be changed here — ask another admin to update it.
      </p>
    </div>
  )
}

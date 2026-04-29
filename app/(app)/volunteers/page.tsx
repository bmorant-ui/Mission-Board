'use client'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { volunteerSchema, type VolunteerFormValues } from '@/lib/validations/volunteer.schema'
import { useVolunteers, useCreateVolunteer, useUpdateVolunteer, useDeleteVolunteer, useAssignVolunteer } from '@/lib/queries/volunteers'
import { useProjects } from '@/lib/queries/projects'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonGrid } from '@/components/shared/Skeleton'
import { TagInput } from '@/components/shared/TagInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Users, Plus, MoreHorizontal, Pencil, Trash2, Loader2, UserPlus, Search } from 'lucide-react'
import { VOLUNTEER_STATUS_COLORS, cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { Resolver } from 'react-hook-form'
import type { Volunteer } from '@/types/app'
import { toast } from 'sonner'

export default function VolunteersPage() {
  const { data: volunteers, isLoading } = useVolunteers()
  const { data: projects } = useProjects()
  const createVolunteer = useCreateVolunteer()
  const updateVolunteer = useUpdateVolunteer()
  const deleteVolunteer = useDeleteVolunteer()
  const assignVolunteer = useAssignVolunteer()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Volunteer | null>(null)
  const [assigning, setAssigning] = useState<Volunteer | null>(null)
  const [assignProjectId, setAssignProjectId] = useState<string | null>(null)
  const [assignRole, setAssignRole] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { register, control, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<VolunteerFormValues>({
    resolver: zodResolver(volunteerSchema) as unknown as Resolver<VolunteerFormValues>,
    defaultValues: { status: 'pending', skills: [], full_name: '' },
  })

  function openCreate() {
    reset({ status: 'pending', skills: [], full_name: '' })
    setEditing(null)
    setOpen(true)
  }

  function openEdit(v: Volunteer) {
    reset({ full_name: v.full_name, email: v.email ?? '', phone: v.phone ?? '', status: v.status, skills: v.skills, notes: v.notes ?? '' })
    setEditing(v)
    setOpen(true)
  }

  async function onSubmit(values: VolunteerFormValues) {
    try {
      if (editing) {
        await updateVolunteer.mutateAsync({ id: editing.id, ...values })
        toast.success('Volunteer updated')
      } else {
        await createVolunteer.mutateAsync(values)
        toast.success('Volunteer added')
      }
      setOpen(false)
      reset()
    } catch {
      toast.error('Failed to save volunteer')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteVolunteer.mutateAsync(id)
      toast.success('Volunteer removed')
    } catch {
      toast.error('Failed to remove volunteer')
    }
  }

  async function handleAssign() {
    if (!assigning) return
    if (!assignProjectId) return
    try {
      await assignVolunteer.mutateAsync({
        volunteer_id: assigning.id,
        project_id: assignProjectId,
        role_title: assignRole || undefined,
      })
      toast.success(`${assigning.full_name} assigned to project`)
      setAssigning(null)
      setAssignProjectId('')
      setAssignRole('')
    } catch {
      toast.error('Failed to assign volunteer (may already be assigned)')
    }
  }

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (isLoading) return <SkeletonGrid count={6} />

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Volunteers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {volunteers?.filter(v => v.status === 'active').length ?? 0} active ·{' '}
            {volunteers?.length ?? 0} total
          </p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add volunteer
        </Button>
      </div>

      {volunteers?.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No volunteers yet"
          description="Track your volunteer roster, their skills, and project assignments."
          action={
            <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add first volunteer
            </Button>
          }
        />
      ) : (
        <>
          {/* Search + filter */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search volunteers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {volunteers?.filter(v => {
            const matchesSearch = !search ||
              v.full_name.toLowerCase().includes(search.toLowerCase()) ||
              (v.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
              v.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
            const matchesStatus = statusFilter === 'all' || v.status === statusFilter
            return matchesSearch && matchesStatus
          }).map(v => (
            <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-violet-100 text-violet-700 font-semibold">
                      {initials(v.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{v.full_name}</p>
                    {v.email && <p className="text-xs text-gray-400">{v.email}</p>}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'w-7 h-7 text-gray-400 -mr-1 -mt-1')}>
                    <MoreHorizontal className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => { setAssigning(v); setAssignProjectId(''); setAssignRole('') }}>
                      <UserPlus className="w-3.5 h-3.5 mr-2" />
                      Assign to project
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEdit(v)}>
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 mb-2.5">
                <Badge className={cn('text-xs font-medium border-0', VOLUNTEER_STATUS_COLORS[v.status])}>
                  {v.status}
                </Badge>
                {v.phone && <span className="text-xs text-gray-400">{v.phone}</span>}
              </div>

              {v.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {v.skills.slice(0, 4).map(skill => (
                    <span key={skill} className="text-xs px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded font-medium">
                      {skill}
                    </span>
                  ))}
                  {v.skills.length > 4 && (
                    <span className="text-xs text-gray-400">+{v.skills.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        </>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={o => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit volunteer' : 'Add volunteer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full name *</Label>
              <Input {...register('full_name')} placeholder="Jane Smith" />
              {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input {...register('email')} type="email" placeholder="jane@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...register('phone')} placeholder="(555) 000-0000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Skills <span className="text-gray-400 font-normal">(press Enter or comma to add)</span></Label>
              <Controller
                control={control}
                name="skills"
                render={({ field }) => (
                  <TagInput value={field.value} onChange={field.onChange} placeholder="e.g. fundraising, grant-writing" />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea {...register('notes')} rows={2} placeholder="Any additional notes..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editing ? 'Save' : 'Add volunteer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign to project dialog */}
      <Dialog open={!!assigning} onOpenChange={o => !o && setAssigning(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign {assigning?.full_name} to project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Project *</Label>
              <Select value={assignProjectId} onValueChange={setAssignProjectId}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Role / title</Label>
              <Input placeholder="e.g. Event coordinator" value={assignRole} onChange={e => setAssignRole(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssigning(null)}>Cancel</Button>
              <Button
                onClick={handleAssign}
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={!assignProjectId || assignVolunteer.isPending}
              >
                {assignVolunteer.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Assign
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

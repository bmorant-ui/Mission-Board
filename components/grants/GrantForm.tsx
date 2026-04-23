'use client'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { grantSchema, type GrantFormValues } from '@/lib/validations/grant.schema'
import { useCreateGrant, useUpdateGrant } from '@/lib/queries/grants'
import { useProjects } from '@/lib/queries/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DialogFooter } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Grant } from '@/types/app'
import { Controller } from 'react-hook-form'

const STATUS_OPTIONS = [
  { value: 'research', label: 'Research' },
  { value: 'drafting', label: 'Drafting' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'closed', label: 'Closed' },
]

interface GrantFormProps {
  grant?: Grant
  onClose: () => void
}

export function GrantForm({ grant, onClose }: GrantFormProps) {
  const { data: projects } = useProjects()
  const createGrant = useCreateGrant()
  const updateGrant = useUpdateGrant()

  const { register, control, handleSubmit, formState: { isSubmitting, errors } } = useForm<GrantFormValues>({
    resolver: zodResolver(grantSchema) as unknown as Resolver<GrantFormValues>,
    defaultValues: grant ? {
      title: grant.title,
      funder_name: grant.funder_name,
      funder_contact: grant.funder_contact ?? '',
      amount_requested: grant.amount_requested ?? undefined,
      amount_awarded: grant.amount_awarded ?? undefined,
      status: grant.status,
      deadline: grant.deadline ?? undefined,
      submission_date: grant.submission_date ?? undefined,
      report_due: grant.report_due ?? undefined,
      notes: grant.notes ?? '',
      project_id: grant.project_id ?? undefined,
    } : {
      status: 'research',
      title: '',
      funder_name: '',
    },
  })

  async function onSubmit(values: GrantFormValues) {
    try {
      if (grant) {
        await updateGrant.mutateAsync({ id: grant.id, ...values })
        toast.success('Grant updated')
      } else {
        await createGrant.mutateAsync(values)
        toast.success('Grant created')
      }
      onClose()
    } catch {
      toast.error(grant ? 'Failed to update grant' : 'Failed to create grant')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="title">Grant title *</Label>
          <Input id="title" {...register('title')} placeholder="e.g. Community Impact Grant 2025" />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="funder">Funder name *</Label>
          <Input id="funder" {...register('funder_name')} placeholder="Foundation or agency name" />
          {errors.funder_name && <p className="text-xs text-red-500">{errors.funder_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact">Funder contact</Label>
          <Input id="contact" {...register('funder_contact')} placeholder="email or name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="project">Linked project</Label>
          <Controller
            control={control}
            name="project_id"
            render={({ field }) => (
              <Select value={field.value ?? 'none'} onValueChange={v => field.onChange(v === 'none' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amount_requested">Amount requested ($)</Label>
          <Input id="amount_requested" type="number" step="0.01" {...register('amount_requested')} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amount_awarded">Amount awarded ($)</Label>
          <Input id="amount_awarded" type="number" step="0.01" {...register('amount_awarded')} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deadline">Application deadline</Label>
          <Input id="deadline" type="date" {...register('deadline')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="submission_date">Submission date</Label>
          <Input id="submission_date" type="date" {...register('submission_date')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report_due">Report due</Label>
          <Input id="report_due" type="date" {...register('report_due')} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register('notes')} placeholder="Additional notes..." rows={3} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {grant ? 'Save changes' : 'Create grant'}
        </Button>
      </DialogFooter>
    </form>
  )
}

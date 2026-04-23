'use client'
import { use, useState } from 'react'
import { useBudgetItems, useCreateBudgetItem, useUpdateBudgetItem, useDeleteBudgetItem } from '@/lib/queries/budget'
import { useGrants } from '@/lib/queries/grants'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { budgetItemSchema, type BudgetItemFormValues } from '@/lib/validations/budget.schema'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DollarSign, Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { Resolver } from 'react-hook-form'
import type { BudgetItem } from '@/types/app'
import { toast } from 'sonner'
import { Controller } from 'react-hook-form'

export default function BudgetPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const { data: items, isLoading } = useBudgetItems(projectId)
  const { data: grants } = useGrants()
  const createItem = useCreateBudgetItem()
  const updateItem = useUpdateBudgetItem()
  const deleteItem = useDeleteBudgetItem()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetItem | null>(null)

  const { register, control, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<BudgetItemFormValues>({
    resolver: zodResolver(budgetItemSchema) as unknown as Resolver<BudgetItemFormValues>,
    defaultValues: { budgeted: 0, actual: 0, category: '', description: '' },
  })

  function openCreate() {
    reset({ budgeted: 0, actual: 0, category: '', description: '' })
    setEditing(null)
    setOpen(true)
  }

  function openEdit(item: BudgetItem) {
    reset({
      category: item.category,
      description: item.description,
      budgeted: item.budgeted,
      actual: item.actual,
      notes: item.notes ?? '',
      grant_id: item.grant_id ?? undefined,
    })
    setEditing(item)
    setOpen(true)
  }

  async function onSubmit(values: BudgetItemFormValues) {
    try {
      if (editing) {
        await updateItem.mutateAsync({ id: editing.id, projectId, ...values })
        toast.success('Budget item updated')
      } else {
        await createItem.mutateAsync({ projectId, values, position: (items?.length ?? 0) * 1000 })
        toast.success('Budget item added')
      }
      setOpen(false)
      reset()
    } catch {
      toast.error('Failed to save budget item')
    }
  }

  async function handleDelete(item: BudgetItem) {
    try {
      await deleteItem.mutateAsync({ id: item.id, projectId })
      toast.success('Item deleted')
    } catch {
      toast.error('Failed to delete item')
    }
  }

  if (isLoading) return <LoadingSpinner />

  const totalBudgeted = items?.reduce((s, i) => s + i.budgeted, 0) ?? 0
  const totalActual = items?.reduce((s, i) => s + i.actual, 0) ?? 0
  const overallPct = totalBudgeted > 0 ? Math.round((totalActual / totalBudgeted) * 100) : 0
  const isOver = totalActual > totalBudgeted

  // Group by category
  const categories = [...new Set(items?.map(i => i.category) ?? [])]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Budget</h2>
          <p className="text-sm text-gray-500 mt-0.5">{items?.length ?? 0} line items</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add item
        </Button>
      </div>

      {/* Summary */}
      {items && items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total budget</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudgeted)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Actual spent</p>
              <p className={cn('text-2xl font-bold', isOver ? 'text-red-600' : 'text-green-600')}>
                {formatCurrency(totalActual)}
              </p>
            </div>
          </div>
          <Progress value={Math.min(overallPct, 100)} className={cn('h-2.5', isOver && '[&>div]:bg-red-500')} />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-400">{overallPct}% used</span>
            {isOver ? (
              <span className="text-xs text-red-600 font-medium">Over by {formatCurrency(totalActual - totalBudgeted)}</span>
            ) : (
              <span className="text-xs text-green-600 font-medium">{formatCurrency(totalBudgeted - totalActual)} remaining</span>
            )}
          </div>
        </div>
      )}

      {items?.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No budget items"
          description="Track budgeted vs. actual spending for this project."
          action={
            <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add first item
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category / Item</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Budgeted</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Progress</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items?.map(item => {
                const pct = item.budgeted > 0 ? Math.round((item.actual / item.budgeted) * 100) : 0
                const over = item.actual > item.budgeted
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.budgeted)}</td>
                    <td className={cn('px-4 py-3 text-right font-medium', over ? 'text-red-600' : 'text-gray-700')}>
                      {formatCurrency(item.actual)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(pct, 100)} className={cn('h-1.5 flex-1', over && '[&>div]:bg-red-500')} />
                        <span className={cn('text-xs w-8 text-right', over ? 'text-red-500 font-medium' : 'text-gray-400')}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'w-7 h-7 text-gray-400')}>
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem onClick={() => openEdit(item)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(item)}>
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {items && items.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-700">{formatCurrency(totalBudgeted)}</td>
                  <td className={cn('px-4 py-3 text-right font-semibold', isOver ? 'text-red-600' : 'text-green-600')}>
                    {formatCurrency(totalActual)}
                  </td>
                  <td colSpan={2} className="px-4 py-3 hidden md:table-cell" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={o => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit budget item' : 'Add budget item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Input {...register('category')} placeholder="e.g. Personnel" />
                {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Linked grant</Label>
                <Controller
                  control={control}
                  name="grant_id"
                  render={({ field }) => (
                    <Select value={field.value ?? 'none'} onValueChange={v => field.onChange(v === 'none' ? null : v)}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {grants?.map(g => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description *</Label>
                <Input {...register('description')} placeholder="e.g. Program coordinator salary" />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Budgeted ($)</Label>
                <Input type="number" step="0.01" {...register('budgeted')} placeholder="0.00" />
                {errors.budgeted && <p className="text-xs text-red-500">{errors.budgeted.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Actual ($)</Label>
                <Input type="number" step="0.01" {...register('actual')} placeholder="0.00" />
                {errors.actual && <p className="text-xs text-red-500">{errors.actual.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editing ? 'Save' : 'Add item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

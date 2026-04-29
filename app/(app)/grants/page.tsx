'use client'
import { useState } from 'react'
import { useGrants, useDeleteGrant } from '@/lib/queries/grants'
import { GrantForm } from '@/components/grants/GrantForm'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonTable } from '@/components/shared/Skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DollarSign, Plus, MoreHorizontal, Pencil, Trash2, Search } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { formatDate, formatCurrency, daysUntil, GRANT_STATUS_COLORS } from '@/lib/utils'
import type { Grant } from '@/types/app'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function GrantsPage() {
  const { data: grants, isLoading } = useGrants()
  const deleteGrant = useDeleteGrant()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Grant | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  async function handleDelete(id: string) {
    try {
      await deleteGrant.mutateAsync(id)
      toast.success('Grant deleted')
    } catch {
      toast.error('Failed to delete grant')
    }
  }

  function getDeadlineBadge(deadline: string | null) {
    if (!deadline) return null
    const days = daysUntil(deadline)
    if (days == null) return null
    if (days < 0) return <span className="text-xs text-red-500 font-medium">Overdue</span>
    if (days <= 14) return <span className="text-xs text-orange-500 font-medium">{days}d left</span>
    return null
  }

  if (isLoading) return <div className="p-6"><SkeletonTable rows={6} /></div>

  const totals = {
    requested: grants?.reduce((s, g) => s + (g.amount_requested ?? 0), 0) ?? 0,
    awarded: grants?.reduce((s, g) => s + (g.amount_awarded ?? 0), 0) ?? 0,
    awarded_count: grants?.filter(g => g.status === 'awarded').length ?? 0,
  }

  const filtered = grants?.filter(g => {
    const matchesSearch = !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.funder_name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grants</h1>
          <p className="text-sm text-gray-500 mt-0.5">{grants?.length ?? 0} grants tracked</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Grant
        </Button>
      </div>

      {/* Search + filter bar */}
      {grants && grants.length > 0 && (
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search grants..."
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
            <option value="research">Research</option>
            <option value="drafting">Drafting</option>
            <option value="submitted">Submitted</option>
            <option value="awarded">Awarded</option>
            <option value="rejected">Rejected</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      )}

      {/* Summary cards */}
      {grants && grants.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Requested', value: formatCurrency(totals.requested), color: 'text-blue-600' },
            { label: 'Total Awarded', value: formatCurrency(totals.awarded), color: 'text-green-600' },
            { label: 'Grants Awarded', value: `${totals.awarded_count} / ${grants.length}`, color: 'text-indigo-600' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              <p className={cn('text-xl font-bold mt-1', card.color)}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {grants?.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No grants yet"
          description="Track grant applications, deadlines, and funding amounts all in one place."
          action={
            <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add first grant
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Grant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Deadline</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Requested</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Awarded</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered?.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No grants match your search.</td></tr>
              )}
              {filtered?.map(grant => (
                <tr key={grant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{grant.title}</p>
                    <p className="text-xs text-gray-400">{grant.funder_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={cn(
                        'text-xs font-medium border-0',
                        GRANT_STATUS_COLORS[grant.status]
                      )}
                    >
                      {grant.status.charAt(0).toUpperCase() + grant.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{formatDate(grant.deadline)}</span>
                      {getDeadlineBadge(grant.deadline)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 hidden lg:table-cell">
                    {formatCurrency(grant.amount_requested)}
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    {grant.amount_awarded ? (
                      <span className="text-green-600 font-medium">{formatCurrency(grant.amount_awarded)}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'w-7 h-7 text-gray-400')}>
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => { setEditing(grant) }}>
                          <Pencil className="w-3.5 h-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(grant.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New grant</DialogTitle>
          </DialogHeader>
          <GrantForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit grant</DialogTitle>
          </DialogHeader>
          {editing && <GrantForm grant={editing} onClose={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

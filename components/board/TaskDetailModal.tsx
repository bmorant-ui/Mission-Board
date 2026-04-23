'use client'
import { useState, useEffect } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskSchema, type TaskFormValues } from '@/lib/validations/task.schema'
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
  useAddComment,
} from '@/lib/queries/tasks'
import { useProjectMembers } from '@/lib/queries/projects'
import { useBoardData } from '@/lib/queries/tasks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { TagInput } from '@/components/shared/TagInput'
import { formatDate } from '@/lib/utils'
import type { Task } from '@/types/app'
import { Trash2, Loader2, Send, CalendarDays, User, Tag, Flag } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TaskDetailModalProps {
  task: Task
  projectId: string
  onClose: () => void
}

export function TaskDetailModal({ task, projectId, onClose }: TaskDetailModalProps) {
  const { data: taskDetail } = useTask(task.id)
  const { data: board } = useBoardData(projectId)
  const { data: members } = useProjectMembers(projectId)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const addComment = useAddComment()

  const [commentBody, setCommentBody] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const current = taskDetail ?? task

  const { register, control, handleSubmit, reset, formState: { isDirty, isSubmitting } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as unknown as Resolver<TaskFormValues>,
    defaultValues: {
      title: current.title,
      description: current.description ?? '',
      priority: current.priority,
      due_date: current.due_date ?? undefined,
      assignee_id: current.assignee_id ?? undefined,
      tags: current.tags ?? [],
      column_id: current.column_id,
    },
  })

  useEffect(() => {
    reset({
      title: current.title,
      description: current.description ?? '',
      priority: current.priority,
      due_date: current.due_date ?? undefined,
      assignee_id: current.assignee_id ?? undefined,
      tags: current.tags ?? [],
      column_id: current.column_id,
    })
  }, [current, reset])

  async function onSubmit(values: TaskFormValues) {
    try {
      await updateTask.mutateAsync({ id: task.id, projectId, ...values })
      toast.success('Task updated')
    } catch {
      toast.error('Failed to update task')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteTask.mutateAsync({ id: task.id, projectId })
      toast.success('Task deleted')
      onClose()
    } catch {
      toast.error('Failed to delete task')
      setDeleting(false)
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim()) return
    setSubmittingComment(true)
    try {
      await addComment.mutateAsync({ taskId: task.id, body: commentBody.trim() })
      setCommentBody('')
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const comments = (taskDetail as { task_comments?: { id: string; body: string; created_at: string; author?: { full_name: string } }[] } | undefined)?.task_comments ?? []

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Edit Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <Input
            {...register('title')}
            placeholder="Task title"
            className="text-lg font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-indigo-500"
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Status / Column */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wide">
                Status
              </Label>
              <Controller
                control={control}
                name="column_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {board?.columns.map(col => (
                        <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wide">
                <Flag className="w-3 h-3" /> Priority
              </Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                        <SelectItem key={p} value={p}>
                          <div className="flex items-center gap-2">
                            <PriorityBadge priority={p} showLabel={false} />
                            <span className="capitalize">{p}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wide">
                <User className="w-3 h-3" /> Assignee
              </Label>
              <Controller
                control={control}
                name="assignee_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'unassigned'}
                    onValueChange={v => field.onChange(v === 'unassigned' ? null : v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members?.map(m => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.profile?.full_name ?? m.user_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wide">
                <CalendarDays className="w-3 h-3" /> Due date
              </Label>
              <Input
                type="date"
                {...register('due_date')}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500 uppercase tracking-wide">Description</Label>
            <Textarea
              {...register('description')}
              placeholder="Add a description..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wide">
              <Tag className="w-3 h-3" /> Tags
            </Label>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <TagInput value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button
                type="submit"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={!isDirty || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </div>
        </form>

        {/* Comments */}
        <div className="border-t pt-4 mt-2 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Comments {comments.length > 0 && `(${comments.length})`}</h4>
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                  {initials(comment.author?.full_name ?? 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-gray-800">{comment.author?.full_name ?? 'User'}</span>
                  <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{comment.body}</p>
              </div>
            </div>
          ))}

          <form onSubmit={handleComment} className="flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={commentBody}
              onChange={e => setCommentBody(e.target.value)}
              className="text-sm flex-1"
            />
            <Button
              type="submit"
              size="icon"
              className="bg-indigo-600 hover:bg-indigo-700 w-9 h-9"
              disabled={!commentBody.trim() || submittingComment}
            >
              {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

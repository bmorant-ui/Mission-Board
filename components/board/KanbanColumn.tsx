'use client'
import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from './TaskCard'
import type { Column, Task } from '@/types/app'
import { cn } from '@/lib/utils'
import { Plus, MoreHorizontal, Pencil, Trash2, X, Check } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useCreateTask, useUpdateColumn, useDeleteColumn } from '@/lib/queries/tasks'
import { toast } from 'sonner'

interface KanbanColumnProps {
  column: Column
  tasks: Task[]
  projectId: string
  onTaskOpen: (task: Task) => void
}

export function KanbanColumn({ column, tasks, projectId, onTaskOpen }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  })

  const [addingTask, setAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(column.title)

  const createTask = useCreateTask()
  const updateColumn = useUpdateColumn()
  const deleteColumn = useDeleteColumn()

  async function handleAddTask() {
    if (!newTaskTitle.trim()) { setAddingTask(false); return }
    try {
      await createTask.mutateAsync({
        projectId,
        values: {
          title: newTaskTitle.trim(),
          column_id: column.id,
          priority: 'medium',
          tags: [],
        },
        position: tasks.length * 1000,
      })
      setNewTaskTitle('')
      setAddingTask(false)
    } catch {
      toast.error('Failed to add task')
    }
  }

  async function handleRenameColumn() {
    if (!titleValue.trim() || titleValue === column.title) {
      setTitleValue(column.title)
      setEditingTitle(false)
      return
    }
    try {
      await updateColumn.mutateAsync({ id: column.id, projectId, title: titleValue.trim() })
      setEditingTitle(false)
    } catch {
      toast.error('Failed to rename column')
    }
  }

  async function handleDeleteColumn() {
    if (tasks.length > 0) {
      toast.error('Move or delete all tasks before removing this column')
      return
    }
    try {
      await deleteColumn.mutateAsync({ id: column.id, projectId })
    } catch {
      toast.error('Failed to delete column')
    }
  }

  const taskIds = tasks.map(t => t.id)

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {column.color && (
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
          )}
          {editingTitle ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={titleValue}
                onChange={e => setTitleValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRenameColumn()
                  if (e.key === 'Escape') { setTitleValue(column.title); setEditingTitle(false) }
                }}
                className="h-7 text-sm font-semibold py-0"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="w-6 h-6" onClick={handleRenameColumn}>
                <Check className="w-3.5 h-3.5 text-green-600" />
              </Button>
              <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => { setTitleValue(column.title); setEditingTitle(false) }}>
                <X className="w-3.5 h-3.5 text-gray-400" />
              </Button>
            </div>
          ) : (
            <span className="font-semibold text-sm text-gray-700 truncate">{column.title}</span>
          )}
          <span className="text-xs text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
            {tasks.length}
          </span>
        </div>
        {!editingTitle && (
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'w-6 h-6 text-gray-400 hover:text-gray-600 flex-shrink-0')}>
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setEditingTitle(true)}>
                <Pencil className="w-3.5 h-3.5 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={handleDeleteColumn}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Task list drop zone */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex flex-col gap-2 flex-1 min-h-16 rounded-xl p-2 transition-colors',
            isOver ? 'bg-indigo-50 border-2 border-dashed border-indigo-300' : 'bg-gray-100/50'
          )}
        >
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onOpen={onTaskOpen} />
          ))}

          {/* Add task inline */}
          {addingTask ? (
            <div className="space-y-1.5">
              <Input
                autoFocus
                placeholder="Task title..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddTask()
                  if (e.key === 'Escape') { setAddingTask(false); setNewTaskTitle('') }
                }}
                className="text-sm"
              />
              <div className="flex gap-1.5">
                <Button size="sm" className="h-7 bg-indigo-600 hover:bg-indigo-700 text-xs" onClick={handleAddTask}>
                  Add
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddingTask(false); setNewTaskTitle('') }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingTask(true)}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors group"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add task</span>
            </button>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

'use client'
import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { TaskDetailModal } from './TaskDetailModal'
import { useBoardData, useMoveTask, useCreateColumn } from '@/lib/queries/tasks'
import { useRealtimeBoard } from '@/hooks/useRealtimeBoard'
import type { Task, BoardData } from '@/types/app'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface KanbanBoardProps {
  projectId: string
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data: board, isLoading } = useBoardData(projectId)
  const moveTask = useMoveTask(projectId)
  const createColumn = useCreateColumn()
  useRealtimeBoard(projectId)

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (event.active.data.current?.type === 'task') {
      setActiveTask(event.active.data.current.task)
    }
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null)
      const { active, over } = event
      if (!over || !board) return

      const activeData = active.data.current
      if (activeData?.type !== 'task') return

      const taskId = active.id as string
      const overData = over.data.current

      let targetColumnId: string
      let targetPosition: number

      if (overData?.type === 'task') {
        // Dropped onto another task
        targetColumnId = overData.task.column_id
        const colTasks = board.tasks[targetColumnId] ?? []
        const overIndex = colTasks.findIndex(t => t.id === over.id)
        targetPosition = overIndex
      } else {
        // Dropped onto a column
        targetColumnId = over.id as string
        const colTasks = board.tasks[targetColumnId] ?? []
        targetPosition = colTasks.length
      }

      const currentTask = Object.values(board.tasks)
        .flat()
        .find(t => t.id === taskId)

      if (
        currentTask &&
        (currentTask.column_id !== targetColumnId ||
          currentTask.position !== targetPosition)
      ) {
        moveTask.mutate({ taskId, columnId: targetColumnId, position: targetPosition })
      }
    },
    [board, moveTask]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      // live column highlighting is handled by KanbanColumn's useDroppable
    },
    []
  )

  async function handleAddColumn() {
    if (!newColumnTitle.trim()) { setAddingColumn(false); return }
    try {
      await createColumn.mutateAsync({
        projectId,
        title: newColumnTitle.trim(),
        position: (board?.columns.length ?? 0) * 1000,
      })
      setNewColumnTitle('')
      setAddingColumn(false)
    } catch {
      toast.error('Failed to add column')
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (!board) return null

  const columnIds = board.columns.map(c => c.id)

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-4 p-4 overflow-x-auto h-full items-start pb-8">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {board.columns.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={board.tasks[column.id] ?? []}
                projectId={projectId}
                onTaskOpen={setSelectedTask}
              />
            ))}
          </SortableContext>

          {/* Add column */}
          <div className="flex-shrink-0 w-72">
            {addingColumn ? (
              <div className="space-y-2">
                <Input
                  autoFocus
                  placeholder="Column name..."
                  value={newColumnTitle}
                  onChange={e => setNewColumnTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddColumn()
                    if (e.key === 'Escape') { setAddingColumn(false); setNewColumnTitle('') }
                  }}
                  className="text-sm"
                />
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 bg-indigo-600 hover:bg-indigo-700 text-xs" onClick={handleAddColumn} disabled={createColumn.isPending}>
                    {createColumn.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddingColumn(false); setNewColumnTitle('') }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingColumn(true)}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100/60 hover:bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add column
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeTask && (
            <TaskCard task={activeTask} onOpen={() => {}} isDragOverlay />
          )}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={projectId}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  )
}

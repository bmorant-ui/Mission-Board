'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { BoardData, Column, Task } from '@/types/app'
import type { TaskFormValues } from '@/lib/validations/task.schema'

export function useBoardData(projectId: string) {
  return useQuery({
    queryKey: ['board', projectId],
    queryFn: async (): Promise<BoardData> => {
      const supabase = createClient()
      const [{ data: columns, error: colError }, { data: tasks, error: taskError }] =
        await Promise.all([
          supabase
            .from('columns')
            .select('*')
            .eq('project_id', projectId)
            .order('position'),
          supabase
            .from('tasks')
            .select('*, assignee:profiles(id, full_name, avatar_url)')
            .eq('project_id', projectId)
            .order('position'),
        ])

      if (colError) throw colError
      if (taskError) throw taskError

      const tasksByColumn: Record<string, Task[]> = {}
      ;(columns ?? []).forEach(col => { tasksByColumn[col.id] = [] })
      ;(tasks ?? []).forEach(task => {
        if (tasksByColumn[task.column_id]) {
          tasksByColumn[task.column_id].push(task as Task)
        }
      })

      return { columns: columns ?? [], tasks: tasksByColumn }
    },
    enabled: !!projectId,
  })
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tasks')
        .select('*, assignee:profiles(id, full_name, avatar_url), task_comments(*, author:profiles(*))')
        .eq('id', taskId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!taskId,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      values,
      position,
    }: {
      projectId: string
      values: TaskFormValues
      position: number
    }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...values, project_id: projectId, created_by: user.id, position })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId, ...values }: Partial<Task> & { id: string; projectId: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tasks')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['board', data.project_id] })
      queryClient.invalidateQueries({ queryKey: ['tasks', data.id] })
    },
  })
}

export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      taskId,
      columnId,
      position,
    }: { taskId: string; columnId: string; position: number }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update({ column_id: columnId, position })
        .eq('id', taskId)
      if (error) throw error
    },
    onMutate: async ({ taskId, columnId, position }) => {
      await queryClient.cancelQueries({ queryKey: ['board', projectId] })
      const previous = queryClient.getQueryData<BoardData>(['board', projectId])

      queryClient.setQueryData<BoardData>(['board', projectId], old => {
        if (!old) return old
        const updated: BoardData = {
          columns: old.columns,
          tasks: Object.fromEntries(
            Object.entries(old.tasks).map(([colId, tasks]) => [colId, [...tasks]])
          ),
        }

        let movedTask: Task | undefined
        Object.keys(updated.tasks).forEach(colId => {
          const idx = updated.tasks[colId].findIndex(t => t.id === taskId)
          if (idx !== -1) {
            movedTask = { ...updated.tasks[colId][idx], column_id: columnId }
            updated.tasks[colId] = updated.tasks[colId].filter(t => t.id !== taskId)
          }
        })

        if (movedTask) {
          const col = [...(updated.tasks[columnId] ?? [])]
          col.splice(position, 0, movedTask)
          updated.tasks[columnId] = col.map((t, i) => ({ ...t, position: i }))
        }
        return updated
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['board', projectId], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const supabase = createClient()
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      return { projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] })
    },
  })
}

export function useCreateColumn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, title, position }: { projectId: string; title: string; position: number }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('columns')
        .insert({ project_id: projectId, title, position })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] })
    },
  })
}

export function useUpdateColumn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId, ...values }: Partial<Column> & { id: string; projectId: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('columns')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] })
    },
  })
}

export function useDeleteColumn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const supabase = createClient()
      const { error } = await supabase.from('columns').delete().eq('id', id)
      if (error) throw error
      return { projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] })
    },
  })
}

export function useAddComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, body }: { taskId: string; body: string }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('task_comments')
        .insert({ task_id: taskId, author_id: user.id, body })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })
    },
  })
}

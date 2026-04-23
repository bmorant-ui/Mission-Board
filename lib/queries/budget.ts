'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { BudgetItem } from '@/types/app'
import type { BudgetItemFormValues } from '@/lib/validations/budget.schema'

export function useBudgetItems(projectId: string) {
  return useQuery({
    queryKey: ['budget', projectId],
    queryFn: async (): Promise<BudgetItem[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('project_id', projectId)
        .order('position')
      if (error) throw error
      return data ?? []
    },
    enabled: !!projectId,
  })
}

export function useCreateBudgetItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      values,
      position,
    }: {
      projectId: string
      values: BudgetItemFormValues
      position: number
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('budget_items')
        .insert({ ...values, project_id: projectId, position })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] })
    },
  })
}

export function useUpdateBudgetItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId, ...values }: Partial<BudgetItem> & { id: string; projectId: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('budget_items')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return { ...data, projectId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budget', data.project_id ?? data.projectId] })
    },
  })
}

export function useDeleteBudgetItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const supabase = createClient()
      const { error } = await supabase.from('budget_items').delete().eq('id', id)
      if (error) throw error
      return { projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] })
    },
  })
}

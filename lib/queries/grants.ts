'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Grant } from '@/types/app'
import type { GrantFormValues } from '@/lib/validations/grant.schema'

export function useGrants() {
  return useQuery({
    queryKey: ['grants'],
    queryFn: async (): Promise<Grant[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('grants')
        .select('*')
        .order('deadline', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useGrant(grantId: string) {
  return useQuery({
    queryKey: ['grants', grantId],
    queryFn: async (): Promise<Grant | null> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('grants')
        .select('*')
        .eq('id', grantId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!grantId,
  })
}

export function useCreateGrant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: GrantFormValues) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('grants')
        .insert({ ...values, created_by: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grants'] })
    },
  })
}

export function useUpdateGrant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Grant> & { id: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('grants')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['grants'] })
      queryClient.invalidateQueries({ queryKey: ['grants', data.id] })
    },
  })
}

export function useDeleteGrant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('grants').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grants'] })
    },
  })
}

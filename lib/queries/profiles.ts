'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/app'

export function useAllProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as (Profile & { email?: string })[]
    },
  })
}

export function useUpdateProfileRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
  })
}
